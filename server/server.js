import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const app = express();
const PORT = 3000;

// Your Google Client ID
const GOOGLE_CLIENT_ID = '537399217521-4v13efe1d9kal8hs5f0vpjp2gm9598e8.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// JWT Secret - CHANGE THIS TO A RANDOM STRING IN PRODUCTION!
const JWT_SECRET = 'holospace-secret-key-2024-change-this-in-production';

app.use(cors());
app.use(express.json());

// Verify Google token and create JWT
app.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        
        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        
        // Create your own JWT
        const userJwt = jwt.sign(
            {
                userId: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            jwt: userJwt,
            user: {
                name: payload.name,
                given_name: payload.given_name,
                picture: payload.picture,
                email: payload.email
            }
        });
        
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ 
            success: false, 
            error: 'Invalid token' 
        });
    }
});

// Verify JWT middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

// Protected route example
app.get('/user/profile', verifyToken, (req, res) => {
    res.json({
        message: 'Protected data',
        user: req.user
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});