
// Import Express Router (used to define chat-related API routes)
import { Router } from "express";

// Import session storage function (creates or retrieves user session)
import { getOrCreateSession } from "../../persistence/sessionStore.js";

// Import main AI conversation engine (handles Groq + tools + logic)
import { runConversation } from "../../services/conversation.js";

// Import available AI tools (functions AI can call like createPlanet, changeSky, etc.)
import { TOOLS } from "../../domain/tools.js";


// Create a new router instance for chat endpoints
const router = Router();


// POST /api/chat
// Handles user messages and returns AI response
router.post("/", async (req, res) => {

    // Extract sessionId and user message from frontend request
    const { sessionId, userMessage } = req.body;

    // Get existing session or create a new one if it doesn't exist
    const session = getOrCreateSession(sessionId);

    // Store user message in session history (for memory/context)
    session.history.push({
        role: "user",
        content: userMessage
    });

    // Run AI conversation logic (Groq + tools + system prompt + session state)
    const result = await runConversation(session, userMessage, TOOLS);

    // Store AI response in session history
    session.history.push({
        role: "assistant",
        content: result.message
    });

    // Send AI response back to frontend
    res.json(result);
});


// Export router so it can be used in app.js
export default router;