const mongoose = require('mongoose');

// Represents a single piece on the board (rank, owner, whether it's been revealed in battle)
const pieceSchema = new mongoose.Schema({
    rank: { type: mongoose.Schema.Types.Mixed }, // Mixed because rank can be a number or "HIDDEN"
    owner: { type: String },                      // "RED" or "BLUE"
    revealed: { type: Boolean, default: false }   // true once the piece has been in a battle
}, { _id: false }); // _id: false means MongoDB won't add an _id to each piece

// Represents a single square on the 10x10 board
const spaceSchema = new mongoose.Schema({
    x: { type: Number },                          // Row position
    y: { type: Number },                          // Column position
    terrain: { type: String },                    // "GRASS" or "WATER" (lakes can't be entered)
    piece: { type: pieceSchema, default: null }   // The piece on this space, or null if empty
}, { _id: false });

// Represents a single battle in the battle log
const battleEntrySchema = new mongoose.Schema({
    result: { type: String },                     // "ATTACKER_WINS", "DEFENDER_WINS", "BOTH_DIE", "FLAG_CAPTURED", etc.
    attackerRank: { type: Number },               // Rank of attacking piece
    defenderRank: { type: Number },               // Rank of defending piece
    attackerColor: { type: String },              // "RED" or "BLUE"
    defenderColor: { type: String },              // "RED" or "BLUE"
    timestamp: { type: Date, default: Date.now }  // When the battle occurred
}, { _id: false });

// The main game document — one per active or finished lobby
const gameSchema = new mongoose.Schema({
    lobbyCode: { type: String, required: true, unique: true }, // The code players use to join

    // Firebase UIDs of the two players
    players: {
        RED: { uid: { type: String, default: null } },
        BLUE: { uid: { type: String, default: null } }
    },

    winner: { type: String, enum: ['RED', 'BLUE', null], default: null },  // Who won, or null if ongoing
    status: { type: String, enum: ['WAITING', 'ACTIVE', 'FINISHED'], default: 'WAITING' }, // Game lifecycle

    // Game state fields — saved so players can reconnect and resume
    currentPlayer: { type: String, default: 'RED' },       // Whose turn it is
    gamePhase: { type: String, default: 'SETUP' },          // "SETUP" or "PLAY"
    gameOver: { type: Boolean, default: false },
    winReason: { type: String, default: null },             // "flag_captured" or "no_available_moves"
    beginnerMode: { type: Boolean, default: true },          // Beginner mode toggle

    // Full board snapshot — array of rows, each row is an array of spaces
    board: { type: [[spaceSchema]], default: null },

    // Each player's piece layout from setup phase (4 rows x 10 columns)
    // Needed to restore setup phase if a player disconnects before game starts
    redLayout: { type: [[mongoose.Schema.Types.Mixed]], default: null },
    blueLayout: { type: [[mongoose.Schema.Types.Mixed]], default: null },

    // Battle log — all battles that have occurred in this game
    battleLog: { type: [battleEntrySchema], default: [] },

}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

module.exports = mongoose.model('Game', gameSchema);