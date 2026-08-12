import { useState } from 'react';
import { PEOPLE, computeBalance, formatARS } from '../../data/titosData';
import { IconCheck, IconArrow } from '../ui/Icons';

export default function DividirTab({ categories, expenses, onSettleUp, onUpdateSplit, busy }) {
  const [editingId, setEditingId] = useState(null);
  const [tempPct, setTempPct] = useState(50);

  const unsettled = expenses.filter((e) => !e.settled);
  const balance = computeBalance(unsettled);
  const isSettled = balance.amount === 0;

  const startEdit = (cat) => {
    if (editingId === cat.id) { setEditingId(null); return; }
    setEditingId(cat.id);
    setTempPct(cat.defaultSplit.wilson);
  };

  const save = async (cat) => {
    await onUpdateSplit(cat.id, { wilson: tempPct, yanina: 100 - tempPct });
    setEditingId(null);
  };

  return (
    <>
      <div className="screen-title">Dividir</div>
      <div className="hero-card">
        <div className="hero-eyebrow" style={{ marginBottom: 14 }}>Balance</div>
        {isSettled ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="check-badge lg"><IconCheck size={20} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Están al día</div>
              <div style={{ fontSize: 12.5, color: '#8A8E99', marginTop: 2 }}>Nadie le debe nada a nadie.</div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div className="avatar" style={{ width: 40, height: 40, fontSize: 15, background: PEOPLE[balance.owesId].color }}>{PEOPLE[balance.owesId].initials}</div>
                <IconArrow size={26} />
                <div className="avatar" style={{ width: 40, height: 40, fontSize: 15, background: PEOPLE[balance.toId].color }}>{PEOPLE[balance.toId].initials}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: '#4A4F5B' }}>
                  {PEOPLE[balance.owesId].name} le debe a {PEOPLE[balance.toId].name}
                </div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 26 }}>{formatARS(balance.amount)}</div>
              </div>
            </div>
            <button className="settle-btn" onClick={onSettleUp} disabled={busy}>
              {busy ? 'Liquidando…' : 'Liquidar ahora'}
            </button>
          </>
        )}
      </div>

      <div className="section-title" style={{ margin: '26px 16px 4px', flexShrink: 0 }}>Reglas de división</div>
      <div className="rules-desc">Definí cómo se divide cada categoría. Se aplica solo, sin preguntarte cada vez.</div>
      <div className="list-card" style={{ marginBottom: 24 }}>
        {categories.map((cat) => {
          const editing = editingId === cat.id;
          const otherPct = 100 - tempPct;
          return (
            <div className="rule-row" key={cat.id}>
              <div className="rule-row-head" onClick={() => startEdit(cat)}>
                <span className="dot sm" style={{ background: cat.essential ? '#3F3250' : '#E14658' }} />
                <span className="rule-row-name">{cat.name}</span>
                <span className="rule-row-split">{cat.defaultSplit.wilson}/{cat.defaultSplit.yanina}</span>
              </div>
              {editing && (
                <div className="rule-edit">
                  <div className="rule-edit-labels">
                    <span>Wilson {tempPct}%</span>
                    <span>Yanina {otherPct}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100" step="5" value={tempPct}
                    onChange={(e) => setTempPct(Number(e.target.value))}
                  />
                  <button className="rule-save-btn" onClick={() => save(cat)}>Guardar</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
