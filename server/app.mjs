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

let groqClient;
let googleClient;

export function getGroq() {
    if (!groqClient) {
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
}
export function getGoogleClient() {
    if (!googleClient) {
        googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    }
    return googleClient;
}

export function resetSessions() {
    sessions.clear();
}

app.use(cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(express.json());

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

function parseColor(colorStr) {
    if (!colorStr) return 0x4F86F7;
    const normalized = colorStr.toLowerCase().trim();
    if (COLOR_MAP[normalized]) return COLOR_MAP[normalized];
    for (const [key, value] of Object.entries(COLOR_MAP)) {
        if (normalized.includes(key)) return value;
    }
    if (normalized.startsWith('#')) return parseInt(normalized.slice(1), 16);
    if (normalized.startsWith('0x')) return parseInt(normalized, 16);
    return Math.floor(Math.random() * 0xFFFFFF);
}

const TOOLS = [
    {
        type: "function",
        function: {
            name: "createPlanet",
            description: "Create a planet once you have collected all 5 answers from the user for this planet",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Planet name given by user" },
                    color: { type: "string", description: "Color given by user (e.g. rouge, bleu, violet)" },
                    atmosphere: { type: "string", description: "Atmosphere or ambiance described by user" },
                    element: { type: "string", description: "Dominant element: fire, water, rock, air, ice, lightning" },
                    trait: { type: "string", description: "Special trait or unique feature of this planet" }
                },
                required: ["name", "color", "atmosphere", "element", "trait"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "changeSky",
            description: "Change the sky and star color of the universe",
            parameters: {
                type: "object",
                properties: {
                    primaryColor: { type: "string", description: "Main sky color (e.g. rouge, violet, cyan)" },
                    secondaryColor: { type: "string", description: "Secondary color (optional)" },
                    intensity: { type: "string", enum: ["low", "medium", "high"] }
                },
                required: ["primaryColor"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "changeSun",
            description: "Change the color of the central sun",
            parameters: {
                type: "object",
                properties: {
                    color: { type: "string", description: "Sun color (e.g. orange, rouge, blanc, or)" }
                },
                required: ["color"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "setVibe",
            description: "Set the overall vibe and energy of the universe",
            parameters: {
                type: "object",
                properties: {
                    vibe: { type: "string", description: "One of: lonely, energetic, mystique, chaotic, neutral" },
                    energy: { type: "string", description: "One of: low, medium, high" }
                },
                required: ["vibe"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "completeUniverse",
            description: "Call this only when all planets are created and sky/sun/vibe have been set",
            parameters: {
                type: "object",
                properties: {},
                additionalProperties: false
            }
        }
    }
];

const ACTIONS = {
    createPlanet(session, args) {
        const planetNum = session.allPlanets.length + 1;
        const planet = {
            name: args.name || `Planète ${planetNum}`,
            color: parseColor(args.color),
            atmosphere: args.atmosphere || "unknown",
            element: args.element || "rock",
            trait: args.trait || "mysterious",
            size: 5 + Math.random() * 8,
            dist: 80 + (planetNum * 70),
            speed: 0.003 + Math.random() * 0.005,
            hasRings: args.element === "ice" || Math.random() > 0.65,
            hasClouds: Math.random() > 0.3
        };
        session.allPlanets.push(planet);
        session.currentPlanetAnswers = [];
        console.log(`Planet created: ${planet.name}`);
        return planet;
    },

    changeSky(session, args) {
        session.skyTheme = {
            primaryColor: parseColor(args.primaryColor),
            secondaryColor: args.secondaryColor
                ? parseColor(args.secondaryColor)
                : parseColor(args.primaryColor),
            intensity: args.intensity || "medium"
        };
        return session.skyTheme;
    },

    changeSun(session, args) {
        session.sunColor = parseColor(args.color);
        return { sunColor: session.sunColor };
    },

    setVibe(session, args) {
        session.vibe = args.vibe;
        session.energy = args.energy || "medium";
        return { vibe: session.vibe, energy: session.energy };
    },

    completeUniverse(session) {
        session.isComplete = true;
        return { done: true };
    }
};

function getSystemPrompt(session) {
    const planetsBuilt = session.allPlanets.length;
    const answers = session.currentPlanetAnswers || [];
    const TARGET = 2;
    const questionLabels = [
        "le NOM de la planète",
        "sa COULEUR principale",
        "son ATMOSPHÈRE ou ambiance (ex: brumeuse, volcanique, cristalline, glacée)",
        "son ÉLÉMENT dominant (feu / eau / roche / air / glace / foudre)",
        "son TRAIT SPÉCIAL ou secret (ex: elle chante la nuit, elle tourne à l'envers)"
    ];
    const nextQuestion = answers.length < 5 ? questionLabels[answers.length] : null;

    return `Tu es HoloSpace, un créateur d'univers mystérieux. Tu parles en français. Tes réponses sont courtes et poétiques (max 3 phrases).

══ ÉTAT ══
Planètes construites : ${planetsBuilt} / ${TARGET}
Réponses collectées pour la planète en cours : ${answers.length} / 5
${answers.length > 0 ? `Réponses : ${answers.map((a, i) => `[${questionLabels[i]}] "${a}"`).join(' | ')}` : '(aucune encore)'}
Prochaine info à collecter : ${nextQuestion ? `→ "${nextQuestion}"` : '→ TOUTES COLLECTÉES, crée la planète maintenant'}

══ RÈGLES STRICTES ══

SI answers.length < 5 ET planetsBuilt < ${TARGET} :
  → Pose UNE seule question : "${nextQuestion}"
  → Confirme la réponse précédente en 1 phrase courte, puis pose la suivante
  → NE crée PAS la planète

SI answers.length === 5 :
  → Appelle createPlanet() IMMÉDIATEMENT avec les 5 réponses
  → Si planetsBuilt sera < ${TARGET} : annonce la planète, puis demande le nom de la suivante
  → Si planetsBuilt sera === ${TARGET} : appelle setVibe() + changeSky() + changeSun() selon l'ambiance des planètes, puis completeUniverse()

APRÈS COMPLÉTION (modifications libres) :
  → "change le ciel en X" → changeSky()
  → "change le soleil en X" → changeSun()
  → "crée une autre planète" → recommence la collecte

INTERDIT : poser 2 questions à la fois — inventer des réponses — réponses longues`;
}

async function runConversation(session, userMessage) {
    if (userMessage && userMessage.trim()) {
        if (!session.currentPlanetAnswers) session.currentPlanetAnswers = [];
        const isCommand = /^(change|crée une autre|ajoute|terminé|done|complet)/i.test(userMessage.trim());
        const stillCollecting = session.currentPlanetAnswers.length < 5;
        const planetsStillNeeded = session.allPlanets.length < 2;
        if (!isCommand && stillCollecting && planetsStillNeeded) {
            session.currentPlanetAnswers.push(userMessage.trim());
            console.log(`Answer ${session.currentPlanetAnswers.length}/5: ${userMessage.trim()}`);
        }
    }

    const messages = [
        { role: "system", content: getSystemPrompt(session) },
        ...session.history.slice(-18),
        { role: "user", content: userMessage || "Bonjour, je veux créer mon univers" }
    ];

    const response = await getGroq().chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.8,
        max_tokens: 600
    });

    const msg = response.choices?.[0]?.message;
    if (!msg) throw new Error("No response from Groq");

    const toolCalls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
    const toolResults = [];

    for (const toolCall of toolCalls) {
        const name = toolCall.function?.name;
        let args = {};
        try {
            args = JSON.parse(toolCall.function?.arguments || "{}");
        } catch (e) {
            console.error("Bad tool JSON:", toolCall.function?.arguments);
        }
        if (ACTIONS[name]) {
            const result = ACTIONS[name](session, args);
            toolResults.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(result)
            });
        }
    }

    let finalMessage = msg.content || "";

    if (toolResults.length > 0) {
        const followUp = await getGroq().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [...messages, msg, ...toolResults],
            temperature: 0.8,
            max_tokens: 300
        });
        finalMessage = followUp.choices?.[0]?.message?.content || finalMessage;
    }

    return {
        message: finalMessage || "✨ ...",
        toolsUsed: toolCalls.map(t => t.function?.name).filter(Boolean)
    };
}

app.post("/api/chat", async (req, res) => {
    try {
        const { sessionId, userMessage } = req.body;
        if (!sessionId) return res.status(400).json({ error: "sessionId required" });

        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, {
                history: [],
                allPlanets: [],
                currentPlanetAnswers: [],
                skyTheme: null,
                sunColor: null,
                vibe: "neutral",
                energy: "medium",
                isComplete: false
            });
        }

        const session = sessions.get(sessionId);

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
                vibe: session.vibe,
                energy: session.energy,
                primaryColor: session.skyTheme?.primaryColor ?? null,
                secondaryColor: session.skyTheme?.secondaryColor ?? null,
                intensity: session.skyTheme?.intensity ?? "medium",
                sunColor: session.sunColor ?? null
            };
        }

        return res.json({
            message: result.message,
            planets: session.allPlanets.length > 0 ? session.allPlanets : null,
            environment,
            toolsUsed: result.toolsUsed,
            isComplete: session.isComplete,
            totalPlanetsCreated: session.allPlanets.length,
            currentPlanetProgress: session.currentPlanetAnswers?.length ?? 0
        });

    } catch (e) {
        console.error("Chat error:", e);
        res.status(500).json({ error: "AI request failed", detail: e.message });
    }
});

app.post("/auth/google", async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await getGoogleClient().verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const userJwt = jwt.sign(
            { userId: payload.sub, email: payload.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );
        res.json({
            success: true,
            jwt: userJwt,
            user: {
                name: payload.given_name,
                picture: payload.picture,
                email: payload.email
            }
        });
    } catch (err) {
        res.status(401).json({ error: "Invalid Google token" });
    }
});

function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];
    if (!token) return res.status(403).json({ error: "No token" });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Invalid token" });
        req.user = decoded;
        next();
    });
}

app.get("/user/profile", verifyToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

export { app, sessions };