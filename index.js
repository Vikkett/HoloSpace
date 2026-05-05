// Load environment variables from .env file into process.env
import "dotenv/config";

// Import the Express app instance (already configured with middleware)
import { app } from "./presentation/app.js";

// Import route handlers for chat-related endpoints
import chat from "./presentation/routes/chat.js";

// Import route handlers for authentication (Google login, JWT, etc.)
import auth from "./presentation/routes/auth.js";

// Import route handlers for user-related endpoints (profile, etc.)
import user from "./presentation/routes/user.js";


// Register chat routes under /api/chat
app.use("/api/chat", chat);

// Register authentication routes under /auth
app.use("/auth", auth);

// Register user routes under /user
app.use("/user", user);


// Define the port the server will run on
// Uses value from .env if available, otherwise defaults to 3000
const PORT = process.env.PORT || 3000;


// Start the Express server and listen for incoming requests on the specified port
app.listen(PORT, () => {
    
    // Log a message in the console once the server is running
    console.log(`Server running on port ${PORT}`);
});