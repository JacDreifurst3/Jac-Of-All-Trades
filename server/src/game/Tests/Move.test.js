const Move = require("../Move");
const {test, describe, expect } = require("@jest/globals");

describe("Move Class", () => {
  test("should initialize all properties correctly", () => {
    const move = new Move("RED", 0, 0, 1, 1, "SCOUT", true, "MINER");

    expect(move.playerID).toBe("RED");
    expect(move.fromX).toBe(0);
    expect(move.toY).toBe(1);
    expect(move.piece).toBe("SCOUT");
    expect(move.battle).toBe(true);
    expect(move.pieceCaptured).toBe("MINER");
    expect(move.timestamp).toBeDefined();
  });
});