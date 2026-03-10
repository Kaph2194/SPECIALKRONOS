import { useEffect } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ToastProvider } from "./components/Toast";
import LoginPage from "./pages/LoginPage";
import CalendarPage from "./pages/CalendarPage";
import "./styles/global.css";

// Sonido de notificación generado con Web Audio API (sin archivo externo)
function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const times = [0, 0.15, 0.3];
    const freqs = [880, 1100, 1320];

    times.forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freqs[i];
      osc.type = "sine";
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + t + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + t + 0.12);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.15);
    });
  } catch (e) {
    console.log("Audio no disponible:", e);
  }
}

function AppContent() {
  const { user, loading } = useAuth();

  // Escuchar mensajes del Service Worker para reproducir sonido
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (event) => {
      if (event.data?.type === "PLAY_NOTIF_SOUND") {
        playNotifSound();
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <div className="loading-text">Cargando Special CAR...</div>
      </div>
    );
  }

  return user ? <CalendarPage /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
