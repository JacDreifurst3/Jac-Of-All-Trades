const Board = require("../Board");
const Piece = require("../Piece");
const { test, describe, expect } = require("@jest/globals");

describe("Board Class", () => {
  test("should initialize 10 rows by default", () => {
    const board = new Board();
    expect(board.grid.length).toBe(10);
  });

  test("should initialize 10 columns by default", () => {
    const board = new Board();
    expect(board.grid[0].length).toBe(10);
  });

  test("water tiles should be marked correctly", () => {
    const board = new Board();
    const waterSpace = board.getSpace(4, 2);
    expect(waterSpace.terrain).toBe("WATER");
  });

  test("board should have exactly 10 columns in every row", () => {
    const board = new Board(10);
    expect(board.grid.every(row => row.length === 10)).toBe(true);
  });

  test("getSpace returns null for negative coordinates", () => {
    const board = new Board();
    expect(board.getSpace(-1, 0)).toBeNull();
  });

  test("getSpace returns null for coordinates outside bounds", () => {
    const board = new Board();
    expect(board.getSpace(100, 100)).toBeNull();
  });

  test("generateMove should throw error if no piece at fromSpace", () => {
    const board = new Board();
    expect(() => {
      board.generateMove(0, 0, 1, 1);
    }).toThrow("Invalid move");
  });

  test("generateMove returns correct move data", () => {
    const board = new Board();
    const piece = new Piece(5, "RED");
    const from = board.getSpace(0, 0);
    const to = board.getSpace(0, 1);

    from.placePiece(piece);

    const moveData = board.generateMove(0, 0, 0, 1);

    expect(moveData).toEqual({
      attacker: piece,
      defender: null,
      fromSpace: from,
      toSpace: to,
    });
  });

  test("executeMove removes piece from source", () => {
    const board = new Board();
    const piece = new Piece(5, "RED");
    const from = board.getSpace(0, 0);
    const to = board.getSpace(0, 1);

    from.placePiece(piece);
    board.executeMove(from, to);

    expect(from.piece).toBeNull();
  });

  test("executeMove places piece at destination", () => {
    const board = new Board();
    const piece = new Piece(5, "RED");
    const from = board.getSpace(0, 0);
    const to = board.getSpace(0, 1);

    from.placePiece(piece);
    board.executeMove(from, to);

    expect(to.piece).toBe(piece);
  });
  test("validateMove returns false for null destination", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);
    from.placePiece(new Piece(5, "RED"));

    expect(board.validateMove(from, null)).toBe(false);
  });

  test("validateMove returns false for water space", () => {
    const board = new Board();
    const from = board.getSpace(3, 2);
    const water = board.getSpace(4, 2);

    from.placePiece(new Piece(5, "RED"));

    expect(board.validateMove(from, water)).toBe(false);
  });

  test("validateMove returns true for empty land space", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);
    const emptyLand = board.getSpace(0, 1);

    from.placePiece(new Piece(5, "RED"));

    expect(board.validateMove(from, emptyLand)).toBe(true);
  });

  test("validateMove returns false for friendly occupied space", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);
    const friendly = board.getSpace(0, 1);

    from.placePiece(new Piece(5, "RED"));
    friendly.placePiece(new Piece(6, "RED"));

    expect(board.validateMove(from, friendly)).toBe(false);
  });

  test("validateMove returns true for enemy occupied space", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);
    const enemy = board.getSpace(0, 1);

    from.placePiece(new Piece(5, "RED"));
    enemy.placePiece(new Piece(6, "BLUE"));

    expect(board.validateMove(from, enemy)).toBe(true);
  });

  test("getAvailableMoves for a normal piece returns only adjacent legal moves", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);

    from.placePiece(new Piece(5, "RED"));

    expect(board.getAvailableMoves(from)).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ]);
  });

  test("getAvailableMoves does not include water", () => {
    const board = new Board();
    const from = board.getSpace(3, 2);

    from.placePiece(new Piece(5, "RED"));

    const moves = board.getAvailableMoves(from);

    expect(moves).not.toContainEqual({ x: 4, y: 2 });
  });

  test("getAvailableMoves does not include a friendly occupied space", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);
    const friendly = board.getSpace(1, 0);

    from.placePiece(new Piece(5, "RED"));
    friendly.placePiece(new Piece(6, "RED"));

    const moves = board.getAvailableMoves(from);

    expect(moves).not.toContainEqual({ x: 1, y: 0 });
  });

  test("getAvailableMoves includes an enemy occupied space as a legal attack", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);
    const enemy = board.getSpace(1, 0);

    from.placePiece(new Piece(5, "RED"));
    enemy.placePiece(new Piece(6, "BLUE"));

    const moves = board.getAvailableMoves(from);

    expect(moves).toContainEqual({ x: 1, y: 0 });
  });

  test("scout can move one space to the right", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);

    from.placePiece(new Piece(2, "RED"));

    const moves = board.getAvailableMoves(from);

    expect(moves).toContainEqual({ x: 1, y: 0 });
  });

  test("scout can move two spaces to the right", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);

    from.placePiece(new Piece(2, "RED"));

    const moves = board.getAvailableMoves(from);

    expect(moves).toContainEqual({ x: 2, y: 0 });
  });

  test("scout can move three spaces to the right", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);

    from.placePiece(new Piece(2, "RED"));

    const moves = board.getAvailableMoves(from);

    expect(moves).toContainEqual({ x: 3, y: 0 });
  });

  test("scout can move one space down", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);

    from.placePiece(new Piece(2, "RED"));

    const moves = board.getAvailableMoves(from);

    expect(moves).toContainEqual({ x: 0, y: 1 });
  });

  test("scout can move two spaces down", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);

    from.placePiece(new Piece(2, "RED"));

    const moves = board.getAvailableMoves(from);

    expect(moves).toContainEqual({ x: 0, y: 2 });
  });

  test("scout can move three spaces down", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);

    from.placePiece(new Piece(2, "RED"));

    const moves = board.getAvailableMoves(from);

    expect(moves).toContainEqual({ x: 0, y: 3 });
  });

  test("scout movement stops at a friendly piece after one space", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);
    const blocker = board.getSpace(2, 0);

    from.placePiece(new Piece(2, "RED"));
    blocker.placePiece(new Piece(5, "RED"));

    const moves = board.getAvailableMoves(from);

    expect(moves).toContainEqual({ x: 1, y: 0 });
  });

  test("scout movement does not include the blocking friendly square", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);
    const blocker = board.getSpace(2, 0);

    from.placePiece(new Piece(2, "RED"));
    blocker.placePiece(new Piece(5, "RED"));

    const moves = board.getAvailableMoves(from);

    expect(moves).not.toContainEqual({ x: 2, y: 0 });
  });

  test("scout movement does not include spaces beyond a friendly block", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);
    const blocker = board.getSpace(2, 0);

    from.placePiece(new Piece(2, "RED"));
    blocker.placePiece(new Piece(5, "RED"));

    const moves = board.getAvailableMoves(from);

    expect(moves).not.toContainEqual({ x: 3, y: 0 });
  });

  test("scout movement includes enemy square as attack destination", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);
    const enemy = board.getSpace(2, 0);

    from.placePiece(new Piece(2, "RED"));
    enemy.placePiece(new Piece(5, "BLUE"));

    const moves = board.getAvailableMoves(from);

    expect(moves).toContainEqual({ x: 2, y: 0 });
  });

  test("scout movement does not include spaces beyond an enemy block", () => {
    const board = new Board();
    const from = board.getSpace(0, 0);
    const enemy = board.getSpace(2, 0);

    from.placePiece(new Piece(2, "RED"));
    enemy.placePiece(new Piece(5, "BLUE"));

    const moves = board.getAvailableMoves(from);

    expect(moves).not.toContainEqual({ x: 3, y: 0 });
  });

  test("serialize returns a 10 by 10 board structure", () => {
    const board = new Board();
    const serialized = board.serialize();

    expect(serialized.length).toBe(10);
  });

  test("serialize returns rows with exactly 10 columns", () => {
    const board = new Board();
    const serialized = board.serialize();

    expect(serialized.every(row => row.length === 10)).toBe(true);
  });
  
});
