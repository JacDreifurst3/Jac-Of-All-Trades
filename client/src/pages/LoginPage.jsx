import { useState } from "react";
import loginBg from "../assets/login.png";
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

  // Uses existing lobby-screen and setup-controls CSS classes to match the game's style
  return (
    <div
      className="login-root"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="login-overlay" />

      <div className="login-content">
        <h1 className="login-title">stratego</h1>

        <p className="login-subtitle">The Game of Battlefield Strategy</p>

        <div className="login-card">
          <h2 className="login-card-title">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>

          {error && (
            <div className="login-error">{error}</div>
          )}

          {isSignUp && (
            <input
              className="login-input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}

          <input
            className="login-input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="login-input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
          />

          <button
            className="login-btn-primary"
            onClick={handleEmailAuth}
            disabled={loading}
          >
            {loading ? "..." : isSignUp ? "Create Account" : "Log In"}
          </button>

          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">or</span>
            <div className="login-divider-line" />
          </div>

          <button
            className="login-btn-google"
            onClick={handleGoogle}
            disabled={loading}
          >
            Continue with Google
          </button>

          <button
            className="login-btn-toggle"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
          >
            {isSignUp ? "Already have an account? Log In" : "New here? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}