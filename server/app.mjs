import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import Groq from "groq-sdk";
import "dotenv/config";

const app = express();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const sessions = new Map();
let groqClient, googleClient;

export function getGroq() {
    if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    return groqClient;
}
export function getGoogleClient() {
    if (!googleClient) googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    return googleClient;
}
export function resetSessions() { sessions.clear(); }

app.use(cors({ origin: ["http://localhost:5173"], methods: ["GET", "POST"], credentials: true }));
app.use(express.json());
app.use('/music', express.static('public/music'));

const COLOR_MAP = {
    rouge: 0xFF0000, red: 0xFF0000, crimson: 0xDC143C,
    bleu: 0x0000FF, blue: 0x0000FF, "bleu ciel": 0x87CEEB, cyan: 0x00FFFF,
    vert: 0x00FF00, green: 0x00FF00, emerald: 0x50C878,
    jaune: 0xFFFF00, yellow: 0xFFFF00, or: 0xFFD700, gold: 0xFFD700,
    violet: 0x800080, purple: 0x800080, magenta: 0xFF00FF,
    orange: 0xFFA500, coral: 0xFF7F50,
    rose: 0xFF69B4, pink: 0xFF69B4,
    noir: 0x111111, black: 0x111111,
    blanc: 0xFFFFFF, white: 0xFFFFFF,
    gris: 0x808080, gray: 0x808080, silver: 0xC0C0C0,
    turquoise: 0x40E0D0, teal: 0x008080,
    marron: 0x8B4513, brown: 0x8B4513,
    indigo: 0x4B0082, navy: 0x000080,
    neon: 0x39FF14, fluo: 0x39FF14,
    multicolore: 0xFF00FF, rainbow: 0xFF00FF,
    "deep space": 0x0a0a2e
};

const STYLE_SKY_COLORS = {
    mystique:  { primary: 0x4a0080, secondary: 0x00d4ff, vibe: "mystique",  energy: "medium" },
    realistic: { primary: 0x1a237e, secondary: 0xff6f00, vibe: "neutral",   energy: "medium" },
    neon:      { primary: 0xff00ff, secondary: 0x39ff14, vibe: "energetic", energy: "high"   },
    abstract:  { primary: 0xff1744, secondary: 0x00e5ff, vibe: "chaotic",   energy: "high"   },
    "low-poly":{ primary: 0xffd700, secondary: 0xff4081, vibe: "energetic", energy: "high"   }
};

function parseColor(colorStr) {
    if (!colorStr) return 0x4F86F7;
    const n = colorStr.toLowerCase().trim();
    if (COLOR_MAP[n]) return COLOR_MAP[n];
    for (const [k, v] of Object.entries(COLOR_MAP)) if (n.includes(k)) return v;
    if (n.startsWith('#'))  return parseInt(n.slice(1), 16);
    if (n.startsWith('0x')) return parseInt(n, 16);
    return Math.floor(Math.random() * 0xFFFFFF);
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOLS
// ─────────────────────────────────────────────────────────────────────────────
const TOOLS = [
    {
        type: "function",
        function: {
            name: "createPlanet",
            description: "Create a NEW planet. ONLY call after exactly 5 answers collected (name, color, atmosphere, element, trait). NEVER call with fewer.",
            parameters: {
                type: "object",
                properties: {
                    name:       { type: "string" },
                    color:      { type: "string" },
                    atmosphere: { type: "string" },
                    element:    { type: "string" },
                    trait:      { type: "string" }
                },
                required: ["name", "color", "atmosphere", "element", "trait"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "updatePlanetColor",
            description: "Change the color of an EXISTING planet. Use when user says things like 'couleur de planète en X', 'change la planète en X', 'planètes en bleu'. Use planetIndex -1 for last planet.",
            parameters: {
                type: "object",
                properties: {
                    planetIndex: { type: "number",  description: "0-based index. -1 = last planet." },
                    planetName:  { type: "string",  description: "Name to match (optional)" },
                    color:       { type: "string" }
                },
                required: ["color"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "changeSky",
            description: "Change sky/star color. Use for 'change le ciel en X' or 'change la couleur en X' when not about a planet or sun.",
            parameters: {
                type: "object",
                properties: {
                    primaryColor:   { type: "string" },
                    secondaryColor: { type: "string" },
                    intensity:      { type: "string", enum: ["low", "medium", "high"] }
                },
                required: ["primaryColor"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "changeSun",
            description: "Change the central star color. ONLY call when user explicitly says 'soleil', 'étoile centrale', or 'sun'. NEVER call automatically.",
            parameters: {
                type: "object",
                properties: { color: { type: "string" } },
                required: ["color"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "setVibe",
            description: "Set universe vibe and energy. Use only valid enum values.",
            parameters: {
                type: "object",
                properties: {
                    vibe:   { type: "string", enum: ["lonely", "energetic", "mystique", "chaotic", "neutral"] },
                    energy: { type: "string", enum: ["low", "medium", "high"] }
                },
                required: ["vibe", "energy"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "completeUniverse",
            description: "Mark universe complete only when user says they are done",
            parameters: { type: "object", properties: {}, additionalProperties: false }
        }
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// ACTIONS
// ─────────────────────────────────────────────────────────────────────────────
const ACTIONS = {
    createPlanet(session, args) {
        const n = session.allPlanets.length + 1;
        const planet = {
            name:      args.name       || `Planete ${n}`,
            color:     parseColor(args.color),
            atmosphere: args.atmosphere || "unknown",
            element:   args.element    || "rock",
            trait:     args.trait      || "mysterious",
            size:      5 + Math.random() * 8,
            dist:      80 + n * 70,
            speed:     0.003 + Math.random() * 0.005,
            hasRings:  args.element === "ice" || Math.random() > 0.65,
            hasClouds: Math.random() > 0.3
        };
        session.allPlanets.push(planet);
        session.currentPlanetAnswers = [];
        console.log(`Planet created: ${planet.name} (total: ${session.allPlanets.length})`);
        return planet;
    },

    updatePlanetColor(session, args) {
        if (session.allPlanets.length === 0) {
            console.warn('updatePlanetColor: no planets yet');
            return { error: "no planets" };
        }
        let idx;
        if (args.planetName) {
            const nameIdx = session.allPlanets.findIndex(
                p => p.name.toLowerCase().includes(args.planetName.toLowerCase())
            );
            if (nameIdx !== -1) idx = nameIdx;
        }
        if (idx === undefined && args.planetIndex !== undefined) {
            idx = args.planetIndex === -1
                ? session.allPlanets.length - 1
                : Math.min(Math.max(0, args.planetIndex), session.allPlanets.length - 1);
        }
        if (idx === undefined) idx = session.allPlanets.length - 1;

        const newColor = parseColor(args.color);
        session.allPlanets[idx].color = newColor;
        console.log(`Planet[${idx}] "${session.allPlanets[idx].name}" color → #${newColor.toString(16)}`);
        return { updatedIndex: idx, name: session.allPlanets[idx].name, color: newColor };
    },

    changeSky(session, args) {
        session.skyTheme = {
            primaryColor:   parseColor(args.primaryColor),
            secondaryColor: args.secondaryColor ? parseColor(args.secondaryColor) : parseColor(args.primaryColor),
            intensity:      args.intensity || "medium"
        };
        return session.skyTheme;
    },

    changeSun(session, args) {
        if (!session.sunColorLocked) {
            session.sunColor = parseColor(args.color);
            session.sunColorLocked = true;
            console.log(`Sun color set → #${session.sunColor.toString(16)} — LOCKED`);
        } else if (session.userRequestedSunChange) {
            session.sunColor = parseColor(args.color);
            console.log(`Sun color updated by user → #${session.sunColor.toString(16)}`);
        } else {
            console.log('changeSun blocked — locked & no user request');
        }
        session.userRequestedSunChange = false;
        return { sunColor: session.sunColor };
    },

    setVibe(session, args) {
        // Normalise to valid enum values in case model drifts
        const validVibes   = ["lonely", "energetic", "mystique", "chaotic", "neutral"];
        const validEnergies = ["low", "medium", "high"];
        session.vibe   = validVibes.includes(args.vibe)     ? args.vibe   : "neutral";
        session.energy = validEnergies.includes(args.energy) ? args.energy : "medium";
        return { vibe: session.vibe, energy: session.energy };
    },

    completeUniverse(session) {
        session.isComplete = true;
        return { done: true };
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function isCommandMessage(message) {
    if (!message) return false;
    const t = message.trim();
    if (t.includes('[Mise à jour') || t.includes('[Préférences') || t.includes('Préférences utilisateur')) return true;
    if (/^(change|modifie|mets |met |rends|crée une autre|ajoute|terminé|done|complet|non\b|stop\b|fini\b|c'est bon|oui\b|une autre|continue|ok\b|okay\b)/i.test(t)) return true;
    if (/couleur.*(plan[eè]te|soleil|ciel|étoile)/i.test(t)) return true;
    if (/(plan[eè]te|soleil|ciel).*(couleur)/i.test(t)) return true;
    return false;
}

function userWantsSunChange(message) {
    if (!message) return false;
    return /change.*(soleil|sun|étoile centrale)|soleil.*(change|couleur|devient|mettre|rends)/i.test(message);
}

function splitCompoundAnswer(message, currentAnswerCount) {
    const t = message.trim();
    if (currentAnswerCount < 2 || currentAnswerCount > 3) return [t];
    const match = t.match(/^(.+?)\s+(?:et|and|,|\/|-)\s+(.+)$/i);
    if (!match) return [t];
    const a = match[1].trim();
    const b = match[2].trim();
    if (a.split(' ').length <= 5 && b.split(' ').length <= 5) {
        console.log(`Split compound answer → ["${a}", "${b}"]`);
        return [a, b];
    }
    return [t];
}

function applyStyleSky(session) {
    const style  = session.setupStyle || 'mystique';
    const colors = STYLE_SKY_COLORS[style];
    if (colors) {
        session.skyTheme = {
            primaryColor:   colors.primary,
            secondaryColor: colors.secondary,
            intensity:      colors.energy === 'high' ? 'high' : 'medium'
        };
        session.vibe   = colors.vibe;
        session.energy = colors.energy;
        console.log(`Style sky applied: ${style} → primary=#${colors.primary.toString(16)}, secondary=#${colors.secondary.toString(16)}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
function getSystemPrompt(session) {
    const answers      = session.currentPlanetAnswers || [];
    const planetsBuilt = session.allPlanets.length;
    const sunSetupDone = session.sunSetupDone;
    const isComplete   = session.isComplete;

    const labels = [
        "le NOM de la planète",
        "sa COULEUR principale",
        "son ATMOSPHÈRE ou ambiance (ex: brumeuse, volcanique, cristalline)",
        "son ÉLÉMENT dominant (feu / eau / roche / air / glace / foudre)",
        "son TRAIT SPÉCIAL ou secret (ex: elle chante, elle tourne à l'envers)"
    ];
    const nextQ     = answers.length < 5 ? labels[answers.length] : null;
    const setupInfo = session.setupVibe
        ? `Préférences utilisateur: vibe="${session.setupVibe}", style="${session.setupStyle || 'mystique'}"`
        : '';
    const planetsInfo = planetsBuilt > 0
        ? session.allPlanets.map((p, i) => `  [${i}] "${p.name}"`).join('\n')
        : '  (aucune)';

    const completionNote = isComplete
        ? `\n⚠️ UNIVERS TERMINÉ — NE PLUS poser de questions de planète. Réponds de manière conversationnelle.`
        : '';

    return `Tu es HoloSpace, créateur d'univers mystérieux. Tu parles français. Réponses courtes et poétiques (max 2 phrases).
${setupInfo}

══════════════════════════════════
ÉTAT ACTUEL
══════════════════════════════════
PHASE SOLEIL   : ${sunSetupDone ? 'TERMINÉE — soleil verrouillé, NE PLUS TOUCHER' : 'EN ATTENTE — demande la couleur du soleil en premier'}
Planètes créées: ${planetsBuilt}
${planetsInfo}
Réponses planet: ${answers.length} / 5
${answers.length > 0 ? answers.map((a, i) => `  Q${i+1} [${labels[i]}] = "${a}"`).join('\n') : '  (aucune)'}
Prochaine question: ${nextQ ? `"${nextQ}"` : 'TOUTES COLLECTÉES → appelle createPlanet() MAINTENANT'}
Univers complet: ${isComplete ? 'OUI' : 'NON'}
${completionNote}

══════════════════════════════════
RÈGLES — DANS L'ORDRE
══════════════════════════════════

━━ ÉTAPE 0 : SOLEIL (sunSetupDone = false) ━━
→ Demande : "Quelle couleur pour l'étoile centrale de ton univers ?"
→ Réponse reçue → appelle changeSun() → LOCK définitif
→ NE JAMAIS rappeler changeSun() sans demande explicite

━━ ÉTAPE 1 : COLLECTE (sunSetupDone = true, answers.length < 5, isComplete = false) ━━
→ Pose UNE SEULE question : "${nextQ || '(toutes collectées)'}"
→ 1 phrase de confirmation, puis QUESTION SUIVANTE
→ JAMAIS 2 questions dans le même message
→ JAMAIS appeler createPlanet() avant 5 réponses

━━ ÉTAPE 2 : CRÉATION (answers.length = 5, isComplete = false) ━━
→ Appelle createPlanet() avec les 5 réponses
→ NE PAS appeler changeSky/changeSun ici
→ Demande : "Veux-tu une autre planète ou c'est terminé ?"

━━ MODIFICATION COULEUR D'UNE PLANÈTE ━━
→ "couleur de planète en X" / "planètes en X" / "change la planète en X"
→ Appelle updatePlanetColor(color=X, planetIndex=-1) pour la dernière planète
→ Ce message n'est PAS une réponse de collecte

━━ MODIFICATION CIEL ━━
→ "change le ciel en X" / "change la couleur en X" (sans planète/soleil)
→ Appelle changeSky()

━━ MODIFICATION SOLEIL (après setup) ━━
→ Seulement si l'utilisateur dit explicitement "change le soleil" / "étoile centrale"
→ Appelle changeSun()

━━ TERMINER ━━
→ "non" / "c'est bon" / "terminé" / "stop" / "fini"
→ Appelle setVibe() + changeSky() + completeUniverse()
→ Pour setVibe: utilise UNIQUEMENT vibe parmi [lonely, energetic, mystique, chaotic, neutral] et energy parmi [low, medium, high]
→ NE PAS appeler changeSun()

━━ CONTINUER ━━
→ "oui" / "une autre" / "continue"
→ Recommence ÉTAPE 1 — pose immédiatement Q1 (nom)

━━ UNIVERS COMPLET (isComplete = true) ━━
→ Réponds de manière conversationnelle et poétique
→ NE PAS compter ses mots comme réponses de planète
→ NE PAS appeler createPlanet()

══════════════════════════════════
INTERDIT
══════════════════════════════════
✗ 2 questions dans le même message
✗ Inventer des réponses manquantes
✗ createPlanet() sans 5 réponses
✗ createPlanet() quand isComplete = true
✗ changeSun() automatique
✗ setVibe() avec des valeurs hors enum
✗ Réponses > 2 phrases`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATION RUNNER
// ─────────────────────────────────────────────────────────────────────────────
async function runConversation(session, userMessage) {
    if (userMessage && userWantsSunChange(userMessage)) {
        session.userRequestedSunChange = true;
    }

    if (userMessage && userMessage.trim() && session.sunSetupDone && !isCommandMessage(userMessage) && !session.isComplete) {
        const parts = splitCompoundAnswer(userMessage.trim(), session.currentPlanetAnswers.length);
        for (const part of parts) {
            if (session.currentPlanetAnswers.length < 5) {
                session.currentPlanetAnswers.push(part);
                console.log(`Answer ${session.currentPlanetAnswers.length}/5: "${part}"`);
            }
        }
    }

    if (!session.sunSetupAsked) session.sunSetupAsked = true;

    const messages = [
        { role: "system", content: getSystemPrompt(session) },
        ...session.history.slice(-20),
        { role: "user", content: userMessage || "Bonjour, commence mon univers" }
    ];

    const model = "llama-3.3-70b-versatile";

    // ── Groq call with retry + no-tools fallback ──────────────────────────────
    let response;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            response = await getGroq().chat.completions.create({
                model,
                messages,
                tools: TOOLS,
                tool_choice: "auto",
                temperature: 0.7,
                max_tokens: 500
            });
            break; // success
        } catch (e) {
            const isBadTool = e.status === 400 && e.error?.error?.code === 'tool_use_failed';
            if (isBadTool && attempt < 3) {
                console.warn(`Tool call malformed (attempt ${attempt}/3), retrying…`);
                await new Promise(r => setTimeout(r, 300 * attempt));
                continue;
            }
            // Last attempt or non-tool error: fall back to plain completion
            console.warn('Falling back to no-tools completion:', e.message);
            response = await getGroq().chat.completions.create({
                model,
                messages,
                temperature: 0.7,
                max_tokens: 500
            });
            break;
        }
    }

    const msg = response.choices?.[0]?.message;
    if (!msg) throw new Error("No response from Groq");

    const toolCalls  = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
    const toolResults = [];

    for (const toolCall of toolCalls) {
        const name = toolCall.function?.name;
        let args = {};
        try {
            args = JSON.parse(toolCall.function?.arguments || "{}");
        } catch (e) {
            console.error("Bad tool JSON, skipping:", e);
            continue; // skip malformed tool call instead of crashing
        }

        if (name === 'createPlanet' && ((session.currentPlanetAnswers?.length ?? 0) < 5 || session.isComplete)) {
            console.warn(`Blocked createPlanet — ${session.currentPlanetAnswers?.length}/5 answers, isComplete=${session.isComplete}`);
            continue;
        }
        if (name === 'changeSun' && session.sunColorLocked && !session.userRequestedSunChange) {
            console.warn('Blocked changeSun — locked');
            continue;
        }

        if (ACTIONS[name]) {
            const result = ACTIONS[name](session, args);
            toolResults.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) });

            if (name === 'changeSun') {
                session.sunSetupDone    = true;
                session.sunColorLocked  = true;
                console.log('Sun setup complete — LOCKED');
            }
        }
    }

    let finalMessage = msg.content || "";
    if (toolResults.length > 0) {
        const followUp = await getGroq().chat.completions.create({
            model,
            messages: [...messages, msg, ...toolResults],
            temperature: 0.7,
            max_tokens: 250
        });
        finalMessage = followUp.choices?.[0]?.message?.content || finalMessage;
    }

    return {
        message:   finalMessage || "✨ ...",
        toolsUsed: toolCalls.map(t => t.function?.name).filter(Boolean)
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
    try {
        const { sessionId, userMessage } = req.body;
        if (!sessionId) return res.status(400).json({ error: "sessionId required" });

        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, {
                history:               [],
                allPlanets:            [],
                currentPlanetAnswers:  [],
                skyTheme:              null,
                sunColor:              null,
                sunColorLocked:        false,
                sunSetupDone:          false,
                sunSetupAsked:         false,
                userRequestedSunChange: false,
                vibe:                  "neutral",
                energy:                "medium",
                isComplete:            false,
                setupVibe:             null,
                setupStyle:            null
            });
        }

        const session = sessions.get(sessionId);

        // Extract vibe/style from preference messages (first time)
        if (userMessage && !session.setupVibe) {
            const vibeMatch  = userMessage.match(/vibe="([^"]+)"/);
            const styleMatch = userMessage.match(/style="([^"]+)"/);
            if (vibeMatch)  session.setupVibe  = vibeMatch[1];
            if (styleMatch) {
                session.setupStyle = styleMatch[1];
                applyStyleSky(session);
            }
        }

        // Handle preference updates after sun is already set
        if (userMessage && session.sunSetupDone) {
            const vibeMatch  = userMessage.match(/vibe="([^"]+)"/);
            const styleMatch = userMessage.match(/style="([^"]+)"/);
            if (vibeMatch || styleMatch) {
                if (vibeMatch)  session.setupVibe  = vibeMatch[1];
                if (styleMatch) {
                    session.setupStyle = styleMatch[1];
                    applyStyleSky(session);
                }
                console.log(`Preferences updated: vibe=${session.setupVibe}, style=${session.setupStyle}`);
            }
        }

        if (userMessage && userMessage.trim()) {
            session.history.push({ role: "user", content: userMessage });
        }

        const result = await runConversation(session, userMessage);

        if (result.message) {
            session.history.push({ role: "assistant", content: result.message });
        }

        let environment = null;
        if (session.skyTheme || session.sunColor) {
            environment = {
                vibe:           session.vibe,
                energy:         session.energy,
                primaryColor:   session.skyTheme?.primaryColor   ?? null,
                secondaryColor: session.skyTheme?.secondaryColor ?? null,
                intensity:      session.skyTheme?.intensity      ?? "medium",
                sunColor:       session.sunColor                 ?? null,
                sunLocked:      session.sunColorLocked
            };
        }

        return res.json({
            message:               result.message,
            planets:               session.allPlanets.length > 0 ? session.allPlanets : null,
            environment,
            toolsUsed:             result.toolsUsed,
            isComplete:            session.isComplete,
            totalPlanetsCreated:   session.allPlanets.length,
            currentPlanetProgress: session.currentPlanetAnswers?.length ?? 0,
            sunLocked:             session.sunColorLocked
        });

    } catch (e) {
        console.error("Chat error:", e);
        res.status(500).json({ error: "AI request failed", detail: e.message });
    }
});

app.post("/auth/google", async (req, res) => {
    try {
        const { token }   = req.body;
        const ticket      = await getGoogleClient().verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
        const payload     = ticket.getPayload();
        const userJwt     = jwt.sign({ userId: payload.sub, email: payload.email }, JWT_SECRET, { expiresIn: "7d" });
        res.json({
            success: true,
            jwt: userJwt,
            user: {
                given_name: payload.given_name,   // ← fixed: was `name`
                name:       payload.name,
                picture:    payload.picture,
                email:      payload.email
            }
        });
    } catch (err) {
        res.status(401).json({ error: "Invalid Google token" });
    }
});

function verifyToken(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(403).json({ error: "No token" });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Invalid token" });
        req.user = decoded;
        next();
    });
}

app.get("/user/profile", verifyToken, (req, res) => res.json({ success: true, user: req.user }));

export { app, sessions };