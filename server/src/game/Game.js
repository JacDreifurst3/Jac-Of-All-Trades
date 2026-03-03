const Board = require("./Board");
const Move = require("./Move");

class Game{
    constructor() {
    this.board = new Board();
    this.currentPlayer = "RED"; // Make and connect with Player.js at some point?
    this.moveHistory = []; // Will be connected to/stored in database at some point 
    this.gameOver = false;
    this.winner = null;
  }

  makeMove(fromX, fromY, toX, toY){
    const moveData = this.board.generateMove(fromX, fromY, toX, toY);
    const { fromSpace, toSpace, attacker, defender } = moveData;

    if (defender && defender.owner === this.currentPlayer) {
      throw new Error("Cannot move into your own piece");
    }
    if (!attacker.canMove()) {
      throw new Error("This piece cannot move");
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

  resolveBattle(attacker, defender, fromSpace, toSpace){
    attacker.reveal();
    defender.reveal();
    // Flag
    if (defender.rank === 0) {
        toSpace.removePiece();
        this.board.executeMove(fromSpace, toSpace);
        this.gameOver = true;
        this.winner = this.currentPlayer;
        return "FLAG_CAPTURED";
    }

    if (defender.rank === 11 && attacker.rank === 3) {
        // Miner (rank 3) defuses bomb
        toSpace.removePiece();
        this.board.executeMove(fromSpace, toSpace);
        return "ATTACKER_WINS";
    }
    
    if (attacker.rank === 1 && defender.rank === 10) {
        toSpace.removePiece();
        this.board.executeMove(fromSpace, toSpace);
        return "ATTACKER_WINS";
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
    this.currentTurn = this.currentTurn === "RED" ? "BLUE" : "RED";
  }
  
}
module.exports = Game;