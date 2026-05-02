import React, { useState, useEffect, useRef } from "react";
import { Piece } from "../components/BattleLogs.jsx";

/*  Explosion particle data */
const PARTICLE_COUNT = 12;
const EMBER_COUNT = 8;

// Generates animated explosion particles and embers for a given color theme
function buildParticles(colorClass) {
  const particles = [];

  // Main burst particles — spread radially from explosion center
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (360 / PARTICLE_COUNT) * i + Math.random() * 15;
    const dist = 28 + Math.random() * 32;
    const rad = (angle * Math.PI) / 180;
    const tx = Math.cos(rad) * dist;
    const ty = Math.sin(rad) * dist;
    const dur = 0.45 + Math.random() * 0.25;
    const delay = Math.random() * 0.08;

    // Color palette varies by which team/outcome triggered the explosion
    const colors = colorClass === "red"
      ? ["#e04040", "#ff8080", "#ffdddd", "#ff4400"]
      : colorClass === "blue"
        ? ["#4080e0", "#80b4ff", "#ddeeff", "#40c0ff"]
        : colorClass === "flag"
          ? ["#f5dd81", "#ffe066", "#fff5cc", "#ffaa00"]
          : ["#e0a020", "#ffcc44", "#ffeeaa", "#ff6600"];
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

  // Ember streaks — thinner and slightly delayed for a trailing fire effect
  for (let i = 0; i < EMBER_COUNT; i++) {
    const angle = (360 / EMBER_COUNT) * i + Math.random() * 20;
    const dist = 22 + Math.random() * 28;
    const rad = (angle * Math.PI) / 180;
    const tx = Math.cos(rad) * dist;
    const ty = Math.sin(rad) * dist;
    const dur = 0.55 + Math.random() * 0.2;
    const delay = 0.02 + Math.random() * 0.06;
    const bg = colorClass === "red" ? "#ff6020"
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

/*  ExplosionOverlay */
// Positions the explosion effect over the correct board square
function ExplosionOverlay({ explosion, displayBoard }) {
  if (!explosion) return null;

  const { boardX, boardY, colorClass } = explosion;

  // Find the display index to convert board coords → CSS percentages
  const idx = displayBoard.findIndex(s => s.x === boardX && s.y === boardY);
  if (idx === -1) return null;

  const displayRow = Math.floor(idx / 10);
  const displayCol = idx % 10;

  const left = `${(displayCol / 10) * 100 + 5}%`;
  const top = `${(displayRow / 10) * 100 + 5}%`;

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

// Briefly shows a status message (e.g. "Red attacks Blue") — hides after ~2.8s
// Skips flag-related messages since those are handled by the game-over overlay
function StatusUpdate({ messages }) {
  const [visible, setVisible] = useState(false);
  const [currentMsg, setCurrentMsg] = useState(null);
  const hideTimer = useRef(null);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const latest = messages[0];
    if (!latest) return;

    const text = latest.text || "";
    if (text.includes("Flag") || text.includes("flag")) return;

    clearTimeout(hideTimer.current);

    setCurrentMsg(latest);
    setVisible(true);

    // Auto-hide after display duration
    hideTimer.current = setTimeout(() => {
      setVisible(false);
    }, 2800);

    return () => clearTimeout(hideTimer.current);
  }, [messages]);

  if (!currentMsg) return null;

  return (
    <div
      className={`status-update ${visible ? "status-update--visible" : "status-update--hidden"}`}
      aria-live="polite"
    >
      <span className="status-update__text">{currentMsg.text}</span>
    </div>
  );
}

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
  lastBattle,
  onDragStart,
  onDrop
}) {
  const [explosion, setExplosion] = useState(null);
  const explosionTimer = useRef(null);
  const [dragOverKey, setDragOverKey] = useState(null); // tracks which tile is being dragged over

  // Trigger an explosion whenever a new battle result arrives
  useEffect(() => {
    if (!lastBattle) return;

    const { result, attackerColor, defenderColor, toX, toY } = lastBattle;
    if (toX == null || toY == null) return;

    // Pick explosion color based on who died (or "both" / "flag")
    let colorClass;
    if (result === "FLAG_CAPTURED") colorClass = "flag";
    else if (result === "BOTH_DIE") colorClass = "both";
    else if (result === "ATTACKER_WINS") colorClass = defenderColor?.toLowerCase() ?? "red";
    else colorClass = attackerColor?.toLowerCase() ?? "blue";

    // Reset then re-trigger so re-battles on same square still animate
    clearTimeout(explosionTimer.current);
    setExplosion(null);

    requestAnimationFrame(() => {
      setExplosion({ boardX: toX, boardY: toY, colorClass });
      explosionTimer.current = setTimeout(() => setExplosion(null), 900);
    });
  }, [lastBattle]);

  return (
    <div className="board-wrapper">
      {error && <div className="error-toast">{error}</div>}

      <StatusUpdate messages={messages} />

      {/* Modal shown when the game ends */}
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

      {/* Top bar — lobby name, phase, and whose turn it is */}
      <div className="status-bar">
        <button className="lobby-back-btn" onClick={onReturnToLobby}>
          ⌂ Lobby
        </button>

        <div className="status-bar__center">
          <span className="status-center-text">
            Lobby: <strong>{activeLobby}</strong>
          </span>
          <span className="status-bar__divider" />
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
      </div>

      {/* Shown after this player finishes setup but the opponent hasn't yet */}
      {setupComplete && gamePhase === "SETUP" && (
        <div className="waiting-overlay">
          <div className="waiting-modal">
            <div className="waiting-modal__pulse" />
            <span className="waiting-modal__text">Waiting for opponent…</span>
          </div>
        </div>
      )}

      {/* The board grid */}
      <div className="board-bg" style={{ position: "relative" }}>
        {displayBoard.map((space) => {
          // Highlight squares the selected piece can legally move to
          const isValidDestination =
            selectedPiece &&
            availableMoves.some((move) => move.x === space.x && move.y === space.y);

          const isSelected =
            selectedPiece?.x === space.x && selectedPiece?.y === space.y;
          const isSetupSelected =
            selectedSetupSlot?.x === space.x && selectedSetupSlot?.y === space.y;

          // Only the player's back 4 rows are valid during setup
          const inSetupZone =
            gamePhase === "SETUP" &&
            !setupComplete &&
            (playerColor === "RED" ? space.x >= 6 : space.x <= 3);

          // A setup square is valid if placing a new piece (empty) or swapping own pieces
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
                ${isSetupValid ? "setup-valid" : ""}
                ${dragOverKey === `${space.x},${space.y}` ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); if (isValidDestination || isSetupValid) setDragOverKey(`${space.x},${space.y}`); }}
              onDragLeave={() => setDragOverKey(null)}
              onDrop={(e) => { setDragOverKey(null); onDrop(e, space); }}
              onClick={() => handleSquareClick(space)}
            >
              {space.piece && (
                <div
                  className="piece-draggable-wrapper"
                  // Only allow dragging on your turn (or during setup)
                  draggable={gamePhase === "SETUP" || (gamePhase === "PLAY" && turn === playerColor)}
                  onDragStart={(e) => onDragStart(e, space)}
                >
                  <div className="piece-container" style={{ pointerEvents: 'none' }}>
                    <Piece owner={space.piece.owner} rank={space.piece.rank} />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <ExplosionOverlay explosion={explosion} displayBoard={displayBoard} />
      </div>
    </div>
  );
}