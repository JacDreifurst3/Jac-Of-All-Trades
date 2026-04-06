const Game = require("../Game");
const Piece = require("../Piece");
const { test, describe, expect, beforeEach } = require("@jest/globals");

describe("Game Class (Real Engine - No Mocks)", () => {
  let game;

  beforeEach(() => {
    game = new Game();
    game.gamePhase = "PLAY"; // Set to PLAY for testing moves
  });

  test("game initializes correctly", () => {
    expect(game.currentPlayer).toBe("RED");
    expect(game.moveHistory.length).toBe(0);
    expect(game.gameOver).toBe(false);
    expect(game.winner).toBeNull();
  });

  test("normal move to empty space", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);

    const piece = new Piece(5, "RED");
    from.placePiece(piece);

    const result = game.makeMove(0, 0, 0, 1);

    expect(result).toBe("MOVE");
    expect(from.piece).toBeNull();
    expect(to.piece).toBe(piece);
    expect(game.moveHistory.length).toBe(1);
  });

  test("cannot move into own piece", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);

    from.placePiece(new Piece(5, "RED"));
    to.placePiece(new Piece(6, "RED"));

    expect(() => {
      game.makeMove(0, 0, 0, 1);
    }).toThrow("Invalid move");
  });

  test("cannot move immovable piece (bomb/flag)", () => {
    const from = game.board.getSpace(0, 0);
    const bomb = new Piece(11, "RED"); // bomb = 11 in your rules
    from.placePiece(bomb);

    expect(() => {
      game.makeMove(0, 0, 0, 1);
    }).toThrow("This piece cannot move");
  });

  test("attacker wins when rank is higher", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);

    const attacker = new Piece(8, "RED");
    const defender = new Piece(4, "BLUE");

    from.placePiece(attacker);
    to.placePiece(defender);

    const result = game.makeMove(0, 0, 0, 1);

    expect(result).toBe("ATTACKER_WINS");
    expect(to.piece).toBe(attacker);
  });

  test("defender wins when rank is higher", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);

    const attacker = new Piece(4, "RED");
    const defender = new Piece(8, "BLUE");

    from.placePiece(attacker);
    to.placePiece(defender);

    const result = game.makeMove(0, 0, 0, 1);

    expect(result).toBe("DEFENDER_WINS");
    expect(from.piece).toBeNull();
    expect(to.piece).toBe(defender);
  });

  test("same rank should eliminate both pieces", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);

    from.placePiece(new Piece(5, "RED"));
    to.placePiece(new Piece(5, "BLUE"));

    const result = game.makeMove(0, 0, 0, 1);

    expect(result).toBe("BOTH_DIE");
    expect(from.piece).toBeNull();
    expect(to.piece).toBeNull();
  });

  test("miner (3) defuses bomb (11)", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);

    from.placePiece(new Piece(3, "RED")); // Miner
    to.placePiece(new Piece(11, "BLUE")); // Bomb

    const result = game.makeMove(0, 0, 0, 1);

    expect(result).toBe("ATTACKER_DEFUSED_BOMB");
    expect(to.piece.rank).toBe(3);
  });

  test("capturing flag ends the game", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);

    from.placePiece(new Piece(6, "RED"));
    to.placePiece(new Piece(0, "BLUE")); // Flag = 0 (your rule)

    const result = game.makeMove(0, 0, 0, 1);

    expect(result).toBe("FLAG_CAPTURED");
    expect(game.gameOver).toBe(true);
    expect(game.winner).toBe("RED");
  });

  test("spy (1) assassinates marshal (10)", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);

    from.placePiece(new Piece(1, "RED")); // Spy
    to.placePiece(new Piece(10, "BLUE")); // Marshal

    const result = game.makeMove(0, 0, 0, 1);

    expect(result).toBe("ATTACKER_ASSASINATED_MARSHAL");
    expect(to.piece.rank).toBe(1);
  });

  test("placePiece places piece in player layout", () => {
    game.gamePhase = "SETUP";
    game.placePiece("RED", 0, 0, 5);
    expect(game.player.RED.getLayout()[0][0]).toBe(5);
    expect(game.player.RED.getAvailablePieces().get(5)).toBe(3);
  });

  test("placePiece throws if not setup phase", () => {
    game.gamePhase = "PLAY";
    expect(() => {
      game.placePiece("RED", 0, 0, 5);
    }).toThrow("Not in setup phase");
  });

  test("switchTurn changes currentPlayer", () => {
    expect(game.currentPlayer).toBe("RED");
    game.switchTurn();
    expect(game.currentPlayer).toBe("BLUE");
    game.switchTurn();
    expect(game.currentPlayer).toBe("RED");
  });

  test("getAvailableMovesForPiece returns moves for movable piece", () => {
    const space = game.board.getSpace(0, 0);
    space.placePiece(new Piece(5, "RED")); // Movable piece
    const moves = game.getAvailableMovesForPiece(0, 0);
    expect(Array.isArray(moves)).toBe(true);
    // Assuming board allows some moves, e.g., to (0,1) if empty
    expect(moves.length).toBeGreaterThan(0);
  });

  test("getAvailableMovesForPiece returns empty for immovable piece", () => {
    const space = game.board.getSpace(0, 0);
    space.placePiece(new Piece(11, "RED")); // Bomb, immovable
    const moves = game.getAvailableMovesForPiece(0, 0);
    expect(moves).toEqual([]);
  });

  test("getAvailableMovesForPiece returns empty for enemy piece", () => {
    const space = game.board.getSpace(0, 0);
    space.placePiece(new Piece(5, "BLUE")); // Enemy piece
    const moves = game.getAvailableMovesForPiece(0, 0);
    expect(moves).toEqual([]);
  });

  test("getGameState redacts enemy pieces", () => {
    // Place a red piece
    game.board.getSpace(0, 0).placePiece(new Piece(5, "RED"));
    // Place a blue piece
    game.board.getSpace(0, 1).placePiece(new Piece(6, "BLUE"));

    const state = game.getGameState("RED");
    expect(state.board[0][0].piece.rank).toBe(5); // Own piece visible
    expect(state.board[0][1].piece.rank).toBe("HIDDEN"); // Enemy hidden
    expect(state.board[0][1].piece.name).toBe("Enemy Piece");
    expect(state.currentPlayer).toBe("RED");
    expect(state.gameOver).toBe(false);
    expect(state.winner).toBe(null);
  });
});