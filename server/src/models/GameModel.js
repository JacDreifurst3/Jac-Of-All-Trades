const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    lobbyCode: { type: String, required: true, unique: true },
    players: {
        RED: { type: String, ref: 'User', default: null },  // Firebase UID
        BLUE: { type: String, ref: 'User', default: null }, // Firebase UID
    },
    winner: { type: String, enum: ['RED', 'BLUE', null], default: null },
    status: { type: String, enum: ['WAITING', 'ACTIVE', 'FINISHED'], default: 'WAITING' },
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);