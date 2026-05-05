
// Import the Groq SDK (used to communicate with Groq AI models)
import Groq from "groq-sdk";

// Variable to store a single shared Groq client instance (singleton pattern)
let client;


// Function to get or create the Groq client
export function getGroq() {

    // If the client does NOT exist yet, create it
    if (!client) {

        // Initialize Groq with your API key from environment variables
        client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    // Return the existing (or newly created) client instance
    return client;
}