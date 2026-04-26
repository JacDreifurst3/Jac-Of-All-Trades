const Board = require("./Board");
const Move = require("./Move");
const Piece = require('./Piece');
const Player = require('./Player');

class Game {
  // Constructs new game, creates board, players, and other needed info
  constructor() {
    this.board = new Board();
    this.currentPlayer = "RED";
    this.moveHistory = [];
    this.battleLog = [];
    this.gamePhase = "WAITING";
    this.gameOver = false;
    this.winner = null;
    this.winReason = null;
    this.players = {
      'RED' : { socketId: null, player: new Player("Red") },
      'BLUE' : { socketId: null, player: new Player("Blue") }
    }
  }

  // Assigns player to given color and socketID
  assignPlayer(color, socketId) {
    this.players[color].socketId = socketId;
  }

  // Places piece on board during setup
  placePiece(playerColor, x, y, rank) {
    if (this.gamePhase !== "SETUP") {
      throw new Error("Not in setup phase");
    }
    this.players[playerColor].player.placePiece(x, y, rank);
  }

  // Moves piece on board during setup
  moveSetupPiece(playerColor, fromX, fromY, toX, toY) {
    if (this.gamePhase !== "SETUP") {
      throw new Error("Not in setup phase");
    }
    this.players[playerColor].player.movePiece(fromX, fromY, toX, toY);
  }

  // Randomizes player's setup layout on board
  randomizePlayerLayout(playerColor) {
    if (this.gamePhase !== "SETUP") {
      throw new Error("Not in setup phase");
    }
    this.players[playerColor].player.randomizeLayout();
  }

  // Marks that player is done with setup, if both players are ready, begins PLAY
  markPlayerSetupComplete(playerColor) {
    if (this.gamePhase !== "SETUP") {
      throw new Error("Not in setup phase");
    }
    this.players[playerColor].player.markSetupComplete();
    if (this.players.RED.player.isSetupComplete() && this.players.BLUE.player.isSetupComplete()) {
      this.gamePhase = "PLAY";
      this.setupInitialPieces();
    }
  }

  // Sets up pieces on the shared board based on players' setup layouts
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

  // Makes move from one space to other
  makeMove(fromX, fromY, toX, toY) {
    if (this.gamePhase !== "PLAY") {
      throw new Error("Game not started yet");
    }
    // Generates move based on x and y coordinates
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

    // If space piece is being moved to has opponent's piece, initiate battle logic
    if (defender) {
      result = this.resolveBattle(attacker, defender, fromSpace, toSpace);
      // Check if defender's player has any available moves left (only if game hasn't already ended)
      if (!this.gameOver && !this.hasAvailableMoves(defender.getOwner())) {
        this.gameOver = true;
        this.winner = this.currentPlayer;
        this.winReason = "no_available_moves";
      }
    } else {
      // Executes move
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
    // Swtiches turn to other player now that turn is complete
    this.switchTurn();

    // After switching turns, check if the new current player has any available moves
    if (!this.gameOver && !this.hasAvailableMoves(this.currentPlayer)) {
      this.gameOver = true;
      this.winner = this.currentPlayer === "RED" ? "BLUE" : "RED";
      this.winReason = "no_available_moves";
    }

    return result;
  }

  // Resolves battle based on battle logic
  resolveBattle(attacker, defender, fromSpace, toSpace) {
    // Reveals both pieces to opposing sides
    attacker.reveal();
    defender.reveal();
    
    const attackerColor = this.currentPlayer;
    const defenderColor = attackerColor === "RED" ? "BLUE" : "RED";
    
    // Flag loses to any attack
    if (defender.getRank() === 0) {
      // Removes losing piece from board
      toSpace.removePiece();
      // Moves attacking space to flag's former position
      this.board.executeMove(fromSpace, toSpace);
      // Records battle on battle log
      this.recordBattle("FLAG_CAPTURED", attacker.getRank(), defender.getRank(), attackerColor, defenderColor);
      // Capturing flag wins game
      this.gameOver = true;
      this.winner = this.currentPlayer;
      this.winReason = "flag_captured";
      return "FLAG_CAPTURED";
    }

    // Miner (rank 3) defuses bomb
    if (defender.getRank() === 11 && attacker.getRank() === 3) {
      toSpace.removePiece();
      this.board.executeMove(fromSpace, toSpace);
      this.recordBattle("ATTACKER_DEFUSED_BOMB", attacker.getRank(), defender.getRank(), attackerColor, defenderColor);
      return "ATTACKER_DEFUSED_BOMB";
    }

    // Spy (rank 1) defeats Marshal (rank 10) if spy attacks
    if (attacker.getRank() === 1 && defender.getRank() === 10) {
      toSpace.removePiece();
      this.board.executeMove(fromSpace, toSpace);
      this.recordBattle("ATTACKER_ASSASINATED_MARSHAL", attacker.getRank(), defender.getRank(), attackerColor, defenderColor);
      return "ATTACKER_ASSASINATED_MARSHAL";
    }

    // Outside of special cases, higher rank wins
    // Bomb is evaluated as 11 as it defeats all pieces other than miner
    if (attacker.rank > defender.rank) {
      toSpace.removePiece();
      this.board.executeMove(fromSpace, toSpace);
      this.recordBattle("ATTACKER_WINS", attacker.getRank(), defender.getRank(), attackerColor, defenderColor);
      return "ATTACKER_WINS";
    } else if (attacker.rank < defender.rank) {
      fromSpace.removePiece();
      this.recordBattle("DEFENDER_WINS", attacker.getRank(), defender.getRank(), attackerColor, defenderColor);
      return "DEFENDER_WINS";
    } else {
      // Same rank: both die
      fromSpace.removePiece();
      toSpace.removePiece();
      this.recordBattle("BOTH_DIE", attacker.getRank(), defender.getRank(), attackerColor, defenderColor);
      return "BOTH_DIE";
    }
  }

  // Switches current player
  switchTurn() {
    this.currentPlayer = this.currentPlayer === "RED" ? "BLUE" : "RED";
  }

  // Records a battle in the battle log
  recordBattle(result, attackerRank, defenderRank, attackerColor, defenderColor) {
    this.battleLog.push({
      result,
      attackerRank,
      defenderRank,
      attackerColor,
      defenderColor,
      timestamp: new Date()
    });
  }

  // Checks if player has any pieces left (no pieces left forfeits game)
  hasPiecesLeft(playerColor) {
    for (let x = 0; x < this.board.size; x++) {
      for (let y = 0; y < this.board.size; y++) {
        const space = this.board.getSpace(x, y);
        if (space.piece && space.piece.getOwner() === playerColor) {
          return true;
        }
      }
    }
    return false;
  }

  // Checks if a player has any pieces that can move to a valid location (no available move forfeits game)
  hasAvailableMoves(playerColor) {
    for (let x = 0; x < this.board.size; x++) {
      for (let y = 0; y < this.board.size; y++) {
        const space = this.board.getSpace(x, y);
        if (space.piece && space.piece.getOwner() === playerColor) {
          // Check if this piece can move
          if (space.piece.canMove()) {
            // Get available moves for this piece
            const availableMoves = this.board.getAvailableMoves(space);
            if (availableMoves.length > 0) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  // Gets available moves for a given piece
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
  // During waiting phase, just return the phase — no board data needed yet
  if (this.gamePhase === 'WAITING') {
    return {
      board: [],
      currentPlayer: this.currentPlayer,
      gameOver: this.gameOver,
      winner: this.winner,
      winReason: this.winReason,
      gamePhase: this.gamePhase,
      availablePieces: {},
      setupComplete: false,
      showConfirmation: false,
      setupLayout: []
    };
  }

  const fullBoard = this.board.serialize();
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
            rank: "HIDDEN",
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
    winReason: this.winReason,
    gamePhase: this.gamePhase,
    availablePieces: Object.fromEntries(this.players[forPlayerColor].player.getAvailablePieces()),
    setupComplete: this.players[forPlayerColor].player.isSetupComplete(),
    showConfirmation: this.players[forPlayerColor].player.showConfirmation,
    setupLayout: this.players[forPlayerColor].player.getLayout(),
    battleLog: this.battleLog
  };
}

// Converts the game to plain data for MongoDB
  serializeForDB() {
    const board = this.board.serialize();
    return {
      currentPlayer: this.currentPlayer,
      gamePhase: this.gamePhase,
      gameOver: this.gameOver,
      winner: this.winner,
      winReason: this.winReason,
      board: board,
      redLayout: this.players.RED.player.getLayout(),
      blueLayout: this.players.BLUE.player.getLayout(),
      battleLog: this.battleLog,
    };
  }

  // Restores a game from saved MongoDB data
  static loadFromDB(savedData) {
    const game = new Game();
    game.currentPlayer = savedData.currentPlayer;
    game.gamePhase = savedData.gamePhase;
    game.gameOver = savedData.gameOver;
    game.winner = savedData.winner;
    game.winReason = savedData.winReason;

    // Restore battle log
    if (savedData.battleLog) {
      game.battleLog = savedData.battleLog;
    }

    // Restore player layouts
    if (savedData.redLayout) {
      game.players.RED.player.layout = savedData.redLayout;
      game.players.RED.player.availablePieces = new Map();
      game.players.RED.player.setup = "COMPLETE";
    }
    if (savedData.blueLayout) {
      game.players.BLUE.player.layout = savedData.blueLayout;
      game.players.BLUE.player.availablePieces = new Map();
      game.players.BLUE.player.setup = "COMPLETE";
    }

    // Restore board pieces
    if (savedData.board && savedData.gamePhase === "PLAY") {
      for (const row of savedData.board) {
        for (const space of row) {
          if (space.piece) {
            const piece = new Piece(space.piece.rank, space.piece.owner);
            if (space.piece.revealed) piece.reveal();
            game.board.getSpace(space.x, space.y).placePiece(piece);
          }
        }
      }
    }

    return game;
  }
}




module.exports = Game;