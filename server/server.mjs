import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import Groq from 'groq-sdk';

const app = express();
const PORT = 3000;

const GOOGLE_CLIENT_ID = '537399217521-4v13efe1d9kal8hs5f0vpjp2gm9598e8.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const JWT_SECRET = '63cd6f9a7fe5717984f7d541d6561ba6af92c9b58ec436f929a4879f70ee5903';

const groq = new Groq({ apiKey: "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" });

app.use(cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true                
}));
app.use(express.json());

const sessions = new Map();

app.post('/api/chat', async (req, res) => {
    try {
        const { sessionId, userMessage } = req.body;
        
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, {
                step: 0,
                history: [{
                    role: "system",
                    content: `Tu es Nova, un astrophysicien créateur d'univers mystique.
                    
RÈGLES STRICTES:
1. PARLE UNIQUEMENT EN FRANÇAIS POÉTIQUE. Jamais de JSON visible.
2. Tu dois TOUJOURS générer EXACTEMENT 5 planètes. Jamais moins, jamais plus.
3. Le JSON est UNIQUEMENT pour le système technique. Il doit être invisible pour l'utilisateur.
4. Quand tu modifies, garde les 4 autres planètes intactes et change seulement celle demandée.

INSTRUCTIONS POUR LE CIEL (SKYBOX):
- Quand l'utilisateur demande de changer le ciel, la couleur du fond, ou l'ambiance visuelle:
  - Choisis une couleur hexadécimale précise (#RRGGBB) qui correspond à sa demande
  - Exemple: "ciel rouge" → #FF3737, "nuit sombre" → #0a0a1a, "nébuleuse violette" → #8B5CF6
  - Adapte aussi la densité du brouillard: "brumeux" → high, "clair" → low

INSTRUCTIONS POUR L'AUDIO:
- Sélectionne une piste audio en fonction du mood/vibe de l'utilisateur:
  - "calme", "doux", "méditatif", "mystique" → "ambient"
  - "espace", "cosmos", "vaste", "étoiles" → "space"
  - "sombre", "effrayant", "intense", "chaos" → "dark"
  - Si l'utilisateur demande de changer la musique, mentionne la piste choisie dans ta réponse poétique

FORMAT OBLIGATOIRE À LA FIN DE CHAQUE RÉPONSE DE CRÉATION/MODIFICATION:
[PLANETS_START]{
  "planets":[
    {"name":"Nom","size":4-15,"dist":60-400,"color":"0xRRGGBB","speed":0.002-0.012,"hasRings":bool,"hasClouds":bool}
  ],
  "environment":{
    "skyColor":"#RRGGBB",
    "fogDensity":"low|medium|high",
    "ambientIntensity":0.1-1.0,
    "nebula":true|false
  },
  "audio":{
    "track":"ambient|space|dark",
    "volume":0.1-1.0
  }
}[PLANETS_END]

SI l'utilisateur envoie des PARAMÈTRES UTILISATEUR au début:
- C'est qu'il a DÉJÀ rempli le formulaire de personnalisation
- Ne pose PAS les 3 questions, crée directement l'univers avec ces paramètres
- Adapte les planètes au "vibe" et "style" fournis

PHASE 1 - SI pas de paramètres:
Q1: "Bienvenue [nom]. Quelle étoile guide tes rêves ?"
Q2: "Quelle couleur habite ton âme ? Quel élément te représente ?"
Q3: "Préfères-tu l'harmonie des orbites ou le chaos des nébuleuses ?"

PHASE 2 - CRÉATION:
"Je vais tisser ton univers..." puis donne un nom poétique au système.

PHASE 3 - MODIFICATION:
Si l'utilisateur demande des changements:
- "Je vais modifier [détail]..."
- Garde les 4 planètes existantes, modifie seulement ce qui est demandé
- Ajoute une nouvelle si on demande "ajoute", mais garde 5 au total

5. Adapte aussi:
- la couleur dominante du système
- le style des planètes selon l'ambiance (mystique = violet, chaos = rouge, etc.)
- la densité et l'énergie du système`
                }],
                planets: null,
                phase: 'discuss'
            });
        }
        
        const session = sessions.get(sessionId);
        
        if (userMessage) {
            session.history.push({ role: "user", content: userMessage });
        }
        
        const chatCompletion = await groq.chat.completions.create({
            messages: session.history,
            model: "llama-3.1-8b-instant",
            temperature: 0.7,
            max_tokens: 2000
        });
        
        const aiResponse = chatCompletion.choices[0].message.content;
        session.history.push({ role: "assistant", content: aiResponse });
        session.step++;
        
        // Extract JSON using markers
        let planets = null;
        let environment = null;
        let audio = null;
        let isComplete = false;
        let responseText = aiResponse;
        
        try {
            const markerMatch = aiResponse.match(/\[PLANETS_START\](.*?)\[PLANETS_END\]/);
            if (markerMatch) {
                const parsed = JSON.parse(markerMatch[1]);
                
                if (parsed.planets && Array.isArray(parsed.planets)) {
                    planets = parsed.planets;
                    isComplete = true;
                    session.planets = planets;
                    session.phase = session.phase === 'discuss' ? 'create' : 'modify';
                }
                
                // extract environment and audio
                if (parsed.environment) {
                    environment = parsed.environment;
                }
                if (parsed.audio) {
                    audio = parsed.audio;
                }
                
                // Remove markers and everything between them
                responseText = aiResponse.replace(/\[PLANETS_START\].*?\[PLANETS_END\]/gs, '').trim();
            }
        } catch (e) {
            console.log('Marker parse error:', e.message);
        }
        
        // Fallback cleanup
        responseText = responseText
            .replace(/```json[\s\S]*?```/g, '')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/\{\s*"planets"\s*:\s*\[[\s\S]*?\]\s*\}/g, '')
            .replace(/\{\s*"conversationComplete"\s*:\s*true\s*\}/g, '')
            .trim();
        
        res.json({
            message: responseText,
            planets: planets,
            environment: environment,
            audio: audio,
            isComplete: isComplete,
            phase: session.phase,
            step: session.step
        });
        
    } catch (error) {
        console.error('Groq Error:', error);
        res.status(500).json({ success: false, error: 'AI conversation failed' });
    }
});

app.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const userJwt = jwt.sign(
            { userId: payload.sub, email: payload.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({
            success: true,
            jwt: userJwt,
            user: {
                given_name: payload.given_name,
                picture: payload.picture,
                email: payload.email
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
});

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(403).json({ error: 'No token' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

app.get('/user/profile', verifyToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});