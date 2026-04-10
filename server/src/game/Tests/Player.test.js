const Player = require("../Player");
const { test, describe, expect, beforeEach } = require("@jest/globals");

describe("Player Class", () => {
  let player;

  beforeEach(() => {
    player = new Player("RED");
  });

  test("constructor sets color", () => {
    expect(player.color).toBe("RED");
  });

  test("constructor sets setup to INCOMPLETE", () => {
    expect(player.setup).toBe("INCOMPLETE");
  });

  test("constructor initializes empty layout", () => {
    expect(player.layout).toEqual(Array.from({ length: 4 }, () => new Array(10).fill(null)));
  });

  test("constructor initializes availablePieces map", () => {
    expect(player.availablePieces).toBeInstanceOf(Map);
  });

  test.each([
    [0, 1],
    [1, 1],
    [2, 8],
    [3, 5],
    [4, 4],
    [5, 4],
    [6, 4],
    [7, 3],
    [8, 2],
    [9, 1],
    [10, 1],
    [11, 6],
  ])("startingPieces returns %i copies for rank %i", (rank, count) => {
    const pieces = player.startingPieces();
    expect(pieces.get(rank)).toBe(count);
  });

  test("startingPieces contains 12 ranks", () => {
    expect(player.startingPieces().size).toBe(12);
  });

  test("isSetupComplete returns false initially", () => {
    expect(player.isSetupComplete()).toBe(false);
  });

  test("placePiece sets the layout cell", () => {
    player.placePiece(0, 0, 5);
    expect(player.layout[0][0]).toBe(5);
  });

  test("placePiece decrements the available piece count", () => {
    player.placePiece(0, 0, 5);
    expect(player.availablePieces.get(5)).toBe(3);
  });

  test("placePiece removes rank from available pieces when last one placed", () => {
    player.placePiece(0, 0, 0);
    expect(player.availablePieces.has(0)).toBe(false);
  });

  test("placePiece throws error when space is already occupied", () => {
    player.placePiece(0, 0, 5);
    expect(() => player.placePiece(0, 0, 6)).toThrow("Space not available");
  });

  test("placePiece throws error when rank is unavailable", () => {
    // place all spies
    player.placePiece(0, 0, 1);
    expect(() => player.placePiece(0, 1, 1)).toThrow("No more pieces of rank: 1 available!");
  });

  test("getLayout returns the placed rank", () => {
    player.placePiece(0, 0, 5);
    expect(player.getLayout()[0][0]).toBe(5);
  });

  test("getLayout leaves unrelated cells null", () => {
    player.placePiece(0, 0, 5);
    expect(player.getLayout()[0][1]).toBe(null);
  });

  test("getAvailablePieces returns the same map instance", () => {
    expect(player.getAvailablePieces()).toBe(player.availablePieces);
  });

  test("movePiece moves a piece to an empty destination", () => {
    player.placePiece(0, 0, 5);
    player.movePiece(0, 0, 1, 1);
    expect(player.layout[1][1]).toBe(5);
    expect(player.layout[0][0]).toBe(null);
  });

  test("movePiece swaps with another piece when destination is occupied", () => {
    player.placePiece(0, 0, 5);
    player.placePiece(0, 1, 6);
    player.movePiece(0, 0, 0, 1);
    expect(player.layout[0][1]).toBe(5);
    expect(player.layout[0][0]).toBe(6);
  });

  test("movePiece throws when source has no piece", () => {
    expect(() => player.movePiece(0, 0, 1, 1)).toThrow("No piece to move at the source location.");
  });

  test("randomizeLayout fills every setup cell", () => {
    player.randomizeLayout();
    expect(player.layout.flat().every((cell) => cell !== null)).toBe(true);
  });

  test("randomizeLayout clears availablePieces and enables confirmation", () => {
    player.randomizeLayout();
    expect(player.availablePieces.size).toBe(0);
    expect(player.showConfirmation).toBe(true);
  });

  test("markSetupComplete throws when pieces remain", () => {
    expect(() => player.markSetupComplete()).toThrow("Cannot confirm setup until all pieces are placed.");
  });

  test("markSetupComplete sets setup to COMPLETE after full layout", () => {
    player.randomizeLayout();
    player.markSetupComplete();
    expect(player.isSetupComplete()).toBe(true);
  });
});