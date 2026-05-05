
// Import Express Router (used to create modular route handlers)
import { Router } from "express";

// Import JWT library (used to create authentication tokens)
import jwt from "jsonwebtoken";

// Import Google OAuth client from persistence layer (singleton instance)
import { getGoogleClient } from "../../persistence/google.js";


// Create a new router instance for authentication routes
const router = Router();


// POST /auth/google
// This route handles Google login and returns a JWT token
router.post("/google", async (req, res) => {

    // Verify Google ID token sent from frontend
    const ticket = await getGoogleClient().verifyIdToken({

        // Token received from frontend (Google Sign-In)
        idToken: req.body.token,

        // Google Client ID used to validate the token audience
        audience: process.env.GOOGLE_CLIENT_ID
    });


    // Extract user information from verified Google token
    const payload = ticket.getPayload();


    // Create a JWT token using the Google user payload
    // This is your own authentication token for your backend
    const token = jwt.sign(
        payload,

        // Secret key used to sign the JWT
        process.env.JWT_SECRET
    );


    // Send JWT token back to frontend
    res.json({ token });
});


// Export router so it can be used in app.js
export default router;