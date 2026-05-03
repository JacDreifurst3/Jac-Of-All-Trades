import { useState } from "react";
import { auth } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth";
import "../styles/profileModal.css"; 

export default function ProfileModal({ onClose }) {
  const { user, profile, setProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || "");
  const [profilePicUrl, setProfilePicUrl] = useState(profile?.profilePicUrl || "");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const showMessage = (msg, isError = false) => {
    if (isError) setError(msg);
    else setMessage(msg);
    setTimeout(() => { setMessage(null); setError(null); }, 3000);
  };

  const reauthenticate = async () => {
    if (!currentPassword) throw new Error("Please enter your current password to make security changes");
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:5001/api/users/${user.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
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
    } catch (err) { showMessage(err.message, true); }
    finally { setLoading(false); }
  };

  const handleUpdatePassword = async () => {
    setLoading(true);
    try {
      await reauthenticate();
      await updatePassword(auth.currentUser, newPassword);
      showMessage("Password updated!");
      setNewPassword("");
      setCurrentPassword("");
    } catch (err) {
      const errorMsgs = {
        "auth/requires-recent-login": "Please enter your current password first",
        "auth/weak-password": "Password must be at least 6 characters",
        "auth/wrong-password": "Current password is incorrect"
      };
      showMessage(errorMsgs[err.code] || err.message, true);
    } finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    setLoading(true);
    try {
      await reauthenticate();
      const token = await user.getIdToken();
      await fetch(`http://localhost:5001/api/users/${user.uid}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      await deleteUser(auth.currentUser);
    } catch (err) {
      showMessage(err.code === "auth/requires-recent-login" ? "Enter current password first" : err.message, true);
      setLoading(false);
    }
  };

  const winRate = profile?.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        
        <div className="modal-header">
          <h2>Profile</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="profile-summary">
          <div className="avatar-circle">
            {profile?.profilePicUrl ? (
              <img src={profile.profilePicUrl} className="avatar-image" alt="avatar" onError={e => { e.target.style.display = "none"; }} />
            ) : (
              (profile?.username || user?.email || "?")[0].toUpperCase()
            )}
          </div>
          <div className="user-info-text">
            <div className="username">{profile?.username || "Unknown"}</div>
            <div className="email">{user?.email}</div>
          </div>
        </div>

        <div className="tabs-container">
          {["profile", "security", "stats"].map(tab => (
            <button 
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`} 
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="form-content">
          {message && <div className="status-msg success">{message}</div>}
          {error && <div className="status-msg error">{error}</div>}

          {activeTab === "profile" && (
            <>
              <div className="input-group">
                <label className="label-text">Username</label>
                <input className="styled-input" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="label-text">Profile Picture URL</label>
                <input className="styled-input" value={profilePicUrl} onChange={e => setProfilePicUrl(e.target.value)} />
              </div>
              <button className="save-button" onClick={handleSaveProfile} disabled={loading}>
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </>
          )}

          {activeTab === "security" && (
            <>
              <div className="input-group">
                <label className="label-text">Current Password</label>
                <input className="styled-input" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="label-text">New Password</label>
                <input className="styled-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <button className="save-button" onClick={handleUpdatePassword} disabled={loading || !newPassword}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </>
          )}

          {activeTab === "stats" && (
            <>
              <div className="stats-grid">
                <StatBox label="Played" value={profile?.gamesPlayed} color="#f5dd81" />
                <StatBox label="Wins" value={profile?.wins} color="#4caf50" />
                <StatBox label="Losses" value={profile?.losses} color="#f44336" />
              </div>
              <div className="win-rate-container">
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span className="label-text">Win Rate</span>
                  <span style={{color: '#f5dd81', fontFamily: 'Cinzel'}}>{winRate}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${winRate}%` }} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="signout-btn" onClick={() => auth.signOut()}>Sign Out</button>
          <button className="delete-btn" onClick={handleDeleteAccount}>Delete Account</button>
        </div>
      </div>
    </div>
  );
}

// Helper component for Stat boxes
function StatBox({ label, value, color }) {
  return (
    <div className="stat-box">
      <div style={{ color, fontFamily: 'Cinzel', fontSize: '32px', fontWeight: '700' }}>{value ?? 0}</div>
      <div className="label-text" style={{ fontSize: '10px' }}>{label}</div>
    </div>
  );
}