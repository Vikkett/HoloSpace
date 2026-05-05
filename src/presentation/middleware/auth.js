
// Import JWT library (used to verify authentication tokens)
import jwt from "jsonwebtoken";


// Middleware function that protects routes by verifying JWT token
export function verifyToken(req, res, next) {

    // Extract token from Authorization header
    // Expected format: "Bearer <token>"
    const token = req.headers.authorization?.split(" ")[1];


    // If no token is provided → reject request
    if (!token) {
        return res.status(403).json({
            error: "No token"
        });
    }


    // Verify token using JWT secret key
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {

        // If token is invalid or expired → reject request
        if (err) {
            return res.status(401).json({
                error: "Invalid token"
            });
        }

        // If token is valid → attach decoded user data to request object
        req.user = decoded;

        // Continue to next middleware or route handler
        next();
    });
}