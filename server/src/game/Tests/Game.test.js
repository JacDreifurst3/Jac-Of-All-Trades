const Game = require("../Game");
const Piece = require("../Piece");
const { test, describe, expect, beforeEach } = require("@jest/globals");

describe("Game Class (Real Engine - No Mocks)", () => {
  let game;

  beforeEach(() => {
    game = new Game();
    game.gamePhase = "PLAY"; // Set to PLAY for testing moves
  });

  test("initializes currentPlayer to RED", () => {
    expect(game.currentPlayer).toBe("RED");
  });

  test("initializes empty moveHistory", () => {
    expect(game.moveHistory.length).toBe(0);
  });

  test("initializes gameOver false", () => {
    expect(game.gameOver).toBe(false);
  });

  test("initializes winner null", () => {
    expect(game.winner).toBeNull();
  });

  test("makeMove returns MOVE for a normal move", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);
    const piece = new Piece(5, "RED");
    from.placePiece(piece);

    const result = game.makeMove(0, 0, 0, 1);

    expect(result).toBe("MOVE");
  });

  test("makeMove clears the source square", () => {
    const from = game.board.getSpace(0, 0);
    const piece = new Piece(5, "RED");
    from.placePiece(piece);

    game.makeMove(0, 0, 0, 1);

    expect(from.piece).toBeNull();
  });

  test("makeMove moves the piece to the destination square", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);
    const piece = new Piece(5, "RED");
    from.placePiece(piece);

    game.makeMove(0, 0, 0, 1);

    expect(to.piece).toBe(piece);
  });

  test("makeMove appends a move to history", () => {
    const from = game.board.getSpace(0, 0);
    const piece = new Piece(5, "RED");
    from.placePiece(piece);

    game.makeMove(0, 0, 0, 1);

    expect(game.moveHistory.length).toBe(1);
  });

  test("throws when moving into own piece", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);

    from.placePiece(new Piece(5, "RED"));
    to.placePiece(new Piece(6, "RED"));

    expect(() => game.makeMove(0, 0, 0, 1)).toThrow("Invalid move");
  });

  test("throws when moving an immovable piece", () => {
    const from = game.board.getSpace(0, 0);
    from.placePiece(new Piece(11, "RED"));

    expect(() => game.makeMove(0, 0, 0, 1)).toThrow("This piece cannot move");
  });

  test("attacker wins when rank is higher", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);
    const attacker = new Piece(8, "RED");
    const defender = new Piece(4, "BLUE");

    from.placePiece(attacker);
    to.placePiece(defender);

    expect(game.makeMove(0, 0, 0, 1)).toBe("ATTACKER_WINS");
  });

  test("attacker occupies destination after winning", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);
    const attacker = new Piece(8, "RED");
    const defender = new Piece(4, "BLUE");

    from.placePiece(attacker);
    to.placePiece(defender);
    game.makeMove(0, 0, 0, 1);

    expect(to.piece).toBe(attacker);
  });

  test("defender wins when rank is higher", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);
    from.placePiece(new Piece(4, "RED"));
    to.placePiece(new Piece(8, "BLUE"));

    expect(game.makeMove(0, 0, 0, 1)).toBe("DEFENDER_WINS");
  });

  test("defender piece remains on board after winning", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);
    const defender = new Piece(8, "BLUE");

    from.placePiece(new Piece(4, "RED"));
    to.placePiece(defender);
    game.makeMove(0, 0, 0, 1);

    expect(to.piece).toBe(defender);
    expect(from.piece).toBeNull();
  });

  test("same rank eliminates both pieces", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);
    from.placePiece(new Piece(5, "RED"));
    to.placePiece(new Piece(5, "BLUE"));

    expect(game.makeMove(0, 0, 0, 1)).toBe("BOTH_DIE");
  });

  test("same rank removes both pieces", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);
    from.placePiece(new Piece(5, "RED"));
    to.placePiece(new Piece(5, "BLUE"));
    game.makeMove(0, 0, 0, 1);

    expect(from.piece).toBeNull();
    expect(to.piece).toBeNull();
  });

  test("miner defuses bomb", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);
    from.placePiece(new Piece(3, "RED"));
    to.placePiece(new Piece(11, "BLUE"));

    expect(game.makeMove(0, 0, 0, 1)).toBe("ATTACKER_DEFUSED_BOMB");
  });

  test("miner occupies bomb square after defusing", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);
    from.placePiece(new Piece(3, "RED"));
    to.placePiece(new Piece(11, "BLUE"));
    game.makeMove(0, 0, 0, 1);

    expect(to.piece.rank).toBe(3);
  });

  test("flag capture ends the game", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);
    from.placePiece(new Piece(6, "RED"));
    to.placePiece(new Piece(0, "BLUE"));

    expect(game.makeMove(0, 0, 0, 1)).toBe("FLAG_CAPTURED");
  });

  test("flag capture sets game over and winner", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);
    from.placePiece(new Piece(6, "RED"));
    to.placePiece(new Piece(0, "BLUE"));
    game.makeMove(0, 0, 0, 1);

    expect(game.gameOver).toBe(true);
    expect(game.winner).toBe("RED");
  });

  test("spy assassinates marshal", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);
    from.placePiece(new Piece(1, "RED"));
    to.placePiece(new Piece(10, "BLUE"));

    expect(game.makeMove(0, 0, 0, 1)).toBe("ATTACKER_ASSASINATED_MARSHAL");
  });

  test("spy occupies marshal square after assassination", () => {
    const from = game.board.getSpace(0, 0);
    const to = game.board.getSpace(0, 1);
    from.placePiece(new Piece(1, "RED"));
    to.placePiece(new Piece(10, "BLUE"));
    game.makeMove(0, 0, 0, 1);

    expect(to.piece.rank).toBe(1);
  });

  test("placePiece stores piece in player layout during setup", () => {
    game.gamePhase = "SETUP";
    game.placePiece("RED", 0, 0, 5);
    expect(game.players.RED.player.getLayout()[0][0]).toBe(5);
  });

  test("placePiece decreases player available pieces during setup", () => {
    game.gamePhase = "SETUP";
    game.placePiece("RED", 0, 0, 5);
    expect(game.players.RED.player.getAvailablePieces().get(5)).toBe(3);
  });

  test("placePiece throws if not setup phase", () => {
    game.gamePhase = "PLAY";
    expect(() => game.placePiece("RED", 0, 0, 5)).toThrow("Not in setup phase");
  });

  test("switchTurn toggles currentPlayer", () => {
    expect(game.currentPlayer).toBe("RED");
    game.switchTurn();
    expect(game.currentPlayer).toBe("BLUE");
    game.switchTurn();
    expect(game.currentPlayer).toBe("RED");
  });

  test("getAvailableMovesForPiece returns array for movable piece", () => {
    const space = game.board.getSpace(0, 0);
    space.placePiece(new Piece(5, "RED"));

    const moves = game.getAvailableMovesForPiece(0, 0);
    expect(Array.isArray(moves)).toBe(true);
  });

  test("getAvailableMovesForPiece returns some moves for movable piece", () => {
    const space = game.board.getSpace(0, 0);
    space.placePiece(new Piece(5, "RED"));

    const moves = game.getAvailableMovesForPiece(0, 0);
    expect(moves.length).toBeGreaterThan(0);
  });

  test("getAvailableMovesForPiece returns empty for immovable piece", () => {
    const space = game.board.getSpace(0, 0);
    space.placePiece(new Piece(11, "RED"));

    const moves = game.getAvailableMovesForPiece(0, 0);
    expect(moves).toEqual([]);
  });

  test("getAvailableMovesForPiece returns empty for enemy piece", () => {
    const space = game.board.getSpace(0, 0);
    space.placePiece(new Piece(5, "BLUE"));

    const moves = game.getAvailableMovesForPiece(0, 0);
    expect(moves).toEqual([]);
  });

  test("getGameState shows own piece rank", () => {
    game.board.getSpace(0, 0).placePiece(new Piece(5, "RED"));
    const state = game.getGameState("RED");
    expect(state.board[0][0].piece.rank).toBe(5);
  });

  test("getGameState hides enemy piece rank", () => {
    game.board.getSpace(0, 1).placePiece(new Piece(6, "BLUE"));
    const state = game.getGameState("RED");
    expect(state.board[0][1].piece.rank).toBe("HIDDEN");
  });

  test("getGameState labels hidden enemy piece", () => {
    game.board.getSpace(0, 1).placePiece(new Piece(6, "BLUE"));
    const state = game.getGameState("RED");
    expect(state.board[0][1].piece.name).toBe("Enemy Piece");
  });

  test("getGameState includes currentPlayer", () => {
    const state = game.getGameState("RED");
    expect(state.currentPlayer).toBe("RED");
  });

  test("getGameState includes gameOver state", () => {
    const state = game.getGameState("RED");
    expect(state.gameOver).toBe(false);
  });

  test("getGameState includes winner state", () => {
    const state = game.getGameState("RED");
    expect(state.winner).toBe(null);
  });

  test("getGameState includes showConfirmation", () => {
    game.gamePhase = "SETUP";
    game.randomizePlayerLayout("RED");
    const state = game.getGameState("RED");
    expect(state.showConfirmation).toBe(true);
  });

  test("moveSetupPiece moves a piece within the setup layout", () => {
    game.gamePhase = "SETUP";
    game.placePiece("RED", 0, 0, 5);
    game.moveSetupPiece("RED", 0, 0, 0, 1);
    expect(game.players.RED.player.getLayout()[0][1]).toBe(5);
    expect(game.players.RED.player.getLayout()[0][0]).toBe(null);
  });

  test("randomizePlayerLayout fills the player setup and enables confirmation", () => {
    game.gamePhase = "SETUP";
    game.randomizePlayerLayout("RED");
    expect(game.players.RED.player.getLayout().flat().every((cell) => cell !== null)).toBe(true);
    expect(game.players.RED.player.showConfirmation).toBe(true);
  });

  test("markPlayerSetupComplete keeps game in SETUP until both players confirm", () => {
    game.gamePhase = "SETUP";
    game.randomizePlayerLayout("RED");
    game.randomizePlayerLayout("BLUE");

    game.markPlayerSetupComplete("RED");
    expect(game.players.RED.player.isSetupComplete()).toBe(true);
    expect(game.gamePhase).toBe("SETUP");
  });

  test("markPlayerSetupComplete transitions game to PLAY when both players confirm", () => {
    game.gamePhase = "SETUP";
    game.randomizePlayerLayout("RED");
    game.randomizePlayerLayout("BLUE");

    game.markPlayerSetupComplete("RED");
    game.markPlayerSetupComplete("BLUE");

    expect(game.gamePhase).toBe("PLAY");
    expect(game.board.getSpace(0, 0).piece).not.toBeNull();
  });
});