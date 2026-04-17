const User = require('../models/UserModel');

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

exports.updateProfile = async (req, res) => {
    // Make sure users can only edit their own profile
    if (req.uid !== req.params.uid) {
        return res.status(403).json({ message: "You can only update your own profile" });
    }
    try {
        const allowedUpdates = ['username', 'profilePicUrl'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

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

exports.updateStats = async (req, res) => {
    try {
        const { result } = req.body;

        if (!['WIN', 'LOSS'].includes(result)) {
            return res.status(400).json({ message: "Result must be WIN or LOSS" });
        }

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

exports.getLeaderboard = async (req, res) => {
    try {
        const topPlayers = await User.find()
            .sort({ wins: -1 })
            .limit(10)
            .select('username profilePicUrl wins losses gamesPlayed');

        res.status(200).json(topPlayers);
    } catch (error) {
        console.error("Leaderboard Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// DELETE /api/users/:uid — removes user from MongoDB
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