import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand-block">
          <div className="brand-icon-big">
            <img src={`${process.env.PUBLIC_URL}/logo.jpg`} alt="Special CAR Logo" />
          </div>
          <div className="brand-name">Special KRONOS</div>
          <div className="brand-sub">Agenda Inteligente</div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          Conéctate con tu cuenta de Google para sincronizar y gestionar tus eventos directamente en Google Calendar.
        </p>

        <button
          onClick={loginWithGoogle}
          style={{
            width: '100%', padding: '14px 20px',
            background: 'white', border: '1px solid #ddd',
            borderRadius: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, color: '#333',
            transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuar con Google
        </button>

        <div style={{ marginTop: 28, padding: '16px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: 10 }}>
            Permisos requeridos
          </div>
          {[
            ['📅', 'Ver y editar tus calendarios de Google'],
            ['🔔', 'Crear recordatorios y notificaciones'],
            ['👤', 'Ver tu nombre y correo (perfil básico)'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
              <span>{icon}</span> {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
