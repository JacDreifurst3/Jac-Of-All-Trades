import { useState } from "react";
import { auth } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification, verifyBeforeUpdateEmail, deleteUser } from "firebase/auth";

export default function ProfileModal({ onClose }) {
  const { user, profile, setProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || "");
  const [profilePicUrl, setProfilePicUrl] = useState(profile?.profilePicUrl || "");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile"); // "profile" or "security"

  const showMessage = (msg, isError = false) => {
    if (isError) setError(msg);
    else setMessage(msg);
    setTimeout(() => { setMessage(null); setError(null); }, 3000);
  };

  // Re-authenticates the user before sensitive changes like password/email
  const reauthenticate = async () => {
    if (!currentPassword) {
      throw new Error("Please enter your current password to make security changes");
    }
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  // Saves username and profile pic to MongoDB
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:5001/api/users/${user.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ username, profilePicUrl })
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        showMessage("Profile updated!");
      } else {
        const data = await res.json();
        showMessage(data.message || "Failed to update profile", true);
      }
    } catch (err) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Updates email in Firebase — send verification email
  const handleUpdateEmail = async () => {
    if (!newEmail) {
        showMessage("Please enter a new email address", true);
        return;
    }
    setLoading(true);
    try {
        await reauthenticate();
        // Send verification to the NEW email address — Firebase confirms it before switching
        await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
        showMessage("Verification email sent to your new address! Click the link to confirm the change.");
        setNewEmail("");
        setCurrentPassword("");
    } catch (err) {
        if (err.code === "auth/requires-recent-login") {
            showMessage("Please enter your current password first", true);
        } else if (err.code === "auth/email-already-in-use") {
            showMessage("That email is already in use", true);
        } else if (err.code === "auth/invalid-email") {
            showMessage("Please enter a valid email address", true);
        } else {
            showMessage(err.message, true);
        }
    } finally {
        setLoading(false);
    }
};

  // Updates password in Firebase — requires recent login
  const handleUpdatePassword = async () => {
    setLoading(true);
    try {
      await reauthenticate();
      await updatePassword(auth.currentUser, newPassword);
      showMessage("Password updated!");
      setNewPassword("");
      setCurrentPassword("");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        showMessage("Please enter your current password first", true);
      } else if (err.code === "auth/weak-password") {
        showMessage("Password must be at least 6 characters", true);
      } else {
        showMessage(err.message, true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    onClose();
  };

  const tabStyle = (tab) => ({
    flex: 1,
    padding: "10px",
    background: activeTab === tab ? "rgba(245,221,129,0.12)" : "transparent",
    border: "none",
    borderBottom: activeTab === tab ? "2px solid #f5dd81" : "2px solid transparent",
    color: activeTab === tab ? "#f5dd81" : "#8b7040",
    fontFamily: "Rajdhani, sans-serif",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.2s",
  });

  const inputStyle = {
    padding: "10px 14px",
    background: "rgba(255,255,255,0.06)",
    border: "2px solid rgba(139,105,20,0.5)",
    borderRadius: "6px",
    color: "#e8d5a3",
    fontFamily: "Rajdhani, sans-serif",
    fontSize: "14px",
    fontWeight: "600",
    outline: "none",
    width: "100%",
  };

  const labelStyle = {
    color: "#8b7040",
    fontFamily: "Rajdhani, sans-serif",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "4px",
  };

  const saveButtonStyle = {
    padding: "10px",
    background: "rgba(245,221,129,0.15)",
    border: "2px solid #f5dd81",
    borderRadius: "6px",
    color: "#f5dd81",
    fontFamily: "Cinzel, serif",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "0.1em",
    cursor: loading ? "not-allowed" : "pointer",
    width: "100%",
    marginTop: "4px",
  };
    // Deletes account from both Firebase and MongoDB
    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
        
        setLoading(true);
        try {
            // Re-authenticate first since delete is a sensitive operation
            await reauthenticate();
            
            // Delete from MongoDB first
            const token = await user.getIdToken();
            await fetch(`http://localhost:5001/api/users/${user.uid}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            // Then delete from Firebase
            await deleteUser(auth.currentUser);
            // AuthContext will detect the logout and redirect to login page automatically

        } catch (err) {
            if (err.code === "auth/requires-recent-login") {
                showMessage("Please enter your current password first", true);
            } else {
                showMessage(err.message, true);
            }
            setLoading(false);
        }
    };

  return (
    // Dark overlay behind the modal
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      {/* Stop clicks inside modal from closing it */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, #3f0601 0%, #240800 100%)",
          border: "5px solid #8b6914",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "3px solid #8b6914",
        }}>
          <h2 style={{
            color: "#f5dd81",
            fontFamily: "Cinzel, serif",
            fontSize: "18px",
            letterSpacing: "0.1em",
          }}>
            Profile
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#8b7040",
              fontSize: "20px",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Avatar and stats */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "16px 20px",
          borderBottom: "2px solid rgba(139,105,20,0.4)",
        }}>
          {/* Avatar — shows profile pic if set, otherwise initial */}
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            border: "3px solid #8b6914",
            overflow: "hidden",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(139,105,20,0.2)",
            fontSize: "28px",
            color: "#f5dd81",
            fontFamily: "Cinzel, serif",
          }}>
            {profile?.profilePicUrl ? (
              <img
                src={profile.profilePicUrl}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => { e.target.style.display = "none"; }}
              />
            ) : (
              (profile?.username || user?.email || "?")[0].toUpperCase()
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              color: "#f5dd81",
              fontFamily: "Cinzel, serif",
              fontSize: "16px",
              fontWeight: "700",
              marginBottom: "4px",
            }}>
              {profile?.username || "Unknown"}
            </div>
            <div style={{
              color: "#8b7040",
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "12px",
              letterSpacing: "0.06em",
            }}>
              {user?.email}
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: "flex",
            gap: "12px",
            flexShrink: 0,
          }}>
            {[
              { label: "Wins", value: profile?.wins ?? 0, color: "#4caf50" },
              { label: "Losses", value: profile?.losses ?? 0, color: "#f44336" },
              { label: "Played", value: profile?.gamesPlayed ?? 0, color: "#f5dd81" },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{
                  color: stat.color,
                  fontFamily: "Cinzel, serif",
                  fontSize: "20px",
                  fontWeight: "700",
                  lineHeight: 1,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  color: "#8b7040",
                  fontFamily: "Rajdhani, sans-serif",
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid rgba(139,105,20,0.4)" }}>
        <button style={tabStyle("profile")} onClick={() => setActiveTab("profile")}>Profile</button>
        <button style={tabStyle("security")} onClick={() => setActiveTab("security")}>Security</button>
        <button style={tabStyle("stats")} onClick={() => setActiveTab("stats")}>Stats</button>
        </div>

        {/* Tab content */}
        <div style={{
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          overflowY: "auto",
        }}>
          {message && (
            <div style={{
              background: "rgba(76,175,80,0.2)",
              border: "1px solid rgba(76,175,80,0.5)",
              color: "#81c784",
              padding: "8px 14px",
              borderRadius: "4px",
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "13px",
              textAlign: "center",
            }}>
              {message}
            </div>
          )}
          {error && (
            <div style={{
              background: "rgba(160,30,30,0.95)",
              border: "1px solid rgba(255,100,100,0.4)",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: "4px",
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "13px",
              textAlign: "center",
            }}>
              {error}
            </div>
          )}

          {activeTab === "profile" && (
            <>
              <div>
                <div style={labelStyle}>Username</div>
                <input
                  style={inputStyle}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Username"
                />
              </div>
              <div>
                <div style={labelStyle}>Profile Picture URL</div>
                <input
                  style={inputStyle}
                  value={profilePicUrl}
                  onChange={e => setProfilePicUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                />
              </div>
              <button
                style={saveButtonStyle}
                onClick={handleSaveProfile}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </>
          )}

          {activeTab === "security" && (
            <>
              <div>
                <div style={labelStyle}>Current Password (required for changes)</div>
                <input
                  style={inputStyle}
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                />
              </div>
              <div>
                <div style={labelStyle}>New Email</div>
                <input
                  style={inputStyle}
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="New email address"
                />
              </div>
              <button
                style={saveButtonStyle}
                onClick={handleUpdateEmail}
                disabled={loading || !newEmail}
              >
                {loading ? "Updating..." : "Update Email"}
              </button>

              <div style={{ height: "1px", background: "rgba(139,105,20,0.4)" }} />

              <div>
                <div style={labelStyle}>New Password</div>
                <input
                  style={inputStyle}
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password"
                />
              </div>
              <button
                style={saveButtonStyle}
                onClick={handleUpdatePassword}
                disabled={loading || !newPassword}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </>
          )}
          {activeTab === "stats" && (
            <>
                <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px",
                marginBottom: "8px",
                }}>
                {[
                    { label: "Games Played", value: profile?.gamesPlayed ?? 0, color: "#f5dd81" },
                    { label: "Wins", value: profile?.wins ?? 0, color: "#4caf50" },
                    { label: "Losses", value: profile?.losses ?? 0, color: "#f44336" },
                ].map(stat => (
                    <div key={stat.label} style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(139,105,20,0.3)",
                    borderRadius: "8px",
                    padding: "16px 8px",
                    textAlign: "center",
                    }}>
                    <div style={{
                        color: stat.color,
                        fontFamily: "Cinzel, serif",
                        fontSize: "32px",
                        fontWeight: "700",
                        lineHeight: 1,
                        marginBottom: "6px",
                    }}>
                        {stat.value}
                    </div>
                    <div style={{
                        color: "#8b7040",
                        fontFamily: "Rajdhani, sans-serif",
                        fontSize: "11px",
                        fontWeight: "700",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                    }}>
                        {stat.label}
                    </div>
                    </div>
                ))}
                </div>

                {/* Win rate bar */}
                <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(139,105,20,0.3)",
                borderRadius: "8px",
                padding: "14px 16px",
                }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                }}>
                    <span style={{
                    color: "#8b7040",
                    fontFamily: "Rajdhani, sans-serif",
                    fontSize: "12px",
                    fontWeight: "700",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    }}>Win Rate</span>
                    <span style={{
                    color: "#f5dd81",
                    fontFamily: "Cinzel, serif",
                    fontSize: "14px",
                    fontWeight: "700",
                    }}>
                    {profile?.gamesPlayed > 0
                        ? Math.round((profile.wins / profile.gamesPlayed) * 100)
                        : 0}%
                    </span>
                </div>
                <div style={{
                    height: "8px",
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "4px",
                    overflow: "hidden",
                }}>
                    <div style={{
                    height: "100%",
                    width: `${profile?.gamesPlayed > 0 ? (profile.wins / profile.gamesPlayed) * 100 : 0}%`,
                    background: "linear-gradient(90deg, #8b6914, #f5dd81)",
                    borderRadius: "4px",
                    transition: "width 0.5s ease",
                    }} />
                </div>
                </div>
                </>
                )}
        </div>

        {/* Sign out and delete — always visible at bottom */}
        <div style={{
          padding: "12px 20px",
          borderTop: "2px solid rgba(139,105,20,0.4)",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}>
          <button
            onClick={handleSignOut}
            style={{
              width: "100%",
              padding: "10px",
              background: "rgba(160,30,30,0.3)",
              border: "1px solid rgba(220,60,60,0.4)",
              borderRadius: "6px",
              color: "#ff8080",
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "13px",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
          <button
            onClick={handleDeleteAccount}
            style={{
              width: "100%",
              padding: "10px",
              background: "transparent",
              border: "1px solid rgba(180,30,30,0.4)",
              borderRadius: "6px",
              color: "rgba(255,80,80,0.5)",
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}