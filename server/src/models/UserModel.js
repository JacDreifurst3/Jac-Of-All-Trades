const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    _id: { type: String },  // Firebase UID is the ID
    username: { type: String, required: true, unique: true, trim: true },
    profilePicUrl: { type: String, default: "" },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
}, { timestamps: true });  // adds createdAt and updatedAt automatically

module.exports = mongoose.model('User', userSchema);