import { useState } from 'react';
import { PEOPLE, computeBalance, formatARS, formatDateShort, isSharedExpense } from '../../data/titosData';
import { IconCheck, IconArrow } from '../ui/Icons';

export default function DividirTab({ categories, expenses, viewer, onSettleUp, onSettleExpense, busy }) {
  const [settlingId, setSettlingId] = useState(null);

  const unsettled = expenses.filter((e) => !e.settled);
  const balance = computeBalance(unsettled);
  const isSettled = balance.amount === 0;

  const pending = unsettled
    .filter(isSharedExpense)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((e) => {
      const cat = categories.find((c) => c.id === e.categoryId);
      return {
        ...e,
        categoryName: e.detail ? `${cat?.name} · ${e.detail}` : cat?.name,
        color: (e.essential !== undefined ? e.essential : cat?.essential) ? '#3F3250' : '#E14658',
        payer: PEOPLE[e.paidBy],
      };
    });

  const settleRow = async (id) => {
    setSettlingId(id);
    try {
      await onSettleExpense(id);
    } finally {
      setSettlingId(null);
    }
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
            {viewer === balance.owesId && (
              <button className="settle-btn" onClick={onSettleUp} disabled={busy}>
                {busy ? 'Liquidando…' : 'Liquidar ahora'}
              </button>
            )}
          </>
        )}
      </div>

      <div className="section-title" style={{ margin: '26px 16px 12px', flexShrink: 0 }}>Gastos a dividir</div>
      {pending.length === 0 ? (
        <div className="empty-state">No hay gastos compartidos pendientes.</div>
      ) : (
        <div className="expense-cards" style={{ marginBottom: 24 }}>
          {pending.map((exp) => (
            <div className="expense-card" key={exp.id}>
              <span className="dot sm" style={{ background: exp.color }} />
              <div style={{ flex: 1 }}>
                <div className="expense-card-name">{exp.categoryName}</div>
                <div className="expense-card-meta">{formatDateShort(exp.date)} · pagó {exp.payer.name}</div>
              </div>
              <span className="expense-card-amount">{formatARS(exp.amount)}</span>
              {viewer !== exp.paidBy && (
                <button
                  className="row-settle-btn"
                  onClick={() => settleRow(exp.id)}
                  disabled={settlingId === exp.id}
                >
                  {settlingId === exp.id ? '…' : 'Liquidar'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
