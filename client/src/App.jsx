import { useState, useEffect, useRef } from "react";
import "./App.css";
import { PieceIcon, LAKES, BOARD_SIZE } from "./components/Pieces.jsx";
import { useGame } from "./hooks/useGame";

const RANK_NAMES = {
  0: "Flag", 1: "Spy (1)", 2: "Scout (2)", 3: "Miner (3)", 4: "Sergeant (4)",
  5: "Lieutenant (5)", 6: "Captain (6)", 7: "Major (7)", 8: "Colonel (8)",
  9: "General (9)", 10: "Marshal (10)", 11: "Bomb"
};

const rankName = (rank) => RANK_NAMES[rank] ?? `Rank ${rank}`;
const rankLabel = (rank) => rank === 11 ? "11" : rank === 0 ? "0" : String(rank);

export default function App() {
  const [lobbyInput, setLobbyInput] = useState("");
  const [activeLobby, setActiveLobby] = useState(null);
  const [playerColor, setPlayerColor] = useState("RED");
  const [lobbyError, setLobbyError] = useState(null);
  const [battleLog, setBattleLog] = useState([]);

  const { board, turn, error, sendMove, selectPiece, availableMoves, selectedPiece, clearSelection, lastBattle, setLastBattle, gamePhase, availablePieces, setupComplete, showConfirmation, setupLayout, placePiece, moveSetupPiece, randomizeLayout, markSetupComplete, gameOver, winner, winReason } = useGame(activeLobby, playerColor, () => {
    setActiveLobby(false);
    setLobbyError(`Color ${playerColor} is already taken in this lobby.`);
  });

  const [messages, setMessages] = useState([]);
  const [selectedRank, setSelectedRank] = useState(null);
  const [selectedSetupSlot, setSelectedSetupSlot] = useState(null);
  const attackerColorRef = useRef(null);

  useEffect(() => {
    if (error) {
      setMessages(prev => [{ id: Date.now(), text: error }, ...prev].slice(0, 20));
    }
  }, [error]);


 useEffect(() => {
  if (!lastBattle) return;

  const { result, attackerRank, defenderRank, attackerColor, defenderColor } = lastBattle;
  
  const atkColor = attackerColor || (turn === "RED" ? "BLUE" : "RED"); 
  const defColor = defenderColor || (atkColor === "RED" ? "BLUE" : "RED");

  const atkName = rankName(attackerRank);
  const defName = rankName(defenderRank);

  let msg = "";
  if (result === "ATTACKER_WINS") msg = `${atkName} defeated ${defName}`;
  else if (result === "DEFENDER_WINS") msg = `${defName} defeated ${atkName}`;
  else if (result === "BOTH_DIE") msg = `${atkName} and ${defName} both eliminated`;
  else if (result === "FLAG_CAPTURED") msg = `${atkName} captured the Flag!`;

  if (msg) setMessages([{ id: Date.now(), text: msg }]);

  const newEntry = {
    id: Date.now(),
    result,
    attackerRank,
    defenderRank,
    atkLabel: rankLabel(attackerRank),
    defLabel: rankLabel(defenderRank),
    atkName,
    defName,
    atkColor,
    defColor,
  };

  setBattleLog(prev => [newEntry, ...prev]);
  setLastBattle(null);
}, [lastBattle, turn]);

  const capturedPieces = battleLog.flatMap((e) => {
    const pieces = [];
    const atkDead = e.result === "DEFENDER_WINS" || e.result === "BOTH_DIE";
    const defDead = e.result === "ATTACKER_WINS" || e.result === "BOTH_DIE" || e.result === "FLAG_CAPTURED";
    if (atkDead) pieces.push({ id: e.id + "-a", label: e.atkLabel, name: e.atkName, color: e.atkColor });
    if (defDead) pieces.push({ id: e.id + "-d", label: e.defLabel, name: e.defName, color: e.defColor });
    return pieces;
  });

  const boardWithSetup = board.map((space) => ({ ...space }));
  if (gamePhase === "SETUP" && setupLayout.length > 0) {
    boardWithSetup.forEach((space) => {
      if (space.piece) return;

      let layoutRow = null;
      if (playerColor === "RED" && space.x >= 6) {
        layoutRow = space.x - 6;
      } else if (playerColor === "BLUE" && space.x <= 3) {
        layoutRow = 3 - space.x;
      }

      if (layoutRow === null) return;
      const rank = setupLayout[layoutRow]?.[space.y];
      if (rank !== null && rank !== undefined) {
        space.piece = { owner: playerColor, rank };
      }
    });
  }

  const toLayoutCoords = (space) => {
    if (playerColor === "RED") return { x: space.x - 6, y: space.y };
    return { x: 3 - space.x, y: space.y };
  };

  const displayBoard = playerColor === "BLUE" ? [...boardWithSetup].reverse() : boardWithSetup;

  if (!activeLobby) {
    return (
      <div className="lobby-screen">
        <h1>Stratego</h1>
        {lobbyError && <div className="error-toast">{lobbyError}</div>}
        <div className="setup-controls">
          <input
            value={lobbyInput}
            onChange={(e) => { setLobbyInput(e.target.value.toUpperCase()); setLobbyError(null); }}
            placeholder="Enter Lobby Code"
          />
          <div className="team-selector">
            <button
              className={`reg-btn red ${playerColor === "RED" ? "active" : ""}`}
              onClick={() => { setPlayerColor("RED"); setLobbyError(null); }}
            >Red Team</button>
            <button
              className={`reg-btn blue ${playerColor === "BLUE" ? "active" : ""}`}
              onClick={() => { setPlayerColor("BLUE"); setLobbyError(null); }}
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
    if (gameOver) return;
    if (gamePhase === "SETUP") {
      const inSetupZone = playerColor === "RED" ? space.x >= 6 : space.x <= 3;
      if (!inSetupZone) return;

      if (selectedRank !== null) {
        if (!space.piece) {
          const layoutCoords = toLayoutCoords(space);
          placePiece(layoutCoords.x, layoutCoords.y, selectedRank);
          setSelectedRank(null);
        }
        return;
      }

      if (!selectedSetupSlot) {
        if (space.piece && space.piece.owner === playerColor) {
          setSelectedSetupSlot({ x: space.x, y: space.y });
        }
        return;
      }

      if (selectedSetupSlot.x === space.x && selectedSetupSlot.y === space.y) {
        setSelectedSetupSlot(null);
        return;
      }

      const sourceLayout = toLayoutCoords(selectedSetupSlot);
      const targetLayout = toLayoutCoords(space);
      moveSetupPiece(sourceLayout.x, sourceLayout.y, targetLayout.x, targetLayout.y);
      setSelectedSetupSlot(null);
      return;
    }

    if (turn !== playerColor) return;
    const hasOwnPiece = space.piece && space.piece.owner === playerColor;
    const isEmpty = !space.piece;

    if (!selectedPiece) {
      if (hasOwnPiece) selectPiece(space.x, space.y);
    } else {
      const isValidMove = availableMoves.some(move => move.x === space.x && move.y === space.y);
      if (isValidMove) {
        setMessages([]);
        attackerColorRef.current = turn;
        sendMove(selectedPiece.x, selectedPiece.y, space.x, space.y);
        clearSelection();
      } else if (isEmpty) {
        clearSelection();
      } else if (hasOwnPiece) {
        selectPiece(space.x, space.y);
      }
    }
  };

  return (
<div className="game-layout">
  <BattleLog entries={battleLog} />

  <div className="board-wrapper">
    {error && <div className="error-toast">{error}</div>}

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
              : "The opponent has no pieces left!"}
          </p>
        </div>
      </div>
    )}

    <div className="status-bar">
      <div className="status-info">
        <span style={{ textAlign: "center" }}>
          Lobby: <strong>{activeLobby}</strong>
        </span>
        <span style={{ textAlign: "center" }}>
          Phase: <strong>{gamePhase}</strong>
        </span>
        {gamePhase === "PLAY" && (
          <span style={{ textAlign: "center" }}>
            Turn: <strong className={turn.toLowerCase()}>{turn}</strong>
          </span>
        )}
      </div>

      <div className="status-messages" style={{ alignItems: "center" }}>
        {messages.length === 0 ? (
          <span className="status-msg-empty"></span>
        ) : (
          messages.map((m, i) => (
            <span
              key={m.id}
              className={`status-msg ${i === 0 ? "status-msg-latest" : ""}`}
            >
              {m.text}
            </span>
          ))
        )}
      </div>
    </div>

    <div className="board-bg">
      {displayBoard.map((space) => {
        const isValidDestination =
          selectedPiece &&
          availableMoves.some((move) => move.x === space.x && move.y === space.y);

        const isSelected =
          selectedPiece?.x === space.x && selectedPiece?.y === space.y;

        const isSetupSelected =
          selectedSetupSlot?.x === space.x && selectedSetupSlot?.y === space.y;

        return (
          <div
            key={`${space.x},${space.y}`}
            className={`tile ${
              space.terrain === "WATER" ? "lake" : "grass"
            } ${isSelected || isSetupSelected ? "selected" : ""} ${
              isValidDestination ? "valid-destination" : ""
            }`}
            onClick={() => handleSquareClick(space)}
          >
            {space.piece && (
              <Piece owner={space.piece.owner} rank={space.piece.rank} />
            )}
          </div>
        );
      })}
    </div>

    {gamePhase === "SETUP" && (
      <div className="setup-panel">
        <h3>Setup Phase - Place Your Pieces</h3>

        <div className="available-pieces">
          {Object.entries(availablePieces).map(([rank, count]) => {
            const parsedRank = parseInt(rank, 10);

            return (
              <button
                key={rank}
                className={`piece-btn ${selectedRank === parsedRank ? "selected" : ""}`}
                onClick={() => {
                  setSelectedRank(selectedRank == rank ? null : parsedRank);
                  setSelectedSetupSlot(null);
                }}
                disabled={count === 0}
              >
                <div className="piece-preview">
                  <div className={`piece ${playerColor.toLowerCase()}`}>
                    <PieceIcon label={rank} />
                  </div>
                </div>
                <span>
                  {rankName(parsedRank)} ({count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="setup-actions">
          {!setupComplete && (
            <button
              className="action-btn"
              onClick={() => {
                randomizeLayout();
                setSelectedRank(null);
                setSelectedSetupSlot(null);
              }}
            >
              Randomize Layout
            </button>
          )}

          {showConfirmation && !setupComplete && (
            <button className="action-btn confirm" onClick={markSetupComplete}>
              Confirm Setup
            </button>
          )}
        </div>

        {!setupComplete && (
          <p className="setup-instruction">
            {selectedRank !== null
              ? "Click an empty setup tile to place the selected piece."
              : selectedSetupSlot
              ? "Click another setup tile to move or swap."
              : "Select a piece to place or swap."}
          </p>
        )}

        {setupComplete && <p>Your setup is complete. Waiting for opponent...</p>}
      </div>
    )}
  </div>

  <CapturedLog pieces={capturedPieces} playerColor={playerColor} />
  </div>
  );
}

function Piece({ owner, rank }) {
  const label = rank === "HIDDEN" ? "" : rank.toString();
  return (
    <div className={`piece ${owner.toLowerCase()}`}>
      <div className="piece-icon-wrapper">
        <PieceIcon label={label} className="piece-icon" />
      </div>
    </div>
  );
}

function BattleLog({ entries }) {
  const listRef = useRef(null);
  return (
    <div className="battle-log battle-log--sidebar">
      <div className="battle-log__header">
        ⚔ Battle Log
        {entries.length > 0 && <span className="battle-log__count">{entries.length}</span>}
      </div>
      <div className="battle-log__scroll" ref={listRef}>
        {entries.length === 0
          ? <p className="battle-log__empty">No battles yet…</p>
          : entries.map((e) => <BattleEntry key={e.id} entry={e} />)
        }
      </div>
    </div>
  );
}

function CapturedLog({ pieces, playerColor }) {
  const redPieces = pieces.filter(p => p.color === "RED");
  const bluePieces = pieces.filter(p => p.color === "BLUE");

  const [topList, topName, topClass] = playerColor === "RED" 
    ? [redPieces, "Your Lost Pieces", "red"] 
    : [bluePieces, "Your Lost Pieces", "blue"];
    
  const [bottomList, bottomName, bottomClass] = playerColor === "RED"
    ? [bluePieces, "Captured Blue", "blue"]
    : [redPieces, "Captured Red", "red"];
  const renderPiece = (p) => (
    <div key={p.id} className="captured-entry">
      <div className={`battle-piece__token piece ${p.color.toLowerCase()} battle-piece--dead`}>
        <div className="piece-icon-wrapper">
          <PieceIcon label={p.label} className="piece-icon" />
        </div>
      </div>
      <span className="captured-entry__name">{p.name}</span>
    </div>
  );

  return (
    <div className="battle-log battle-log--sidebar">
      <div className="battle-log__header">Pieces Captured</div>
      <div className="battle-log__scroll--split">
        <div className="captured-section">
          <div className={`captured-section__label ${topClass}`}>{topName}</div>
          {topList.map(renderPiece)}
        </div>
        <div className="captured-section__divider" />
        <div className="captured-section">
          <div className={`captured-section__label ${bottomClass}`}>{bottomName}</div>
          {bottomList.map(renderPiece)}
        </div>
      </div>
    </div>
  );
}

function BattleEntry({ entry }) {
  const { result, atkLabel, defLabel, atkName, defName, atkColor, defColor } = entry;
  const atkDead = result === "DEFENDER_WINS" || result === "BOTH_DIE";
  const defDead = result === "ATTACKER_WINS" || result === "BOTH_DIE" || result === "FLAG_CAPTURED";
  const atkColorLow = (atkColor ?? "RED").toLowerCase();
  const defColorLow = (defColor ?? "BLUE").toLowerCase();
  const atkLabel2 = (atkColor ?? "RED").charAt(0) + (atkColor ?? "RED").slice(1).toLowerCase();
  const defLabel2 = (defColor ?? "BLUE").charAt(0) + (defColor ?? "BLUE").slice(1).toLowerCase();

  return (
    <div className={`battle-entry battle-entry--${result.toLowerCase()}`}>
      <div className={`battle-piece battle-piece--atk ${atkDead ? "battle-piece--dead" : "battle-piece--alive"}`}>
        <div className={`battle-piece__token piece ${atkColorLow}`}>
          <div className="piece-icon-wrapper">
            <PieceIcon label={atkLabel} className="piece-icon" />
          </div>
        </div>
        <span className="battle-piece__name">{atkName}</span>
      </div>
      <div className="battle-vs">
        <span className="battle-vs__label">
          {result === "BOTH_DIE" ? "✕✕" : result === "ATTACKER_WINS" || result === "FLAG_CAPTURED" ? "▶" : "◀"}
        </span>
      </div>
      <div className={`battle-piece battle-piece--def ${defDead ? "battle-piece--dead" : "battle-piece--alive"}`}>
        <div className={`battle-piece__token piece ${defColorLow}`}>
          <div className="piece-icon-wrapper">
            <PieceIcon label={defLabel} className="piece-icon" />
          </div>
        </div>
        <span className="battle-piece__name">{defName}</span>
      </div>
      <div className="battle-outcome">
        {result === "ATTACKER_WINS" && <span className={`battle-tag battle-tag--${atkColorLow}`}>{atkLabel2} Defeats</span>}
        {result === "DEFENDER_WINS" && <span className={`battle-tag battle-tag--${defColorLow}`}>{defLabel2} Defeats</span>}
        {result === "BOTH_DIE"      && <span className="battle-tag battle-tag--draw">Both Eliminated</span>}
        {result === "FLAG_CAPTURED" && <span className="battle-tag battle-tag--flag"> Flag Captured!</span>}
      </div>
    </div>
  );
}