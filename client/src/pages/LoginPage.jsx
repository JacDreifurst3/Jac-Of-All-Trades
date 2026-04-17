import { useState } from "react";
import { auth, googleProvider } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";

// Handles both login and signup — toggled by isSignUp state
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { syncWithBackend } = useAuth();

  // Email/password login or signup depending on isSignUp toggle
  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (isSignUp && !username) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await syncWithBackend(result.user, username);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      if (err.code === "auth/email-already-in-use") setError("Email already in use");
      else if (err.code === "auth/wrong-password") setError("Incorrect password");
      else if (err.code === "auth/user-not-found") setError("No account with that email");
      else if (err.code === "auth/weak-password") setError("Password must be at least 6 characters");
      else if (err.code === "auth/invalid-credential") setError("Incorrect email or password");
      else setError("Something went wrong — please try again");
    } finally {
      setLoading(false);
    }
  };

  // Google popup login — Firebase handles the OAuth flow
  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: "12px 14px",
    background: "rgba(255,255,255,0.06)",
    border: "2px solid rgba(139,105,20,0.5)",
    borderRadius: "6px",
    color: "#e8d5a3",
    fontFamily: "Rajdhani, sans-serif",
    fontSize: "15px",
    fontWeight: "600",
    letterSpacing: "0.04em",
    outline: "none",
    width: "100%",
  };

  // Uses existing lobby-screen and setup-controls CSS classes to match the game's style
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "#6b1a1a",
      fontFamily: "Cinzel, serif"
    }}>
      <h1 style={{
        fontSize: "60px",
        color: "#f5dd81",
        letterSpacing: "0.15em",
        marginBottom: "8px",
        textShadow: "0 0 24px rgba(245,221,129,0.4)"
      }}>
        stratego
      </h1>

      <p style={{
        color: "#dbb26aff",
        fontFamily: "Rajdhani, sans-serif",
        letterSpacing: "0.2em",
        fontSize: "20px",
        marginBottom: "36px",
        textTransform: "uppercase",
        fontWeight: "bold"
      }}>
        The Game of Battlefield Strategy
      </p>

      <div style={{
        background: "linear-gradient(180deg, #3f0601 0%, #240800 100%)",
        border: "5px solid #8b6914",
        borderRadius: "8px",
        padding: "36px 40px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        display: "flex",
        flexDirection: "column",
        gap: "14px"
      }}>
        <h2 style={{
          color: "#f5dd81",
          fontSize: "20px",
          letterSpacing: "0.1em",
          textAlign: "center",
          marginBottom: "8px"
        }}>
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>

        {error && (
          <div style={{
            background: "rgba(160,30,30,0.95)",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "4px",
            fontSize: "13px",
            fontFamily: "Rajdhani, sans-serif",
            letterSpacing: "0.04em",
            border: "1px solid rgba(255,100,100,0.4)",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        {isSignUp && (
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />
        )}

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
          style={inputStyle}
        />

        <button
          onClick={handleEmailAuth}
          disabled={loading}
          style={{
            padding: "12px",
            background: "rgba(245,221,129,0.15)",
            border: "2px solid #f5dd81",
            borderRadius: "6px",
            color: "#f5efd7ff",
            fontFamily: "Cinzel, serif",
            fontSize: "14px",
            fontWeight: "700",
            letterSpacing: "0.1em",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "4px",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => e.target.style.background = "rgba(245, 187, 129, 0.59)"}
          onMouseLeave={e => e.target.style.background = "rgba(245,221,129,0.15)"}
        >
          {loading ? "..." : isSignUp ? "Create Account" : "Log In"}
        </button>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#8b7040"
        }}>
          <div style={{ flex: 1, height: "1px", background: "#8b6914" }} />
          <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "13px" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "#8b6914" }} />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            padding: "12px",
            background: "rgba(255,255,255,0.06)",
            border: "2px solid #bb9e2bff",
            borderRadius: "6px",
            color: "#e8d5a3",
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "14px",
            fontWeight: "700",
            letterSpacing: "0.1em",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => e.target.style.background = "rgba(253, 219, 167, 0.38)"}
          onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.06)"}
        >
          Continue with Google
        </button>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
          style={{
            padding: "10px",
            background: "transparent",
            border: "2px solid #8b751fff",
            borderRadius: "6px",
            color: "#e8d5a3",
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "13px",
            fontWeight: "600",
            letterSpacing: "0.08em",
            cursor: "pointer",
            transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseEnter={e => { e.target.style.background = "#c9a84c8c"; e.target.style.borderColor = "1px solid #edce81ff"; }}
          onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = "1px solid rgba(139,105,20,0.7)"; }}
        >
          {isSignUp ? "Already have an account? Log In" : "New here? Sign Up"}
        </button>
      </div>
    </div>
  );
}