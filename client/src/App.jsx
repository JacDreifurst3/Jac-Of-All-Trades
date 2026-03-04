import { useState } from "react";
import "./App.css";
import { PieceIcon, LAKES, BOARD_SIZE } from "./components/Pieces.jsx";
import { useGame } from "./hooks/useGame"; 

export default function App() {
  const [lobbyInput, setLobbyInput] = useState("");
  const [activeLobby, setActiveLobby] = useState(null);
  const [playerColor, setPlayerColor] = useState("RED");

  const { board, turn, error, sendMove, selectPiece, availableMoves, selectedPiece, clearSelection } = useGame(activeLobby, playerColor);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const displayBoard = playerColor === "BLUE" ? [...board].reverse() : board;
  // Lobby Screen
  if (!activeLobby) {
  return (
    <div className="lobby-screen">
      <h1>Stratego</h1>
      <div className="setup-controls">
        <input 
          value={lobbyInput} 
          onChange={(e) => setLobbyInput(e.target.value.toUpperCase())} 
          placeholder="Enter Lobby Code"
        />
        
        {/* Team Selection Buttons */}
        <div className="team-selector">
          <button 
            className={`reg-btn red ${playerColor === "RED" ? "active" : ""}`}
            onClick={() => setPlayerColor("RED")}
          >Red Team</button>
          <button 
            className={`reg-btn blue ${playerColor === "BLUE" ? "active" : ""}`}
            onClick={() => setPlayerColor("BLUE")}
          >Blue Team</button>
        </div>

        <button className="join-btn" onClick={() => setActiveLobby(lobbyInput)}>
          Join Game
        </button>
      </div>
    </div>
  );
}

  const handleSquareClick = (space) => {
    // If it's not this player's turn, block all moves
    if (turn !== playerColor) {
      return;
    }

    const hasOwnPiece = space.piece && space.piece.owner === playerColor;
    const isEmpty = !space.piece;

    // If no piece is selected yet
    if (!selectedPiece) {
      // Only select if it's your piece AND it will have available moves
      if (hasOwnPiece) {
        selectPiece(space.x, space.y);
      }
    } else {
      // A piece is already selected
      
      // Clicking empty space or enemy piece clears selection if it's not a valid move
      const isValidMove = availableMoves.some(move => move.x === space.x && move.y === space.y);
      
      if (isValidMove) {
        // Execute the move
        sendMove(selectedPiece.x, selectedPiece.y, space.x, space.y);
        clearSelection();
      } else if (isEmpty) {
        // Clicking empty space = deselect
        clearSelection();
      } else if (hasOwnPiece) {
        // Clicking another own piece = switch selection to that piece
        selectPiece(space.x, space.y);
      }
    }
  };

  return (
  <div className="board-wrapper">
    {error && <div className="error-toast">{error}</div>}
    
    <div className="status-bar">
      <span>Lobby: <strong>{activeLobby}</strong></span>
      <span>Turn: <strong className={turn.toLowerCase()}>{turn}</strong></span>
    </div>

    <div className="board-bg">
  {displayBoard.map((space) => {
    const isValidDestination = selectedPiece && availableMoves.some(move => move.x === space.x && move.y === space.y);
    const isSelected = selectedPiece?.x === space.x && selectedPiece?.y === space.y;
    
    return (
    <div 
      key={`${space.x},${space.y}`} 
      className={`tile ${space.terrain === "WATER" ? "lake" : "grass"} ${
        isSelected ? "selected" : ""
      } ${isValidDestination ? "valid-destination" : ""}`}
      onClick={() => handleSquareClick(space)}
    >
      {space.piece && (
        <Piece 
          owner={space.piece.owner} 
          rank={space.piece.rank} 
        />
      )}
    </div>
    );
  })}
</div>
  </div>
  );
}

function Piece({ owner, rank }) {
  const isHidden = rank === "HIDDEN";
  
  const label = isHidden ? "" : rank.toString();

  return (
    <div className={`piece ${owner.toLowerCase()}`}>
      <div className="piece-icon-wrapper">
        <PieceIcon label={label} className="piece-icon" />
      </div>
    </div>
  );
}