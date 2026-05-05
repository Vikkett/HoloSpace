
// Import Google's OAuth2 client library (used for Google login verification)
import { OAuth2Client } from "google-auth-library";

// Variable to store a single shared Google OAuth client instance (singleton pattern)
let client;


// Function to get or create the Google OAuth client
export function getGoogleClient() {

    // If the client does NOT exist yet, create it
    if (!client) {

        // Initialize OAuth2 client with your Google Client ID
        client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    // Return the existing (or newly created) client instance
    return client;
}