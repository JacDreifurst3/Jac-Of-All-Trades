// Main app file that controls login, lobby, setup, and the game board.
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
import RulesModal from "./components/RulesModal.jsx";
import { BattleLog, CapturedLog, Piece } from "./components/BattleLogs.jsx";
import { SetupSidebar, SetupInfoSidebar } from "./components/SetupPanels.jsx";
import LobbyPage from "./pages/LobbyPage.jsx";
import GameBoard from "./pages/GameBoard.jsx";
import { rankName, rankLabel, toLayoutCoords } from "./utils/GameInfo.jsx";





export default function App() {
  // Basic screen and user state for the app.
  const [showCover, setShowCover] = useState(true);
  const { user, profile, setProfile } = useAuth();
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
  const [isCreating, setIsCreating] = useState(false);
  const [isHotseat, setIsHotseat] = useState(
    () => sessionStorage.getItem("isHotseat") === "true"
  );
  const [handoffPending, setHandoffPending] = useState(false);
  const [handoffNextColor, setHandoffNextColor] = useState(null);
  const [beginnerMode, setBeginnerMode] = useState(true);
  // Checks if the player already had a saved lobby open.
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
        setActiveLobby(savedLobby);
      } catch (err) {
        console.log("Could not verify color, using saved value");
        setActiveLobby(savedLobby);
      }
    };

    setActiveLobby(null);
    verifyColor();
}, [user]);

// Creates a same-device game where players pass the screen back and forth.
const handleCreateHotseat = async () => {
  setIsCreating(true);
  setLobbyError(null);
  try {
    const response = await axios.post('http://localhost:5001/api/games/create', { beginnerMode });
    const { lobbyCode } = response.data;
    sessionStorage.setItem("activeLobby", lobbyCode);
    sessionStorage.setItem("playerColor", "RED");
    sessionStorage.setItem("isHotseat", "true");
    setPlayerColor("RED");
    setIsHotseat(true);
    setActiveLobby(lobbyCode);
  } catch (err) {
    setLobbyError("Failed to connect to server.");
  } finally {
    setIsCreating(false);
  }
};

  // Pulls all the live game data and actions from the custom game hook.
  const { board, turn, error, sendMove, selectPiece, availableMoves, selectedPiece, clearSelection, lastBattle, setLastBattle, gamePhase, availablePieces, setupComplete, showConfirmation, setupLayout, placePiece, moveSetupPiece, randomizeLayout, markSetupComplete, gameOver, winner, winReason, battleLog, beginnerMode: serverBeginnerMode} = useGame(activeLobby, playerColor, () => {
    sessionStorage.removeItem("activeLobby");
    sessionStorage.removeItem("playerColor");
    setActiveLobby(null);
    setLobbyError(`Color ${playerColor} is already taken in this lobby.`);
  }, isHotseat);

  // Tracks small messages and setup selections for the player.
  const [messages, setMessages] = useState([]);
  const [selectedRank, setSelectedRank] = useState(null);
  const [selectedSetupSlot, setSelectedSetupSlot] = useState(null);

  useEffect(() => {
    setMessages([]);
  }, [activeLobby]);
  const attackerColorRef = useRef(null);



  // Creates a normal online lobby.
  const handleCreateGame = async () => {
    console.log("handleCreateGame called");
    setIsCreating(true);
    setLobbyError(null);
    setIsHotseat(false);
    sessionStorage.removeItem("isHotseat");
    try {
      const response = await axios.post('http://localhost:5001/api/games/create', { beginnerMode });
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

  // Joins a lobby using the code typed by the player.
  const handleJoinLobby = async () => {
    console.log("handleJoinLobby called");
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
        sessionStorage.setItem("activeLobby", lobbyInput);
        sessionStorage.setItem("playerColor", "BLUE");
        setPlayerColor("BLUE");
      } else {
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
  // Shows backend/game errors as short messages.
  useEffect(() => {
    if (error) {
      setMessages(prev => [{ id: Date.now(), text: error }, ...prev].slice(0, 20));
    }
  }, [error]);

  // Refreshes the user profile after the game ends so stats update.
  useEffect(() => {
      if (!gameOver || !user) return;
      // Wait 2 seconds for backend to finish saving stats before fetching
      const timer = setTimeout(async () => {
          try {
              const res = await fetch(`http://localhost:5001/api/users/${user.uid}`);
              if (res.ok) {
                  const updatedProfile = await res.json();
                  setProfile(updatedProfile);
              }
          } catch (err) {
              console.error("Failed to refresh profile:", err);
          }
      }, 2000);

      return () => clearTimeout(timer);
  }, [gameOver]);

  // In hotseat mode, hides the board before switching players.
  useEffect(() => {
    if (!isHotseat || gamePhase !== "PLAY" || handoffPending || gameOver) return;
    if (turn !== playerColor) {
      setHandoffNextColor(turn);
      setTimeout(() => setHandoffPending(true), 950);
    } 
  }, [turn, isHotseat, gamePhase]);

  

 // Stores the most recent battle so the board can animate it.
 const [battleEvent, setBattleEvent] = useState(null);

 // Starts dragging a piece if it belongs to the current player.
 const handleDragStart = (e, space) => {
  if (!space.piece || space.piece.owner !== playerColor) {
    e.preventDefault();
    return;
  }  
  e.dataTransfer.setData("sourceX", space.x);
  e.dataTransfer.setData("sourceY", space.y);

  setTimeout(() => (e.target.style.visibility = "hidden"), 0);
  
  if (gamePhase === "PLAY" && turn === playerColor) {
    selectPiece(space.x, space.y);
  }
};

// Handles dropping a piece during setup or gameplay.
const handleDrop = (e, targetSpace) => {
  e.preventDefault();
  const sourceX = parseInt(e.dataTransfer.getData("sourceX"));
  const sourceY = parseInt(e.dataTransfer.getData("sourceY"));

  
  if (gamePhase === "SETUP" && !setupComplete) {
    const inSetupZone = playerColor === "RED" ? targetSpace.x >= 6 : targetSpace.x <= 3;
    
    if (inSetupZone) {
      const sourceLayout = toLayoutCoords({ x: sourceX, y: sourceY }, playerColor);
      const targetLayout = toLayoutCoords(targetSpace, playerColor);
      moveSetupPiece(sourceLayout.x, sourceLayout.y, targetLayout.x, targetLayout.y);
    }
  } 
  
  else if (gamePhase === "PLAY" && turn === playerColor) {
    const isValidMove = availableMoves.some(
      move => move.x === targetSpace.x && move.y === targetSpace.y
    );
    if (isValidMove) {
      sendMove(sourceX, sourceY, targetSpace.x, targetSpace.y);
    }
    clearSelection();
  }
  document.querySelectorAll('.piece-draggable-wrapper').forEach(el => el.style.visibility = 'visible');
};

 // Builds a readable battle message after two pieces fight.
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

  // Pass battle event (with coordinates) to GameBoard for explosion animation
  setBattleEvent({ ...lastBattle });

  // Delay clearing so GameBoard's useEffect can read it
  setTimeout(() => setLastBattle(null), 100);
}, [lastBattle, turn]);

  // Turns the battle log into a list of captured pieces for the sidebar.
  const capturedPieces = battleLog.flatMap((e) => {
    const pieces = [];
    const atkDead = e.result === "DEFENDER_WINS" || e.result === "BOTH_DIE";
    const defDead = e.result === "ATTACKER_WINS" || e.result === "BOTH_DIE" || 
                    e.result === "FLAG_CAPTURED" || e.result === "ATTACKER_DEFUSED_BOMB" || 
                    e.result === "ATTACKER_ASSASINATED_MARSHAL";
    
    if (atkDead) {
      pieces.push({ 
        id: e.timestamp + "-a", 
        label: rankLabel(e.attackerRank), 
        name: rankName(e.attackerRank), 
        color: e.attackerColor 
      });
    }
    if (defDead) {
      pieces.push({ 
        id: e.timestamp + "-d", 
        label: rankLabel(e.defenderRank), 
        name: rankName(e.defenderRank), 
        color: e.defenderColor 
      });
    }
    return pieces;
  });

  // Adds setup pieces onto a copy of the board before showing it.
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

      if (layoutRow !== null && setupLayout[layoutRow]) {
        const rank = setupLayout[layoutRow][space.y];
        if (rank !== null && rank !== undefined) {
        space.piece = { owner: playerColor, rank };
        }
      }
    });
  }

  // Flips the board for blue so their side is easier to see.
  const displayBoard = playerColor === "BLUE" ? [...boardWithSetup].reverse() : boardWithSetup;

// First screen the player sees before entering the app.
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

// If no one is logged in yet, show the login page.
if (!user) return <LoginPage />;

  // Profile button that stays in the corner.
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

  // Shows the lobby page until the game is ready.
  if (!activeLobby || isWaitingForOpponent) {
  return (
    <LobbyPage
      user={user}
      profile={profile}
      setShowProfile={setShowProfile}
      showProfile={showProfile}
      showRules={showRules}
      setShowRules={setShowRules}
      lobbyInput={lobbyInput}
      setLobbyInput={setLobbyInput}
      setLobbyError={setLobbyError}
      handleJoinLobby={handleJoinLobby}
      handleCreateGame={handleCreateGame}
      handleCreateHotseat={handleCreateHotseat}
      isCreating={isCreating}
      activeLobby={activeLobby}
      gamePhase={gamePhase}
      setActiveLobby={setActiveLobby}
      beginnerMode={beginnerMode}
      setBeginnerMode={setBeginnerMode}
    />
  );
}

  // Handles clicking tiles for setup, selecting pieces, and moving pieces.
  const handleSquareClick = (space) => {
    if (gameOver) return;
    if (gamePhase === "SETUP") {
      // Prevent moving pieces once setup is confirmed (even if waiting for opponent)
      if (setupComplete) return;

      const inSetupZone = playerColor === "RED" ? space.x >= 6 : space.x <= 3;
      if (!inSetupZone) return;

      if (selectedRank !== null) {
        if (!space.piece) {
          const layoutCoords = toLayoutCoords(space, playerColor);
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

      const sourceLayout = toLayoutCoords(selectedSetupSlot, playerColor);
      const targetLayout = toLayoutCoords(space, playerColor);
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

// Covers the board during hotseat handoff so players cannot peek.
if (handoffPending) {
  return (
    <div className="handoff-screen">
      <div className="handoff-modal">
        <div className="handoff-icon">🔒</div>
        <h2>Pass the Device</h2>
        <p>Hand the device to <strong className={handoffNextColor?.toLowerCase()}>{handoffNextColor}</strong></p>
        <button
          className="handoff-ready-btn"
          onClick={() => {
            const next = handoffNextColor;
            setHandoffNextColor(null);
            setBattleEvent(null);
            setPlayerColor(next);
            sessionStorage.setItem("playerColor", next);
            // Small delay so board re-renders with correct perspective before uncovering
            setTimeout(() => setHandoffPending(false), 50);
          }}
        >
          I'm Ready
        </button>
      </div>
    </div>
  );
}

  // Main game screen once the lobby is active.
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
  {/* Shows setup tools before the game starts, then battle log during play */}
  {gamePhase === "SETUP" ? (
    <SetupSidebar
      availablePieces={availablePieces}
      selectedRank={selectedRank}
      setSelectedRank={setSelectedRank}
      setSelectedSetupSlot={setSelectedSetupSlot}
      setupComplete={setupComplete}
      showConfirmation={showConfirmation}
      randomizeLayout={randomizeLayout}
      markSetupComplete={() => {
        markSetupComplete();
        if (isHotseat) {
          const next = playerColor === "RED" ? "BLUE" : "RED";
          setHandoffNextColor(next);
          setHandoffPending(true);
        }
      }}
      playerColor={playerColor}
    />
  ) : (
    <BattleLog entries={battleLog} beginnerMode={serverBeginnerMode} />
  )}

  {/* Main board component where pieces are displayed and moved */}
  <GameBoard
  activeLobby={activeLobby}
  gamePhase={gamePhase}
  turn={turn}
  playerColor={playerColor}
  error={error}
  messages={messages}
  gameOver={gameOver}
  winner={winner}
  winReason={winReason}
  displayBoard={displayBoard}
  selectedPiece={selectedPiece}
  availableMoves={availableMoves}
  selectedSetupSlot={selectedSetupSlot}
  selectedRank={selectedRank}
  setupComplete={setupComplete}
  handleSquareClick={handleSquareClick}
  lastBattle={battleEvent}
  onReturnToLobby={() => {
    sessionStorage.removeItem("activeLobby");
    sessionStorage.removeItem("playerColor");
    sessionStorage.removeItem("isHotseat");
    setActiveLobby(null);
    setIsHotseat(false);
  }}
  onDragStart={handleDragStart}
  onDrop={handleDrop}
/>

  {/* Right sidebar changes depending on setup or play mode */}
  {gamePhase === "SETUP" ? (
    <SetupInfoSidebar playerColor={playerColor} selectedRank={selectedRank} selectedSetupSlot={selectedSetupSlot} setupComplete={setupComplete} />
  ) : (
    <CapturedLog pieces={capturedPieces} playerColor={playerColor} />
  )}
  </div>
  );
}