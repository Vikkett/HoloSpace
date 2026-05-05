
// Import Express framework (used to create HTTP server and API routes)
import express from "express";

// Import CORS middleware (allows frontend to communicate with backend)
import cors from "cors";


// Create an Express application instance (your main backend app)
const app = express();


// Enable CORS (Cross-Origin Resource Sharing)
// This allows your frontend (http://localhost:5173) to call your backend
app.use(cors({

    // Allowed frontend origin (Vite dev server)
    origin: ["http://localhost:5173"],

    // Allow cookies / authentication headers to be sent
    credentials: true
}));


// Enable JSON parsing for incoming requests
// This allows req.body to read JSON data sent from frontend
app.use(express.json());


// Export the configured Express app so it can be used in server/index file
export default app;