import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const app = express();
const PORT = 3000;

// Google Client ID (Matches your Frontend)
const GOOGLE_CLIENT_ID = '537399217521-4v13efe1d9kal8hs5f0vpjp2gm9598e8.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Secret key to sign your website's tokens
const JWT_SECRET = 'holospace-secret-key-2026';

// --- MIDDLEWARE ---
app.use(cors({
    origin: 'http://localhost:5173', // Allows your Vite dev server
    methods: ['GET', 'POST'],
    credentials: true                
}));
app.use(express.json());

// --- ROUTES ---

// Login: Verifies Google and returns user data + JWT
app.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        
        // Create our own session token
        const userJwt = jwt.sign(
            { userId: payload.sub, email: payload.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Send data back to frontend
        res.json({
            success: true,
            jwt: userJwt,
            user: {
                given_name: payload.given_name, // Matches Frontend updateUI
                picture: payload.picture,
                email: payload.email
            }
        });
        
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
});

// Middleware to protect routes
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

// Route to check if user is still logged in
app.get('/user/profile', verifyToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});