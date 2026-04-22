import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import { PieceIcon, LAKES, BOARD_SIZE } from "./components/Pieces.jsx";
import { useGame } from "./hooks/useGame";
import coverImage from "./assets/cover.png";
import lobbyBg from "./assets/lobby.png";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import ProfileModal from "./components/ProfileModal";

const RANK_NAMES = {
  0: "Flag", 1: "Spy (1)", 2: "Scout (2)", 3: "Miner (3)", 4: "Sergeant (4)",
  5: "Lieutenant (5)", 6: "Captain (6)", 7: "Major (7)", 8: "Colonel (8)",
  9: "General (9)", 10: "Marshal (10)", 11: "Bomb"
};

const rankName = (rank) => RANK_NAMES[rank] ?? `Rank ${rank}`;
const rankLabel = (rank) => rank === 11 ? "11" : rank === 0 ? "0" : String(rank);

export default function App() {
  const [showCover, setShowCover] = useState(true);
  const { user, profile } = useAuth();
  const [lobbyInput, setLobbyInput] = useState("");
  const [activeLobby, setActiveLobby] = useState(
    () => sessionStorage.getItem("activeLobby") || null
  );
  const [playerColor, setPlayerColor] = useState(
    () => sessionStorage.getItem("playerColor") || "RED"
  );
  const [lobbyError, setLobbyError] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [battleLog, setBattleLog] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  // On page load, if there's a saved lobby, verify which color this user should be
  useEffect(() => {
    const savedLobby = sessionStorage.getItem("activeLobby");
    if (!savedLobby || !user) return;

    const verifyColor = async () => {
      try {
        const token = await user.getIdToken();
        const res = await axios.get(`http://localhost:5001/api/games/${savedLobby}/player-color`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.color) {
          sessionStorage.setItem("playerColor", res.data.color);
          setPlayerColor(res.data.color);
        }
        // Only set the lobby AFTER we know the correct color
        setActiveLobby(savedLobby);
      } catch (err) {
        console.log("Could not verify color, using saved value");
        setActiveLobby(savedLobby);
      }
    };

    // Clear activeLobby temporarily so useGame doesn't fire too early
    setActiveLobby(null);
    verifyColor();
}, [user]);

  const { board, turn, error, sendMove, selectPiece, availableMoves, selectedPiece, clearSelection, lastBattle, setLastBattle, gamePhase, availablePieces, setupComplete, showConfirmation, setupLayout, placePiece, moveSetupPiece, randomizeLayout, markSetupComplete, gameOver, winner, winReason } = useGame(activeLobby, playerColor, () => {
    sessionStorage.removeItem("activeLobby");
    sessionStorage.removeItem("playerColor");
    setActiveLobby(null);
    setLobbyError(`Color ${playerColor} is already taken in this lobby.`);
  });

  const [messages, setMessages] = useState([]);
  const [selectedRank, setSelectedRank] = useState(null);
  const [selectedSetupSlot, setSelectedSetupSlot] = useState(null);
  const attackerColorRef = useRef(null);



  const handleCreateGame = async () => {
    setIsCreating(true);
    setLobbyError(null);
    try {
      const response = await axios.post('http://localhost:5001/api/games/create');
      const { lobbyCode } = response.data;
      sessionStorage.setItem("activeLobby", lobbyCode);
      sessionStorage.setItem("playerColor", "RED");
      setPlayerColor("RED");
      setActiveLobby(lobbyCode);
    } catch (err) {
      console.error("Failed to create game", err);
      setLobbyError("Failed to connect to server.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinLobby = async () => {
    setLobbyError(null);
    if (!lobbyInput.trim()) {
      setLobbyError("Please enter a lobby code");
      return;
    }

    try {
      const token = await user.getIdToken();
      const res = await axios.get(`http://localhost:5001/api/games/${lobbyInput}/player-color`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const color = res.data.color;
      if (!color) {
        // Player hasn't joined this lobby yet, default to BLUE
        sessionStorage.setItem("activeLobby", lobbyInput);
        sessionStorage.setItem("playerColor", "BLUE");
        setPlayerColor("BLUE");
      } else {
        // Player is rejoining as their original color
        sessionStorage.setItem("activeLobby", lobbyInput);
        sessionStorage.setItem("playerColor", color);
        setPlayerColor(color);
      }
      setActiveLobby(lobbyInput);
    } catch (err) {
      console.error("Failed to join lobby", err);
      setLobbyError("Lobby not found or failed to connect");
    }
  };

  const isWaitingForOpponent = activeLobby && gamePhase === "WAITING";
  useEffect(() => {
    if (error) {
      setMessages(prev => [{ id: Date.now(), text: error }, ...prev].slice(0, 20));
    }
  }, [error]);

  // Clear battle log when switching to a new lobby
  useEffect(() => {
    setBattleLog([]);
    setMessages([]);
  }, [activeLobby]);


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

if (showCover) {
  return (
    <div className="cover-screen" onClick={() => setShowCover(false)}>
      <img
        className="cover-image"
        src={coverImage}
        alt="Stratego — Battle for Glory"
        draggable={false}
      />
      <div className="cover-banner">
        <button
          className="cover-play-btn"
          onClick={(e) => { e.stopPropagation(); setShowCover(false); }}
        >
          ⚔ PLAY
        </button>
      </div>
    </div>
  );
}

if (!user) return <LoginPage />;

  // Always-visible profile button
  const profileCorner = (
    <>
      <button onClick={() => setShowProfile(true)} className="profile-btn profile-btn--fixed">
        <div className="profile-btn__avatar">
          {profile?.profilePicUrl ? (
            <img src={profile.profilePicUrl} alt="avatar" className="profile-btn__avatar-img" onError={e => { e.target.style.display = "none"; }} />
          ) : (
            (profile?.username || "?")[0].toUpperCase()
          )}
        </div>
        <span className="profile-btn__username">{profile?.username || "Profile"}</span>
      </button>
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );

if (!activeLobby) {
  return (
    <div className="lobby-screen" style={{ backgroundImage: `url(${lobbyBg})` }}>
      {profileCorner}

      <button className="rules-btn" onClick={() => setShowRules(true)}>
        📜 Rules
      </button>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      <div className="setup-controls">
        <div className="lobby-card">
          <div className="lobby-card__header">
            <div className="lobby-title">STRATEGO</div>
          </div>

          <div className="lobby-card__body">
            <div className="lobby-input-group">
              <div className="lobby-section-label">Join an existing game</div>
              <input
                value={lobbyInput}
                onChange={(e) => { setLobbyInput(e.target.value.toUpperCase()); setLobbyError(null); }}
                placeholder="Enter Lobby Code"
              />
            </div>

            <button className="join-btn" onClick={handleJoinLobby}>
              ⚔ Join Game
            </button>

            <div className="lobby-divider">or</div>

            <button
              className="join-btn primary"
              onClick={handleCreateGame}
              disabled={isCreating}
            >
              {isCreating ? "Assembling troops…" : "✦ Create New Lobby"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
        

  if (isWaitingForOpponent) {
  return (
    <div className="lobby-screen" style={{ backgroundImage: `url(${lobbyBg})` }}>
      {profileCorner}

      <button className="rules-btn" onClick={() => setShowRules(true)}>
        📜 Rules
      </button>
      <div className="setup-controls">
        <div className="lobby-card">
          <div className="lobby-card__body">
            <div className="waiting-container">
              <h1>Lobby Created!</h1>
              <p>Share this code with your opponent</p>
              <div className="lobby-code-display">{activeLobby}</div>
              <p className="waiting-subtext">Waiting for a second player to join</p>
              <button className="join-btn red" onClick={() => setActiveLobby(null)}>
                ✕ Cancel / Leave
              </button>
            </div>
          </div>
        </div>
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
  {profileCorner}
  {(gamePhase === "SETUP" || gamePhase === "PLAY") && (
    <>
      <button className="rules-btn" onClick={() => setShowRules(true)}>
        📜 Rules
      </button>
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </>
  )}
  {gamePhase === "SETUP" ? (
    <SetupSidebar
      availablePieces={availablePieces}
      selectedRank={selectedRank}
      setSelectedRank={setSelectedRank}
      setSelectedSetupSlot={setSelectedSetupSlot}
      setupComplete={setupComplete}
      showConfirmation={showConfirmation}
      randomizeLayout={randomizeLayout}
      markSetupComplete={markSetupComplete}
      playerColor={playerColor}
    />
  ) : (
    <BattleLog entries={battleLog} />
  )}

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
              : "The opponent has no available moves!"}
          </p>
            <button
              onClick={() => {
                sessionStorage.removeItem("activeLobby");
                sessionStorage.removeItem("playerColor");
                setActiveLobby(null);
              }}
              className="return-lobby-btn"
            >
              Return to Lobby
            </button>
        </div>
      </div>
    )}

    <div className="status-bar">
      <div className="status-info">
        <button
          className="lobby-back-btn"
          onClick={() => {
            sessionStorage.removeItem("activeLobby");
            sessionStorage.removeItem("playerColor");
            setActiveLobby(null);
          }}
        >
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
  </div>

  {gamePhase === "SETUP" ? (
    <SetupInfoSidebar playerColor={playerColor} selectedRank={selectedRank} selectedSetupSlot={selectedSetupSlot} setupComplete={setupComplete} />
  ) : (
    <CapturedLog pieces={capturedPieces} playerColor={playerColor} />
  )}
  </div>
  );
}

const RANK_ORDER = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 11, 0];

function SetupSidebar({ availablePieces, selectedRank, setSelectedRank, setSelectedSetupSlot, setupComplete, showConfirmation, randomizeLayout, markSetupComplete, playerColor }) {
  const totalLeft = Object.values(availablePieces).reduce((a, b) => a + b, 0);
  const allPlaced = totalLeft === 0;

  return (
    <div className="setup-sidebar">
      <div className="setup-sidebar__header">
        <div className="setup-sidebar__crown">♛</div>
        <h2 className="setup-sidebar__title">Your Pieces</h2>
        <div className={`setup-sidebar__team-badge ${playerColor.toLowerCase()}`}>
          {playerColor === "RED" ? "Red Army" : "Blue Army"}
        </div>
      </div>

      <div className="setup-sidebar__counter">
        <span className="setup-counter__num">{totalLeft}</span>
        <span className="setup-counter__label">pieces remaining</span>
        <div className="setup-counter__track">
          <div
            className="setup-counter__fill"
            style={{ width: `${100 - (totalLeft / 40) * 100}%` }}
          />
        </div>
      </div>

      <div className="setup-pieces-grid">
        {RANK_ORDER.map((r) => {
          const count = availablePieces[r] ?? 0;
          const isSelected = selectedRank === r;
          const depleted = count === 0;
          return (
            <button
              key={r}
              className={`setup-piece-card ${isSelected ? "selected" : ""} ${depleted ? "depleted" : ""} ${playerColor.toLowerCase()}`}
              onClick={() => {
                setSelectedRank(isSelected ? null : r);
                setSelectedSetupSlot(null);
              }}
              disabled={depleted}
              title={rankName(r)}
            >
              <div className="setup-piece-card__token">
                <div className={`piece ${playerColor.toLowerCase()}`}>
                  <PieceIcon label={String(r)} />
                </div>
              </div>
              <div className="setup-piece-card__info">
                <span className="setup-piece-card__name">{rankName(r)}</span>
                <span className="setup-piece-card__count">×{count}</span>
              </div>
              {isSelected && <div className="setup-piece-card__glow" />}
            </button>
          );
        })}
      </div>

      <div className="setup-sidebar__actions">
        {!setupComplete && (
          <button
            className="setup-action-btn setup-action-btn--random"
            onClick={() => {
              randomizeLayout();
              setSelectedRank(null);
              setSelectedSetupSlot(null);
            }}
          >
            <span className="setup-action-btn__icon">⚄</span>
            Randomize
          </button>
        )}
        {showConfirmation && !setupComplete && (
          <button className="setup-action-btn setup-action-btn--confirm" onClick={markSetupComplete}>
            <span className="setup-action-btn__icon">✓</span>
            Confirm Setup
          </button>
        )}
      </div>

      
    </div>
  );
}

function SetupInfoSidebar({ playerColor, selectedRank, selectedSetupSlot, setupComplete }) {
  const hints = setupComplete ? [] : [
    "Select a piece from the left, then click your zone.",
    "Click an empty tile in your zone to place.",
    "Click another tile to move or swap.",
  ];

  const PIECE_TIPS = {
    10: "Marshal — highest ranking piece, only beaten by the Spy.",
    9:  "General — second highest ranking piece.",
    8:  "Colonel — solid frontline attacker.",
    7:  "Major — versatile mid-rank fighter.",
    6:  "Captain — reliable attacker.",
    5:  "Lieutenant — light infantry.",
    4:  "Sergeant — cannon fodder.",
    3:  "Miner — the only unit that can defuse Bombs.",
    2:  "Scout — can move any number of empty spaces horizontally or vertically",
    1:  "Spy — the only unit that can defeat the Marshal when the spy attacks.",
    11: "Bomb — immovable and kills any attacker except the Miner.",
    0:  "Flag — protect at all costs! If captured, you lose.",
  };

  return (
    <div className="setup-info-sidebar">
      <div className="setup-info-sidebar__header">
        <span className="setup-info-sidebar__icon"></span>
        <h3>Field Manual</h3>
      </div>

      {hints.map((h, i) => (
        <div key={i} className="setup-hint">
          <div className="setup-hint__arrow">▶</div>
          <span>{h}</span>
        </div>
      ))}

      <div className="setup-tips">
        {RANK_ORDER.map((r) => (
          <div
            key={r}
            className={`setup-tip-row ${selectedRank === r ? "highlighted" : ""} ${r === 0 || r === 11 ? "special" : ""}`}
          >
            <div className={`setup-tip-badge ${playerColor.toLowerCase()}`}>
              <PieceIcon label={String(r)} />
            </div>
            <span className="setup-tip-text">{PIECE_TIPS[r]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RulesModal({ onClose }) {
  return (
    <div className="rules-overlay" onClick={onClose}>
      <div className="rules-modal" onClick={e => e.stopPropagation()}>
        <div className="rules-modal__header">
          <h2 className="rules-modal__title">📜 STRATEGO — Rules</h2>
          <button className="rules-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="rules-modal__body">

          <h3>Object of the Game</h3>
          <p>Capture your opponent's Flag.</p>

          <h3>To Start the Game</h3>
          <ol>
            <li>Place the board between players so STRATEGO faces each contestant.</li>
            <li>One player takes Red pieces, the other Blue. Red starts first.</li>
            <li>Each player gets an army of 40 pieces: 1 Marshal, 1 General, 2 Colonels, 3 Majors, 4 Captains, 4 Lieutenants, 4 Sergeants, 5 Miners, 8 Scouts, 1 Spy, 6 Bombs, and 1 Flag.</li>
            <li>Fill your half of the board — 10 per row, 4 rows deep. The two middle rows start empty.</li>
            <li>Pieces face you so the opponent cannot see their rank.</li>
          </ol>

          <h3>Piece Rankings (High → Low)</h3>
          <table className="rules-table">
            <thead><tr><th>Rank</th><th>Piece</th><th>Count</th></tr></thead>
            <tbody>
              {[
                [10,"Marshal",1],[9,"General",1],[8,"Colonel",2],[7,"Major",3],
                [6,"Captain",4],[5,"Lieutenant",4],[4,"Sergeant",4],[3,"Miner",5],
                [2,"Scout",8],["S","Spy",1],["B","Bomb",6],["F","Flag",1],
              ].map(([rank, name, count]) => (
                <tr key={rank}><td>{rank}</td><td>{name}</td><td>×{count}</td></tr>
              ))}
            </tbody>
          </table>

          <h3>Movement Rules</h3>
          <ol>
            <li>Turns alternate — Red first, then Blue.</li>
            <li>Pieces move one square at a time: forward, backward, or sideways — <strong>not diagonally</strong>.</li>
            <li>Two lakes in the center have no squares — pieces must move around them.</li>
            <li>Two pieces cannot occupy the same square.</li>
            <li>A piece cannot move through or jump over another piece.</li>
            <li>Only one piece may be moved per turn.</li>
            <li>The Flag and Bombs <strong>cannot be moved</strong> once placed.</li>
            <li>The <strong>Scout</strong> may move any number of open squares in a straight line, but may not move and strike in the same turn.</li>
            <li>Once a piece is moved and the hand removed, it cannot be moved back that turn.</li>
            <li>Pieces cannot be moved back and forth between the same 2 squares in 3 consecutive turns.</li>
            <li>A player <strong>must</strong> either move or strike on their turn.</li>
          </ol>

          <h3>Strike / Attack Rules</h3>
          <ol>
            <li>When opposing pieces occupy adjoining squares (not diagonal), either player may strike on their turn.</li>
            <li>A player may move <em>or</em> strike — not both in the same turn.</li>
            <li>The attacker declares their rank; the defender answers with theirs.</li>
            <li>The <strong>lower-ranked piece is removed</strong>. The winner moves into the empty square.</li>
            <li>Equal ranks: <strong>both pieces are removed</strong>.</li>
            <li>The <strong>Spy</strong> can only defeat the Marshal — and only if the Spy strikes first. If the Marshal strikes first, the Spy is removed.</li>
            <li>Any piece (except a Miner) that strikes a <strong>Bomb</strong> is lost. The Bomb stays. A Miner defuses a Bomb and moves into its square.</li>
            <li>Bombs and the Flag can never strike — they must be struck.</li>
          </ol>

          <h3>Ending the Game</h3>
          <p>The game ends when:</p>
          <ul>
            <li>A player captures the opponent's Flag, OR</li>
            <li>A player has no pieces that can move (all movable pieces are trapped or eliminated)</li>
          </ul>

          <h3>Strategy Tips</h3>
          <ul>
            <li>Surround your Flag with Bombs, but place some Bombs away from the Flag to mislead your opponent.</li>
            <li>Keep a few high-ranking pieces in your front lines — but don't lose them quickly.</li>
            <li>Scouts are great for probing enemy positions early.</li>
            <li>Save your Miners for the end game to defuse hidden Bombs near the Flag.</li>
          </ul>
        </div>
      </div>
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
        {entries.map((e) => <BattleEntry key={e.id} entry={e} />)}
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