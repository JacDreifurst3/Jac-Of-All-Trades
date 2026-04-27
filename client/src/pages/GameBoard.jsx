import React from "react";
import { Piece } from "../components/BattleLogs.jsx";

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
  onReturnToLobby
}) {
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
          {messages.length > 0 && messages.map((m, i) => (
            <span key={m.id} className={`status-msg ${i === 0 ? "status-msg-latest" : ""}`}>
              {m.text}
            </span>
          ))}
        </div>
      </div>

      {/* The Physical Board */}
      <div className="board-bg">
        {displayBoard.map((space) => {
          const isValidDestination = selectedPiece &&
            availableMoves.some((move) => move.x === space.x && move.y === space.y);

          const isSelected = selectedPiece?.x === space.x && selectedPiece?.y === space.y;
          const isSetupSelected = selectedSetupSlot?.x === space.x && selectedSetupSlot?.y === space.y;

          const inSetupZone = gamePhase === "SETUP" && !setupComplete && (
            playerColor === "RED" ? space.x >= 6 : space.x <= 3
          );
          
          const isSetupValid = inSetupZone && (
            (selectedRank !== null && !space.piece) || 
            (selectedSetupSlot && space.piece && space.piece.owner === playerColor)
          );

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
      </div>
    </div>
  );
}