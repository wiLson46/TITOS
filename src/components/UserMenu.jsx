import { useEffect, useRef, useState } from 'react';
import { PEOPLE } from '../data/titosData';

export default function UserMenu({ viewer, email, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const person = PEOPLE[viewer];

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  if (!person) return null;

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-menu-trigger" onClick={() => setOpen((v) => !v)}>
        <div className="avatar" style={{ background: person.color }}>{person.initials}</div>
      </button>
      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-name">{person.name}</div>
          <div className="user-menu-email">{email}</div>
          <button className="user-menu-logout" onClick={onLogout}>Cerrar sesión</button>
        </div>
      )}
    </div>
  );
}
