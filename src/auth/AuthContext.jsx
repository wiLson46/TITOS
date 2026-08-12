import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'titos_session';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function decodeJwt(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(
      decodeURIComponent(
        atob(b64)
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      )
    );
  } catch {
    return null;
  }
}

const nowSec = () => Math.floor(Date.now() / 1000);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { email, name, picture }
  const [credential, setCredential] = useState(null);
  const [ready, setReady] = useState(false);
  const expRef = useRef(0);

  const persist = useCallback((cred, u, exp) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ credential: cred, user: u, exp }));
  }, []);

  const onCredential = useCallback(
    (response) => {
      const payload = decodeJwt(response.credential);
      if (!payload?.email) return;
      const u = { email: payload.email.toLowerCase(), name: payload.name, picture: payload.picture };
      expRef.current = payload.exp;
      setUser(u);
      setCredential(response.credential);
      persist(response.credential, u, payload.exp);
    },
    [persist]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.exp > nowSec()) {
          setUser(data.user);
          setCredential(data.credential);
          expRef.current = data.exp;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // ignore corrupt storage
    }

    const init = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: onCredential,
        auto_select: true,
        cancel_on_tap_outside: true,
      });
      setReady(true);
      window.google.accounts.id.prompt(); // one-tap silencioso si hay sesión de Google activa
    };

    if (window.google?.accounts?.id) init();
    else window.onGoogleLibraryLoad = init;
  }, [onCredential]);

  const renderButton = useCallback((el) => {
    if (!el || !window.google?.accounts?.id) return;
    el.innerHTML = '';
    window.google.accounts.id.renderButton(el, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      locale: 'es',
    });
  }, []);

  const logout = useCallback(() => {
    window.google?.accounts?.id?.disableAutoSelect();
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setCredential(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, credential, ready, renderButton, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
