import { PEOPLE } from '../../data/titosData';

export default function Avatar({ personId, size = 26, overlap = false, className = '' }) {
  const p = PEOPLE[personId];
  if (!p) return null;
  return (
    <div
      className={`avatar ${overlap ? 'overlap' : ''} ${className}`.trim()}
      style={{ width: size, height: size, background: p.color, fontSize: Math.round(size * 0.42) }}
      title={p.name}
    >
      {p.initials}
    </div>
  );
}
