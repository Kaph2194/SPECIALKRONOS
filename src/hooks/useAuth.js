import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // { name, email, picture, accessToken }
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kronos_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check token expiry
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          setUser(parsed);
        } else {
          localStorage.removeItem('kronos_user');
        }
      } catch (_) {
        localStorage.removeItem('kronos_user');
      }
    }
    setLoading(false);
  }, []);

  const loginWithGoogle = useGoogleLogin({
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' '),
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch user profile
        const profile = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        const userData = {
          name: profile.data.name,
          email: profile.data.email,
          picture: profile.data.picture,
          accessToken: tokenResponse.access_token,
          expiresAt: Date.now() + (tokenResponse.expires_in || 3600) * 1000,
        };
        setUser(userData);
        localStorage.setItem('kronos_user', JSON.stringify(userData));
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    },
    onError: (err) => console.error('Google login error:', err),
  });

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('kronos_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
