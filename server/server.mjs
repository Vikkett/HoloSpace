import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { GoogleGenerativeAI } from "@google/generative-ai"; // 1. Import Gemini

const app = express();
const PORT = 3000;

const GOOGLE_CLIENT_ID = '537399217521-4v13efe1d9kal8hs5f0vpjp2gm9598e8.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const JWT_SECRET = 'holospace-secret-key-2026';

// 2. Initialize Gemini (Replace with your key from AI Studio)
const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY_HERE");

app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5500', 'http://localhost:5500'], // Added common Live Server ports
    methods: ['GET', 'POST'],
    credentials: true                
}));
app.use(express.json());

// --- NEW AI ROUTE ---

app.post('/api/generate-universe', async (req, res) => {
    try {
        const { answers } = req.body;
        
        // Use Gemini 1.5 Flash (Fast & Cost-efficient)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" } // Force JSON mode
        });

        const prompt = `
            Tu es un créateur d'univers astrophysicien. Basé sur cette description : "${answers}", 
            génère un système solaire qui reflète cette personnalité.
            Retourne UNIQUEMENT un objet JSON avec cette structure :
            {
              "planets": [
                { 
                  "name": "Nom Créatif", 
                  "size": (nombre entre 4 et 15), 
                  "dist": (nombre entre 60 et 400), 
                  "color": "0xRRGGBB" (en format hexadécimal string), 
                  "speed": (nombre entre 0.002 et 0.012), 
                  "hasRings": (boolean),
                  "hasClouds": (boolean)
                }
              ]
            }
            Génère exactement 5 planètes différentes.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Send the JSON directly to frontend
        res.json(JSON.parse(text));
        
    } catch (error) {
        console.error('Gemini Error:', error);
        res.status(500).json({ success: false, error: 'AI generation failed' });
    }
});

// --- EXISTING ROUTES ---

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