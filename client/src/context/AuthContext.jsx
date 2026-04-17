//share data across app

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../config/firebase";
// calls on login/logout/refresh
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase user object
  const [profile, setProfile] = useState(null); // MongoDB profile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth state changes — fires on login, logout, and page refresh
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await syncWithBackend(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe; // Cleanup listener on unmount
  }, []);

  // Creates or fetches the user's MongoDB profile after Firebase login
  const syncWithBackend = async (firebaseUser, username = "") => {
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("http://localhost:5001/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          username: username || firebaseUser.displayName || firebaseUser.email.split("@")[0]
        })
      });
      if (res.ok) {
        const mongoProfile = await res.json();
        setProfile(mongoProfile);
      }
    } catch (error) {
      console.error("Backend sync error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading, syncWithBackend }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook so any component can access auth state easily
export function useAuth() {
  return useContext(AuthContext);
}