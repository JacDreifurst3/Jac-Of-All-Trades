const admin = require('../config/Firebase'); // The Firebase Admin 
const User = require('../models/UserModel');       // The user blueprint

//  Syncs user in Firebase with MongoDB: creates a new profile if first time, or fetches existing profile
exports.syncUser = async (req, res) => {
    try {
        // Gets token from the authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "No security token provided" });
        }

        const token = authHeader.split(' ')[1];

        // Sends token to Firebase for verification
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;

        // Checks if user already exists in MongoDB
        let user = await User.findById(uid);

        if (!user) {
            // If not in MongoDB, create user in MongoDB
            console.log(`Creating new user profile for: ${uid}`);
            user = await User.create({
                _id: uid,
                username: req.body.username, 
                profilePicUrl: req.body.profilePicUrl || ""
            });
        }

        // Send the user data back to the frontend
        res.status(200).json(user);

    } catch (error) {
        console.error("Auth Error:", error);
        res.status(401).json({ message: "Invalid credentials", error: error.message });
    }
};