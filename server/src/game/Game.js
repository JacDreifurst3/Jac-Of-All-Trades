const Board = require("./Board");
const Move = require("./Move");
const Piece = require('./Piece');
const Player = require('./Player');

class Game {
  constructor() {
    this.board = new Board();
    this.currentPlayer = "RED"; // Make and connect with Player.js at some point?
    this.moveHistory = []; // Will be connected to/stored in database at some point 
    this.gamePhase = "SETUP";
    this.gameOver = false;
    this.winner = null;
    this.players = {
      'RED' : { socketId: null, player: new Player("Red") },
      'BLUE' : { socketId: null, player: new Player("Blue") }
    }
    // this.setupInitialPieces(); // Moved to when setup is complete
  }

  assignPlayer(color, socketId) {
    this.players[color].socketId = socketId;
  }

  placePiece(playerColor, x, y, rank) {
    if (this.gamePhase !== "SETUP") {
      throw new Error("Not in setup phase");
    }
    this.players[playerColor].player.placePiece(x, y, rank);
    if (this.players.RED.player.isSetupComplete() && this.players.BLUE.player.isSetupComplete()) {
      this.gamePhase = "PLAY";
      this.setupInitialPieces();
    }
  }

  setupInitialPieces() {
    // Populate Blue
    const blueLayout = this.players.BLUE.player.getLayout();
    for (let r = 0; r < blueLayout.length; r++) {
      for (let c = 0; c < blueLayout[0].length; c++) {
        const rank = blueLayout[3 - r][c]; 
        this.board.getSpace(r, c).placePiece(new Piece(rank, "BLUE"));
      }
    }

    // Populate Red
    const redLayout = this.players.RED.player.getLayout();
    for (let r = 0; r < redLayout.length; r++) {
      for (let c = 0; c < redLayout[0].length; c++) {
        const rank = redLayout[r][c];
        this.board.getSpace(r + 6, c).placePiece(new Piece(rank, "RED"));
      }
    }
  }

  makeMove(fromX, fromY, toX, toY) {
    if (this.gamePhase !== "PLAY") {
      throw new Error("Game not started yet");
    }
    const moveData = this.board.generateMove(fromX, fromY, toX, toY);
    const { fromSpace, toSpace, attacker, defender } = moveData;

    if (defender && defender.getOwner() === this.currentPlayer) {
      throw new Error("Cannot move into your own piece");
    }
    if (!attacker.canMove()) {
      throw new Error("This piece cannot move");
    }

    if (attacker.getOwner() != this.currentPlayer) {
      throw new Error("Cannot move while not your turn");
    }

    let result;

    if (defender) {
      result = this.resolveBattle(attacker, defender, fromSpace, toSpace);
    } else {
      this.board.executeMove(fromSpace, toSpace);
      result = "MOVE";
    }
    const move = new Move(
      fromX,
      fromY,
      toX,
      toY,
      this.currentPlayer,
      result
    );

    this.moveHistory.push(move);

    this.switchTurn();

    return result;
  }

  resolveBattle(attacker, defender, fromSpace, toSpace) {
    attacker.reveal();
    defender.reveal();
    
    // Flag
    if (defender.getRank() === 0) {
      toSpace.removePiece();
      this.board.executeMove(fromSpace, toSpace);
      this.gameOver = true;
      this.winner = this.currentPlayer;
      return "FLAG_CAPTURED";
    }

    if (defender.getRank() === 11 && attacker.getRank() === 3) {
      // Miner (rank 3) defuses bomb
      toSpace.removePiece();
      this.board.executeMove(fromSpace, toSpace);
      return "ATTACKER_DEFUSED_BOMB";
    }

    if (attacker.getRank() === 1 && defender.getRank() === 10) {
      toSpace.removePiece();
      this.board.executeMove(fromSpace, toSpace);
      return "ATTACKER_ASSASINATED_MARSHAL";
    }

    if (attacker.rank > defender.rank) {
      toSpace.removePiece();
      this.board.executeMove(fromSpace, toSpace);
      return "ATTACKER_WINS";
    } else if (attacker.rank < defender.rank) {
      fromSpace.removePiece();
      return "DEFENDER_WINS";
    } else {
      // Same rank: both die
      fromSpace.removePiece();
      toSpace.removePiece();
      return "BOTH_DIE";
    }
  }

  switchTurn() {
    this.currentPlayer = this.currentPlayer === "RED" ? "BLUE" : "RED";
  }

  getAvailableMovesForPiece(x, y) {
    const space = this.board.getSpace(x, y);
    
    // Validate space exists and has a piece
    if (!space || !space.piece) {
      return [];
    }
    
    // Validate piece belongs to current player
    if (space.piece.getOwner() !== this.currentPlayer) {
      return [];
    }
    
    // Validate piece can move
    if (!space.piece.canMove()) {
      return [];
    }
    
    // Get available moves from board
    return this.board.getAvailableMoves(space);
  }

  //function to get gamestate for frontend.
  getGameState(forPlayerColor) {
  const fullBoard = this.board.serialize();
  // Hide enemy ranks that aren't revealed
  const redactedBoard = fullBoard.map(row => 
    row.map(space => {
      if (
        space.piece && 
        space.piece.owner !== forPlayerColor && 
        !space.piece.revealed
      ) {
        return {
          ...space,
          piece: { 
            ...space.piece, 
            rank: "HIDDEN", // Overwrite the rank for the enemy
            name: "Enemy Piece" 
          }
        };
      }
      return space;
    })
  );

  return {
    board: redactedBoard,
    currentPlayer: this.currentPlayer,
    gameOver: this.gameOver,
    winner: this.winner,
    gamePhase: this.gamePhase,
    availablePieces: Object.fromEntries(this.players[forPlayerColor].player.getAvailablePieces()),
    setupComplete: this.players[forPlayerColor].player.isSetupComplete()
  };
}


}




module.exports = Game;