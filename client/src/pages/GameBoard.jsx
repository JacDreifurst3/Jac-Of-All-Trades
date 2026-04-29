import React, { useState, useEffect, useRef } from "react";
import { Piece } from "../components/BattleLogs.jsx";

/* ─── Explosion particle data ─────────────────────────────── */
const PARTICLE_COUNT = 12;
const EMBER_COUNT    = 8;

function buildParticles(colorClass) {
  const particles = [];
  // Round sparks
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle  = (360 / PARTICLE_COUNT) * i + Math.random() * 15;
    const dist   = 28 + Math.random() * 32;
    const rad    = (angle * Math.PI) / 180;
    const tx     = Math.cos(rad) * dist;
    const ty     = Math.sin(rad) * dist;
    const dur    = 0.45 + Math.random() * 0.25;
    const delay  = Math.random() * 0.08;
    // Alternating colors: primary, light, white
    const colors = colorClass === "red"
      ? ["#e04040", "#ff8080", "#ffdddd", "#ff4400"]
      : colorClass === "blue"
      ? ["#4080e0", "#80b4ff", "#ddeeff", "#40c0ff"]
      : colorClass === "flag"
      ? ["#f5dd81", "#ffe066", "#fff5cc", "#ffaa00"]
      : ["#e0a020", "#ffcc44", "#ffeeaa", "#ff6600"]; // both
    const bg = colors[i % colors.length];
    particles.push(
      <div
        key={`p-${i}`}
        className="explosion-particle"
        style={{
          background: bg,
          boxShadow: `0 0 4px ${bg}`,
          "--tx": `${tx}px`,
          "--ty": `${ty}px`,
          "--dur": `${dur}s`,
          "--delay": `${delay}s`,
        }}
      />
    );
  }
  // Ember streaks
  for (let i = 0; i < EMBER_COUNT; i++) {
    const angle = (360 / EMBER_COUNT) * i + Math.random() * 20;
    const dist  = 22 + Math.random() * 28;
    const rad   = (angle * Math.PI) / 180;
    const tx    = Math.cos(rad) * dist;
    const ty    = Math.sin(rad) * dist;
    const dur   = 0.55 + Math.random() * 0.2;
    const delay = 0.02 + Math.random() * 0.06;
    const bg    = colorClass === "red"  ? "#ff6020"
                : colorClass === "blue" ? "#20a0ff"
                : colorClass === "flag" ? "#ffcc00"
                : "#ffaa00";
    particles.push(
      <div
        key={`e-${i}`}
        className="explosion-ember"
        style={{
          background: `linear-gradient(to bottom, white, ${bg})`,
          "--angle": `${angle}deg`,
          "--tx": `${tx}px`,
          "--ty": `${ty}px`,
          "--dur": `${dur}s`,
          "--delay": `${delay}s`,
        }}
      />
    );
  }
  return particles;
}

/* ─── ExplosionOverlay ────────────────────────────────────── */
/**
 * Renders an explosion centred on the grid tile at (boardX, boardY).
 * The board is a 10×10 CSS grid; we use percentage-based positioning.
 * boardX = row index (0–9), boardY = col index (0–9)
 * playerColor tells us if the board is flipped (BLUE sees reversed rows).
 */
function ExplosionOverlay({ explosion, displayBoard }) {
  if (!explosion) return null;

  const { boardX, boardY, colorClass } = explosion;

  // Find the tile in the displayBoard flat array — the grid renders tiles
  // in array order, so the index directly maps to (row, col) in the display grid.
  const idx = displayBoard.findIndex(s => s.x === boardX && s.y === boardY);
  if (idx === -1) return null;

  const displayRow = Math.floor(idx / 10);
  const displayCol = idx % 10;

  // Centre of the tile in percent (board is 10×10)
  const left = `${(displayCol / 10) * 100 + 5}%`;
  const top  = `${(displayRow / 10) * 100 + 5}%`;

  const flashBg = "rgba(255, 220, 40, 0.75)";

  return (
    <div
      className={`explosion-container ${colorClass}`}
      style={{ left, top }}
    >
      <div className="explosion-flash" style={{ background: flashBg }} />
      <div className="explosion-ring" />
      <div className="explosion-smoke" />
      {buildParticles(colorClass)}
    </div>
  );
}

/* ─── GameBoard ───────────────────────────────────────────── */
export default function GameBoard({
  activeLobby,
  gamePhase,
  turn,
  playerColor,
  error,
  messages,
  gameOver,
  winner,
  winReason,
  displayBoard,
  selectedPiece,
  availableMoves,
  selectedSetupSlot,
  selectedRank,
  setupComplete,
  handleSquareClick,
  onReturnToLobby,
  lastBattle,           // NEW — passed from App.jsx
}) {
  const [explosion, setExplosion] = useState(null);
  const explosionTimer = useRef(null);

  /* Watch lastBattle and fire explosion at the defender's position */
  useEffect(() => {
    if (!lastBattle) return;

    // lastBattle must include toX / toY (defender coords)
    const { result, attackerColor, defenderColor, toX, toY } = lastBattle;
    if (toX == null || toY == null) return;

    // Determine explosion colour theme
    let colorClass;
    if (result === "FLAG_CAPTURED") colorClass = "flag";
    else if (result === "BOTH_DIE")      colorClass = "both";
    else if (result === "ATTACKER_WINS") colorClass = defenderColor?.toLowerCase() ?? "red";
    else                                 colorClass = attackerColor?.toLowerCase() ?? "blue";

    // Clear any previous explosion immediately
    clearTimeout(explosionTimer.current);
    setExplosion(null);

    // Small timeout so React re-mounts the animation even for back-to-back battles
    requestAnimationFrame(() => {
      setExplosion({ boardX: toX, boardY: toY, colorClass });
      explosionTimer.current = setTimeout(() => setExplosion(null), 900);
    });
  }, [lastBattle]);

  return (
    <div className="board-wrapper">
      {error && <div className="error-toast">{error}</div>}

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <h2>Game Over!</h2>
            <p className={`winner-announcement ${winner?.toLowerCase()}`}>
              {winner} Team Wins!
            </p>
            <p>
              {winReason === "flag_captured"
                ? "The flag has been captured!"
                : "The opponent has no available moves!"}
            </p>
            <button onClick={onReturnToLobby} className="return-lobby-btn">
              Return to Lobby
            </button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-info">
          <button className="lobby-back-btn" onClick={onReturnToLobby}>
            ⌂ Lobby
          </button>
          <span className="status-center-text">
            Lobby: <strong>{activeLobby}</strong>
          </span>
          {gamePhase === "SETUP" && (
            <span className="status-center-text">
              <strong>Setup Phase</strong>
            </span>
          )}
          {gamePhase === "PLAY" && (
            <span className="status-center-text">
              Turn: <strong className={turn.toLowerCase()}>{turn}</strong>
            </span>
          )}
        </div>

        {setupComplete && gamePhase === "SETUP" && (
          <div className="setup-waiting">
            <div className="setup-waiting__pulse" />
            Waiting for opponent…
          </div>
        )}

        <div className="status-messages status-messages--centered">
          {messages.length > 0 &&
            messages.map((m, i) => (
              <span key={m.id} className={`status-msg ${i === 0 ? "status-msg-latest" : ""}`}>
                {m.text}
              </span>
            ))}
        </div>
      </div>

      {/* The Physical Board */}
      <div className="board-bg" style={{ position: "relative" }}>
        {displayBoard.map((space) => {
          const isValidDestination =
            selectedPiece &&
            availableMoves.some((move) => move.x === space.x && move.y === space.y);

          const isSelected =
            selectedPiece?.x === space.x && selectedPiece?.y === space.y;
          const isSetupSelected =
            selectedSetupSlot?.x === space.x && selectedSetupSlot?.y === space.y;

          const inSetupZone =
            gamePhase === "SETUP" &&
            !setupComplete &&
            (playerColor === "RED" ? space.x >= 6 : space.x <= 3);

          const isSetupValid =
            inSetupZone &&
            ((selectedRank !== null && !space.piece) ||
              (selectedSetupSlot && space.piece && space.piece.owner === playerColor));

          return (
            <div
              key={`${space.x},${space.y}`}
              className={`tile ${space.terrain === "WATER" ? "lake" : "grass"}
                ${isSelected || isSetupSelected ? "selected" : ""}
                ${isValidDestination ? "valid-destination" : ""}
                ${isSetupValid ? "setup-valid" : ""}`}
              onClick={() => handleSquareClick(space)}
            >
              {space.piece && (
                <Piece owner={space.piece.owner} rank={space.piece.rank} />
              )}
            </div>
          );
        })}

        {/* Explosion overlay — renders on top of all tiles */}
        <ExplosionOverlay explosion={explosion} displayBoard={displayBoard} />
      </div>
    </div>
  );
}