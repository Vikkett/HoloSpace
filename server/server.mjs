import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
const PORT = 3000;

/* ---------------- ENV CONFIG ---------------- */
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

/* ---------------- CLIENTS ---------------- */
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const groq = new Groq({
    apiKey: GROQ_API_KEY
});

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

/* ---------------- MEMORY (TEMP) ---------------- */
const sessions = new Map();

/* ---------------- CHAT ROUTE ---------------- */
app.post('/api/chat', async (req, res) => {
    try {
        const { sessionId, userMessage } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId required' });
        }

        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, {
                step: 0,
                history: [{
                    role: "system",
                    content: `Tu es Nova, un astrophysicien créateur d'univers mystique.

RÈGLES:
- Français poétique uniquement
- Toujours 5 planètes
- JSON invisible pour l'utilisateur

FORMAT:
[PLANETS_START]{...}[PLANETS_END]`
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

        let planets = null;
        let environment = null;
        let audio = null;
        let isComplete = false;
        let responseText = aiResponse;

        try {
            const match = aiResponse.match(/\[PLANETS_START\](.*?)\[PLANETS_END\]/s);

            if (match) {
                const parsed = JSON.parse(match[1]);

                if (parsed.planets) {
                    planets = parsed.planets;
                    isComplete = true;
                    session.planets = planets;
                }

                environment = parsed.environment || null;
                audio = parsed.audio || null;

                responseText = aiResponse
                    .replace(/\[PLANETS_START\].*?\[PLANETS_END\]/gs, '')
                    .trim();
            }
        } catch (err) {
            console.log('Parse error:', err.message);
        }

        res.json({
            message: responseText,
            planets,
            environment,
            audio,
            isComplete,
            phase: session.phase,
            step: session.step
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'AI request failed' });
    }
});

/* ---------------- GOOGLE AUTH ---------------- */
app.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        const userJwt = jwt.sign(
            {
                userId: payload.sub,
                email: payload.email
            },
            JWT_SECRET,
            { expiresIn: '7d' }
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
        res.status(401).json({ error: 'Invalid Google token' });
    }
});

/* ---------------- JWT MIDDLEWARE ---------------- */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'No token' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.user = decoded;
        next();
    });
}

/* ---------------- PROTECTED ROUTE ---------------- */
app.get('/user/profile', verifyToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});