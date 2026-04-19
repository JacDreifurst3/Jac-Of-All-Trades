const admin = require('../config/firebase'); // The Firebase Admin 
const User = require('../models/UserModel');       // The user blueprint

exports.syncUser = async (req, res) => {
    try {
        // 1. Get the token from the "Authorization" header

        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "No security token provided" });
        }

        const token = authHeader.split(' ')[1];

        // 2. Ask Firebase to verify the token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid; // The unique ID for this user

        // 3. Check if this user already exists in our MongoDB
        let user = await User.findById(uid);

        if (!user) {
            // 4. If they are NEW, create their record in the database
            console.log(`Creating new user profile for: ${uid}`);
            user = await User.create({
                _id: uid,
                username: req.body.username, // From the frontend form
                profilePicUrl: req.body.profilePicUrl || ""
            });
        }

        // 5. Send the user data back to the frontend
        res.status(200).json(user);

    } catch (error) {
        console.error("Auth Error:", error);
        res.status(401).json({ message: "Invalid credentials", error: error.message });
    }
};