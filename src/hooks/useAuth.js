import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Construir objeto user desde sesión de Supabase
  function buildUser(session) {
    if (!session) return null;
    return {
      name: session.user.user_metadata?.full_name || session.user.email,
      email: session.user.email,
      picture: session.user.user_metadata?.avatar_url || null,
      accessToken: session.provider_token, // token de Google Calendar
      expiresAt: session.expires_at * 1000,
    };
  }

  useEffect(() => {
    // Obtener sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(buildUser(session));
      setLoading(false);
    });

    // Escuchar cambios de sesión (login, logout, refresh automático)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(buildUser(session));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: GOOGLE_SCOPES,
        redirectTo: 'https://kaph2194.github.io/SPECIALKRONOS',
        queryParams: {
          access_type: 'offline',  // obtiene refresh_token
          prompt: 'consent',
        },
      },
    });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
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
