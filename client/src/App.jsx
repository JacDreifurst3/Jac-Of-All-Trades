import { useState, useEffect } from "react";
import "./App.css";
import { PieceIcon } from "./components/Pieces.jsx";
import { useGame } from "./hooks/useGame";

const RANK_NAMES = {
  0: "Flag", 1: "Spy (1)", 2: "Scout (2)", 3: "Miner (3)", 4: "Sergeant (4)",
  5: "Lieutenant (5)", 6: "Captain (6)", 7: "Major (7)", 8: "Colonel (8)",
  9: "General (9)", 10: "Marshal (10)", 11: "Bomb"
};

const rankName = (rank) => RANK_NAMES[rank] ?? `Rank ${rank}`;

export default function App() {
  const [lobbyInput, setLobbyInput] = useState("");
  const [activeLobby, setActiveLobby] = useState(null);
  const [playerColor, setPlayerColor] = useState("RED");
  // new state to hold lobby-level errors (e.g. color already taken)
  const [lobbyError, setLobbyError] = useState(null);


  // pass a callback as third argument that resets to lobby screen on join error
  const { board, turn, error, sendMove, selectPiece, availableMoves, selectedPiece, clearSelection } = useGame(activeLobby, playerColor, () => {
    setActiveLobby(false);
    setLobbyError(`Color ${playerColor} is already taken in this lobby.`);
  });


  const [selectedSpace, setSelectedSpace] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (error) {
      setMessages(prev => [{ id: Date.now(), text: error }, ...prev].slice(0, 20));
    }
  }, [error]);

  // Handle incoming battle results from server
  useEffect(() => {
    if (!lastBattle) return;
    const { result, attackerRank, defenderRank } = lastBattle;
    const atkName = rankName(attackerRank);
    const defName = rankName(defenderRank);

    let msg;
    if (result === "ATTACKER_WINS") msg = ` You won: ${atkName} defeated ${defName}`;
    else if (result === "DEFENDER_WINS") msg = ` You lost: ${defName} defeated ${atkName}`;
    else if (result === "BOTH_DIE") msg = ` Draw: ${atkName} and ${defName} both eliminated`;
    else if (result === "FLAG_CAPTURED") msg = ` ${atkName} captured the Flag!`;

    if (msg) setMessages(prev => [{ id: Date.now(), text: msg }, ...prev].slice(0, 20));
  }, [lastBattle]);

  const displayBoard = playerColor === "BLUE" ? [...board].reverse() : board;

  if (!activeLobby) {

  return (
    <div className="lobby-screen">
      <h1>Stratego</h1>
      {/* CHANGE: show lobby error message if color was already taken */}
      {lobbyError && <div className="error-toast">{lobbyError}</div>}
      <div className="setup-controls">
        <input 
          value={lobbyInput} 
          onChange={(e) => { setLobbyInput(e.target.value.toUpperCase()); 
            setLobbyError(null); // clear lobby error when user starts typing a new code
          }}
          placeholder="Enter Lobby Code"
        />
        
        {/* Team Selection Buttons */}
        <div className="team-selector">
          <button 
            className={`reg-btn red ${playerColor === "RED" ? "active" : ""}`}
            onClick={() => {
                setPlayerColor("RED");
                // clear error when switching colors
                setLobbyError(null);
              }}
          >Red Team</button>
          <button 
            className={`reg-btn blue ${playerColor === "BLUE" ? "active" : ""}`}
            onClick={() => {
                setPlayerColor("BLUE");
                // clear error when switching colors
                setLobbyError(null);
              }}
          >Blue Team</button>
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
      <div className="status-bar">
        <div className="status-info">
          <span>Lobby Code: <strong>{activeLobby}</strong></span>
          <span>Turn: <strong className={turn.toLowerCase()}>{turn}</strong></span>
        </div>
        <div className="status-messages">
          {messages.length === 0
            ? <span className="status-msg-empty">No messages</span>
            : messages.map((m, i) => (
                <span key={m.id} className={`status-msg ${i === 0 ? "status-msg-latest" : ""}`}>
                  {m.text}
                </span>
              ))
          }
        </div>
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
              <Piece owner={space.piece.owner} rank={space.piece.rank} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}