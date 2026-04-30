import React from "react";
import RulesModal from "../components/RulesModal";
import ProfileModal from "../components/ProfileModal";
import lobbyBg from "../assets/lobby.png";

export default function LobbyPage({
  user,
  profile,
  setShowProfile,
  showProfile,
  showRules,
  setShowRules,
  lobbyInput,
  setLobbyInput,
  setLobbyError,
  handleJoinLobby,
  handleCreateGame,
  isCreating,
  activeLobby,
  gamePhase,
  setActiveLobby,
  beginnerMode,
  setBeginnerMode,
  handleCreateHotseat
}) {
  const isWaitingForOpponent = activeLobby && gamePhase === "WAITING";

  const profileCorner = (
    <>
      <button onClick={() => setShowProfile(true)} className="profile-btn profile-btn--fixed">
        <div className="profile-btn__avatar">
          {profile?.profilePicUrl ? (
            <img 
              src={profile.profilePicUrl} 
              alt="avatar" 
              className="profile-btn__avatar-img" 
              onError={e => { e.target.style.display = "none"; }} 
            />
          ) : (
            (profile?.username || "?")[0].toUpperCase()
          )}
        </div>
        <span className="profile-btn__username">{profile?.username || "Profile"}</span>
      </button>
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );

  return (
    <div className="lobby-screen" style={{ backgroundImage: `url(${lobbyBg})` }}>
      {profileCorner}

      <button className="rules-btn" onClick={() => setShowRules(true)}>
        📜 Rules
      </button>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      <div className="setup-controls">
        <div className="lobby-card">
          {!isWaitingForOpponent ? (
            <>
              <div className="lobby-card__header">
                <div className="lobby-title">STRATEGO</div>
              </div>

              <div className="lobby-card__body">
                <div className="lobby-input-group">
                  <div className="lobby-section-label">Join an existing game</div>
                  <input
                    value={lobbyInput}
                    onChange={(e) => { 
                      setLobbyInput(e.target.value.toUpperCase()); 
                      setLobbyError(null); 
                    }}
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

                <div className="beginner-mode-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={beginnerMode}
                      onChange={(e) => setBeginnerMode(e.target.checked)}
                    />
                    <span className="toggle-switch"></span>
                    <span className="toggle-text">
                      {beginnerMode ? "Beginner Mode" : "Competitive Mode"}
                    </span>
                  </label>
                  <p className="toggle-hint">
                    {beginnerMode 
                      ? "Revealed pieces stay visible, battle log shows full history" 
                      : "Revealed pieces hide after each turn, old battle log entries are hidden"}
                  </p>
                </div>
                
                <button
                  className="join-btn hotseat"
                  onClick={handleCreateHotseat}
                  disabled={isCreating}
                >
                  Hotseat (Same Device)
                </button>
              </div>
            </>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}