const User = require('../models/UserModel');

// Returns the public profile for a given user
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.uid);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Updates username and/or profile picture for the authenticated user
exports.updateProfile = async (req, res) => {
    if (req.uid !== req.params.uid) {
        return res.status(403).json({ message: "You can only update your own profile" });
    }
    try {
        // Whitelist of fields the user is permitted to change
        const allowedUpdates = ['username', 'profilePicUrl'];
        const updates = {};

        // Only include fields that were actually provided in the request body
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        // Apply updates and return the new document, running schema validators
        const user = await User.findByIdAndUpdate(
            req.params.uid,
            updates,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Increments win or loss count after a game ends
exports.updateStats = async (req, res) => {
    try {
        const { result } = req.body;
        // Reject any result value that isn't explicitly WIN or LOSS
        if (!['WIN', 'LOSS'].includes(result)) {
            return res.status(400).json({ message: "Result must be WIN or LOSS" });
        }
        // Use $inc to atomically increment the relevant counters
        const updates = {
            $inc: {
                gamesPlayed: 1,
                wins: result === 'WIN' ? 1 : 0,
                losses: result === 'LOSS' ? 1 : 0,
            }
        };

        const user = await User.findByIdAndUpdate(
            req.params.uid,
            updates,
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Update Stats Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Removes user from MongoDB, Firebase deletion handled on front end
exports.deleteAccount = async (req, res) => {
    try {
        if (req.uid !== req.params.uid) {
            return res.status(403).json({ message: "You can only delete your own account" });
        }

        const user = await User.findByIdAndDelete(req.params.uid);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Account deleted" });
    } catch (error) {
        console.error("Delete Account Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};