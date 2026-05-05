
// Import Express Router (used to define user-related routes)
import { Router } from "express";

// Import authentication middleware (verifies JWT token and sets req.user)
import { verifyToken } from "../middleware/auth.js";


// Create a new router instance for user endpoints
const router = Router();


// GET /user/profile
// Protected route (only accessible if user is authenticated)
router.get("/profile", verifyToken, (req, res) => {

    // Return the authenticated user data stored by verifyToken middleware
    res.json({
        user: req.user
    });
});


// Export router so it can be used in app.js
export default router;