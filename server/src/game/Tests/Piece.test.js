const Piece = require("../Piece");
const { test, describe, expect } = require("@jest/globals");

describe("Piece Class", () => {
  test("should initialize with correct rank, owner, and revealed state", () => {
    const piece = new Piece(5, "RED");
    expect({ rank: piece.rank, owner: piece.owner, isRevealed: piece.isRevealed }).toEqual({
      rank: 5,
      owner: "RED",
      isRevealed: false,
    });
  });

  test("canMove should return true for movable ranks", () => {
    const piece = new Piece(5, "BLUE");
    expect(piece.canMove()).toBe(true);
  });

  test("canMove should return false for flag (0)", () => {
    const flag = new Piece(0, "RED");
    expect(flag.canMove()).toBe(false);
  });

  test("canMove should return false for bomb (11)", () => {
    const bomb = new Piece(11, "RED");
    expect(bomb.canMove()).toBe(false);
  });

  test("reveal and hide should toggle isRevealed back to false", () => {
    const piece = new Piece(4, "RED");
    piece.reveal();
    piece.hide();
    expect(piece.isRevealed).toBe(false);
  });

  test("rank helper methods should work correctly", () => {
    const miner = new Piece(3, "RED");
    const spy = new Piece(1, "RED");
    const scout = new Piece(2, "RED");
    const bomb = new Piece(11, "RED");
    const flag = new Piece(0, "RED");

    expect([
      miner.isMiner(),
      spy.isSpy(),
      scout.isScout(),
      bomb.isFlag(),
      flag.isBomb(),
    ]).toEqual([true, true, true, true, true]);
  });

  test("getRank should return correct rank", () => {
    const piece = new Piece(7, "BLUE");
    expect(piece.getRank()).toBe(7);
  });
});
