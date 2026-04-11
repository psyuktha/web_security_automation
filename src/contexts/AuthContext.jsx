import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("auth_token"));
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("auth_token");
      if (storedToken) {
        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(storedToken);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem("auth_token");
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error("Auth check error:", error);
          localStorage.removeItem("auth_token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signup = async (email, password, fullName) => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      localStorage.setItem("auth_token", data.token);
      setToken(data.token);
      setUser(data.user);
      setLoading(false); // Ensure loading is false after successful signup

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signin = async (email, password) => {
    try {
      console.log("🔐 Attempting signin to:", `${API_URL}/auth/signin`);
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Signin failed:", data.error);
        throw new Error(data.error || "Signin failed");
      }

      console.log("✅ Signin successful, setting user:", data.user);
      localStorage.setItem("auth_token", data.token);
      setToken(data.token);
      setUser(data.user);
      setLoading(false); // Ensure loading is false after successful signin

      return { success: true };
    } catch (error) {
      console.error("❌ Signin error:", error);
      return { success: false, error: error.message };
    }
  };

  const signout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  const getAuthHeaders = () => {
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signup,
        signin,
        signout,
        isAuthenticated: !!user,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
