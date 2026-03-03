const Space = require("../Space");
const Piece = require("../Piece");
const { test, describe, expect } = require("@jest/globals");

describe("Space Class", () => {
  test("should initialize correctly", () => {
    const space = new Space(1, 2, "LAND");
    expect(space.x).toBe(1);
    expect(space.y).toBe(2);
    expect(space.terrain).toBe("LAND");
    expect(space.piece).toBeNull();
  });

  test("isOccupied should be false when empty land", () => {
    const space = new Space(0, 0, "LAND");
    expect(space.isOccupied()).toBe(false);
  });

  test("isOccupied should be true when piece is present", () => {
    const space = new Space(0, 0, "LAND");
    const piece = new Piece(5, "RED");
    space.placePiece(piece);
    expect(space.isOccupied()).toBe(true);
  });

  test("isOccupied should be true for water terrain", () => {
    const space = new Space(4, 2, "WATER");
    expect(space.isOccupied()).toBe(true);
  });

  test("placePiece and removePiece should work correctly", () => {
    const space = new Space(0, 0, "LAND");
    const piece = new Piece(6, "BLUE");

    space.placePiece(piece);
    expect(space.piece).toBe(piece);

    const removed = space.removePiece();
    expect(removed).toBe(piece);
    expect(space.piece).toBeNull();
  });
});