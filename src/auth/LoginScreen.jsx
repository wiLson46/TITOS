import { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

export default function LoginScreen({ error }) {
  const { renderButton, ready } = useAuth();
  const btnRef = useRef(null);

  useEffect(() => {
    if (ready) renderButton(btnRef.current);
  }, [ready, renderButton]);

  return (
    <div className="login-screen">
      <img src={`${import.meta.env.BASE_URL}logo-red.svg`} alt="" className="login-logo" />
      <div>
        <div className="login-title">(gas)TITOS</div>
        <div className="login-byline">by Wild Ideas</div>
        <div className="login-tagline">
          Gastos compartidos,
          <br />
          cuentas claras.
        </div>
      </div>
      <div ref={btnRef} className="login-google-btn" />
      {error && <div className="login-error">{error}</div>}
    </div>
  );
}
