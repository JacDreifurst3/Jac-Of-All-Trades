const mongoose = require('mongoose');

/**
 * The user document, one per user: 
 * stores the Firebase UID as the id, 
 * username, profile picture as a URL,
 * wins, losses, games played
 */
const userSchema = new mongoose.Schema({
    _id: { type: String },
    username: { type: String, required: true, unique: true, trim: true },
    profilePicUrl: { type: String, default: "" },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);