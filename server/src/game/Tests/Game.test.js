const Game = require("../Game");
const Piece = require("../Piece");
const { test, describe, expect, beforeEach } = require("@jest/globals");

describe("Game Class (Real Engine - No Mocks)", () => {
  let game;

  beforeEach(() => {
    game = new Game();
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
    }).toThrow("Cannot move into your own piece");
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

    expect(result).toBe("ATTACKER_WINS");
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
});