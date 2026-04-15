//this file protects routes using firebase tokens
//makes it so anyone can't modify anyone's data

const admin = require('../config/firebase');

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

        // Verify the token with Firebase
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Attach the uid to the request so controllers can use it
        req.uid = decodedToken.uid;
        
        next(); // Token is valid, move on to the route handler
        
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = verifyToken;