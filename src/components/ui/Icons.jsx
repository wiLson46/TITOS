export function IconHistorial({ color }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="2" rx="1" fill={color} />
      <rect x="4" y="11" width="16" height="2" rx="1" fill={color} />
      <rect x="4" y="17" width="10" height="2" rx="1" fill={color} />
    </svg>
  );
}

export function IconInicio({ color }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <polygon points="3,11 12,4 21,11" stroke={color} strokeWidth="1.75" strokeLinejoin="round" fill="none" />
      <rect x="5" y="11" width="14" height="9" stroke={color} strokeWidth="1.75" fill="none" />
      <rect x="10" y="14" width="4" height="6" fill={color} />
    </svg>
  );
}

export function IconDividir({ color }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <line x1="4" y1="7" x2="16" y2="7" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
      <polyline points="7,4 4,7 7,10" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="8" y1="17" x2="20" y2="17" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
      <polyline points="17,14 20,17 17,20" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMetricas({ color }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="13" width="3.5" height="7" fill={color} />
      <rect x="10.25" y="8" width="3.5" height="12" fill={color} />
      <rect x="16.5" y="3" width="3.5" height="17" fill={color} />
    </svg>
  );
}

export function IconPlus() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <line x1="12" y1="5" x2="12" y2="19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="5" y1="12" x2="19" y2="12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24">
      <line x1="5" y1="5" x2="19" y2="19" stroke="#22252C" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="19" y1="5" x2="5" y2="19" stroke="#22252C" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck({ color = '#fff', size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <polyline points="4,13 9,18 20,6" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronDown({ rotate = false }) {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" style={{ transform: rotate ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
      <path d="M1 1l4 4 4-4" stroke="#8A8E99" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconArrow({ size = 18 }) {
  const w = size, h = Math.round(size * 10 / 18);
  return (
    <svg width={w} height={h} viewBox="0 0 18 10" style={{ margin: '0 -1px' }}>
      <line x1="1" y1="5" x2="12" y2="5" stroke="#C0B3A0" strokeWidth="1.75" strokeDasharray="2.5,3" strokeLinecap="round" />
      <polyline points="9,1.5 14,5 9,8.5" fill="none" stroke="#C0B3A0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
    </svg>
  );
}
