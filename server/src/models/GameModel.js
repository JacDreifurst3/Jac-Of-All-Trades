const mongoose = require('mongoose');

// Represents a single piece on the board: number or hidden, red or blue, revealed or not
const pieceSchema = new mongoose.Schema({
    rank: { type: mongoose.Schema.Types.Mixed },
    owner: { type: String },
    revealed: { type: Boolean, default: false }
}, { _id: false });

// Represents a single square on the board: row position, column position, grass or water, piece on space
const spaceSchema = new mongoose.Schema({
    x: { type: Number },
    y: { type: Number },
    terrain: { type: String },
    piece: { type: pieceSchema, default: null }
}, { _id: false });

// Represents a single battle in the battle log: who wins, ranks and colors of both pieces involved, when it occurred
const battleEntrySchema = new mongoose.Schema({
    result: { type: String },
    attackerRank: { type: Number },
    defenderRank: { type: Number },
    attackerColor: { type: String },
    defenderColor: { type: String },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

/**
 * The main game document, one per lobby: 
 * Stores the lobby code, Firebase UIDs of both players,
 * winner and lifecycle status, whose turn it is, game phase,
 * win condition type, beginner mode toggle, full board state,
 * player piece layouts, and battle log
 */
const gameSchema = new mongoose.Schema({
    lobbyCode: { type: String, required: true, unique: true },
    players: {
        RED: { uid: { type: String, default: null } },
        BLUE: { uid: { type: String, default: null } }
    },

    winner: { type: String, enum: ['RED', 'BLUE', null], default: null },
    status: { type: String, enum: ['WAITING', 'ACTIVE', 'FINISHED'], default: 'WAITING' },
    currentPlayer: { type: String, default: 'RED' },
    gamePhase: { type: String, default: 'SETUP' },
    gameOver: { type: Boolean, default: false },

    winReason: { type: String, default: null },
    beginnerMode: { type: Boolean, default: true },
    board: { type: [[spaceSchema]], default: null },
    
    redLayout: { type: [[mongoose.Schema.Types.Mixed]], default: null },
    blueLayout: { type: [[mongoose.Schema.Types.Mixed]], default: null },
    battleLog: { type: [battleEntrySchema], default: [] },

}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);