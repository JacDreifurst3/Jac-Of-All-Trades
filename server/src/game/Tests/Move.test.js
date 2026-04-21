const Move = require("../Move");
const {test, describe, expect } = require("@jest/globals");

describe("Move Class", () => {
  test("should initialize all properties correctly", () => {
    const move = new Move("RED", 0, 0, 1, 1, "SCOUT", true, "MINER");

    expect({
      playerID: move.playerID,
      fromX: move.fromX,
      fromY: move.fromY,
      toX: move.toX,
      toY: move.toY,
      piece: move.piece,
      battle: move.battle,
      pieceCaptured: move.pieceCaptured,
    }).toEqual({
      playerID: "RED",
      fromX: 0,
      fromY: 0,
      toX: 1,
      toY: 1,
      piece: "SCOUT",
      battle: true,
      pieceCaptured: "MINER",
    });
  });

  test("timestamp is defined on initialization", () => {
    const move = new Move("RED", 0, 0, 1, 1, "SCOUT", true, "MINER");
    expect(move.timestamp).toBeDefined();
  });
});
