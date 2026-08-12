import { useState } from 'react';
import {
  PEOPLE, formatARS, formatDateGroup, expenseIsEssential, matchesOwnershipFilter, OWNERSHIP_OPTIONS,
} from '../../data/titosData';
import { IconChevronDown } from '../ui/Icons';

export default function HistorialTab({ categories, expenses }) {
  const [filter, setFilter] = useState('all');
  const [ownership, setOwnership] = useState('shared');
  const [ownershipMenuOpen, setOwnershipMenuOpen] = useState(false);
  const ownershipLabel = OWNERSHIP_OPTIONS.find((o) => o.key === ownership).label;

  const filtered = [...expenses]
    .filter((e) => matchesOwnershipFilter(e, ownership))
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((e) => {
      const essential = expenseIsEssential(e, categories);
      if (filter === 'essential') return essential;
      if (filter === 'nonessential') return !essential;
      return true;
    });

  const groups = [];
  for (const e of filtered) {
    const label = formatDateGroup(e.date);
    const cat = categories.find((c) => c.id === e.categoryId);
    const row = {
      id: e.id,
      categoryName: e.detail ? `${cat?.name} · ${e.detail}` : cat?.name,
      color: expenseIsEssential(e, categories) ? '#3F3250' : '#E14658',
      payer: PEOPLE[e.paidBy],
      amountFmt: formatARS(e.amount),
      note: e.overridden ? `${e.split.wilson}/${e.split.yanina} · excepción` : null,
    };
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(row);
    else groups.push({ label, items: [row] });
  }

  const active = 'active-chip';
  const chipStyle = (key) => ({
    background: filter === key ? '#22252C' : '#F1ECE2',
    color: filter === key ? '#F8F5EF' : '#4A4F5B',
  });

  return (
    <>
      <div className="screen-title">Historial</div>
      <div style={{ position: 'relative', padding: '14px 16px 0', flexShrink: 0 }}>
        <button className="pill-select" onClick={() => setOwnershipMenuOpen((v) => !v)}>
          {ownershipLabel.toUpperCase()}
          <IconChevronDown rotate={ownershipMenuOpen} />
        </button>
        {ownershipMenuOpen && (
          <div className="dropdown-menu">
            {OWNERSHIP_OPTIONS.map((o) => (
              <button
                key={o.key}
                className={o.key === ownership ? 'active' : ''}
                onClick={() => { setOwnership(o.key); setOwnershipMenuOpen(false); }}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="filter-row">
        <button className="filter-chip" style={chipStyle('all')} onClick={() => setFilter('all')}>TODOS</button>
        <button className="filter-chip" style={chipStyle('essential')} onClick={() => setFilter('essential')}>INDISPENSABLE</button>
        <button className="filter-chip" style={chipStyle('nonessential')} onClick={() => setFilter('nonessential')}>INNECESARIO</button>
      </div>
      <div style={{ padding: '6px 16px 24px' }}>
        {groups.length === 0 && <div className="empty-state">No hay gastos para mostrar.</div>}
        {groups.map((grp) => (
          <div key={grp.label}>
            <div className="day-group-label">{grp.label}</div>
            {grp.items.map((row) => (
              <div className="history-row" key={row.id}>
                <span className="dot sm" style={{ background: row.color }} />
                <div style={{ flex: 1 }}>
                  <div className="expense-card-name">{row.categoryName}</div>
                  {row.note && <div className="history-row-note">{row.note}</div>}
                </div>
                <div className="mini-avatar" style={{ background: row.payer.color }}>{row.payer.initials}</div>
                <span className="expense-card-amount" style={{ minWidth: 70, textAlign: 'right' }}>{row.amountFmt}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
