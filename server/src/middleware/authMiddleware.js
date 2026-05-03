// This file uses Firebase tokens to protect routes when changing account elements.

const admin = require('../config/firebase');

// req - the incoming request
// res - the response
// next - function to pass on the request
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: "Invalid token format" });
        }

        // Sends token to Firebase for verification
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Attach the uid to the request so controllers can use it
        req.uid = decodedToken.uid;
        
        // Token is valid - pass to route handler
        next();
        
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = verifyToken;