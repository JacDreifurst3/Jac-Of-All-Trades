const Board = require("../Board");
const Piece = require("../Piece");
const { test, describe, expect } = require("@jest/globals");


describe("Board Class", () => {
  test("should initialize a 10x10 grid by default", () => {
    const board = new Board();
    expect(board.grid.length).toBe(10);
    expect(board.grid[0].length).toBe(10);
  });

  test("water tiles should be marked correctly", () => {
    const board = new Board();
    const waterSpace = board.getSpace(4, 2);
    expect(waterSpace.terrain).toBe("WATER");
  });
  test("board should have exactly 10 columns in every row", () => {
    const board = new Board(10);

    for (let row = 0; row < 10; row++) {
        expect(board.grid[row].length).toBe(10);
    }
    });

  test("getSpace should return null for out of bounds", () => {
    const board = new Board();
    expect(board.getSpace(-1, 0)).toBeNull();
    expect(board.getSpace(100, 100)).toBeNull();
  });

  test("generateMove should throw error if no piece at fromSpace", () => {
    const board = new Board();
    expect(() => {
      board.generateMove(0, 0, 1, 1);
    }).toThrow("Invalid move");
  });

  test("generateMove should return correct move data", () => {
    const board = new Board();
    const piece = new Piece(5, "RED");
    const from = board.getSpace(0, 0);
    const to = board.getSpace(0, 1);

    from.placePiece(piece);

    const moveData = board.generateMove(0, 0, 0, 1);

    expect(moveData.attacker).toBe(piece);
    expect(moveData.defender).toBeNull();
    expect(moveData.fromSpace).toBe(from);
    expect(moveData.toSpace).toBe(to);
  });

  test("executeMove should move piece correctly", () => {
    const board = new Board();
    const piece = new Piece(5, "RED");
    const from = board.getSpace(0, 0);
    const to = board.getSpace(0, 1);

    from.placePiece(piece);
    board.executeMove(from, to);

    expect(from.piece).toBeNull();
    expect(to.piece).toBe(piece);
  });
});