import { useState } from "react";
import "./App.css";
import { PieceIcon, LAKES, BOARD_SIZE } from "./components/Pieces.jsx";
import { useGame } from "./hooks/useGame"; 

export default function App() {
  const [lobbyInput, setLobbyInput] = useState("");
  const [activeLobby, setActiveLobby] = useState(null);
  const [playerColor, setPlayerColor] = useState("RED");

  const { board, turn, error, sendMove } = useGame(activeLobby, playerColor);
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
    if (!selectedSpace) {
      // Pick up a piece
      if (space.piece && space.piece.owner === playerColor) {
        setSelectedSpace(space);
      }
    } else {
      // Execute move via Socket
      sendMove(selectedSpace.x, selectedSpace.y, space.x, space.y);
      setSelectedSpace(null);
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
  {displayBoard.map((space) => (
    <div 
      key={`${space.x},${space.y}`} 
      className={`tile ${space.terrain === "WATER" ? "lake" : "grass"} ${
        selectedSpace?.x === space.x && selectedSpace?.y === space.y ? "selected" : ""
      }`}
      onClick={() => handleSquareClick(space)}
    >
      {space.piece && (
        <Piece 
          owner={space.piece.owner} 
          rank={space.piece.rank} 
        />
      )}
    </div>
  ))}
</div>
  </div>
);

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
}