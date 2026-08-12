import { useState } from 'react';
import {
  PEOPLE, computeSummary, computeBalance, expensesForMonth, formatARS,
  formatDateShort, monthLabel, monthWord, recentPeriods, expenseIsEssential, matchesOwnershipFilter,
  OWNERSHIP_OPTIONS,
} from '../../data/titosData';
import { IconChevronDown, IconCheck, IconArrow } from '../ui/Icons';

const PERIODS = recentPeriods(2);

export default function InicioTab({ categories, expenses, viewer, onGoDividir, onGoMetricas }) {
  const [periodIdx, setPeriodIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ownership, setOwnership] = useState('shared');
  const [ownershipMenuOpen, setOwnershipMenuOpen] = useState(false);
  const period = PERIODS[periodIdx];
  const ownershipLabel = OWNERSHIP_OPTIONS.find((o) => o.key === ownership).label;

  const filteredExpenses = expenses.filter((e) => matchesOwnershipFilter(e, ownership));
  const periodExpenses = expensesForMonth(filteredExpenses, period.year, period.month);
  const periodSummary = computeSummary(periodExpenses, categories);
  const nonEssentialPct = 100 - periodSummary.essentialPct;

  const unsettled = expenses.filter((e) => !e.settled);
  const balance = computeBalance(unsettled);
  const isSettled = balance.amount === 0;
  const owesName = balance.owesId ? PEOPLE[balance.owesId].name : '';
  const balanceSentence = !balance.owesId
    ? ''
    : balance.toId === viewer
    ? `${owesName} te debe`
    : `Le debés a ${PEOPLE[balance.toId].name}`;

  const topCategories = periodSummary.byCategory.slice(0, 4).map((c) => ({
    ...c,
    color: c.essential ? '#3F3250' : '#E14658',
    pct: periodSummary.total ? Math.round((c.total / periodSummary.total) * 100) : 0,
  }));

  const recent = [...filteredExpenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)
    .map((e) => {
      const cat = categories.find((c) => c.id === e.categoryId);
      return {
        ...e,
        categoryName: e.detail ? `${cat?.name} · ${e.detail}` : cat?.name,
        color: expenseIsEssential(e, categories) ? '#3F3250' : '#E14658',
        payerName: PEOPLE[e.paidBy]?.name,
      };
    });

  return (
    <>
      <div style={{ display: 'flex', gap: 8, padding: '10px 20px 4px', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <button className="pill-select" onClick={() => { setMenuOpen((v) => !v); setOwnershipMenuOpen(false); }}>
            {monthLabel(period.year, period.month).toUpperCase()}
            <IconChevronDown rotate={menuOpen} />
          </button>
          {menuOpen && (
            <div className="dropdown-menu">
              {PERIODS.map((p, i) => (
                <button
                  key={i}
                  className={i === periodIdx ? 'active' : ''}
                  onClick={() => { setPeriodIdx(i); setMenuOpen(false); }}
                >
                  {monthLabel(p.year, p.month)}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button className="pill-select" onClick={() => { setOwnershipMenuOpen((v) => !v); setMenuOpen(false); }}>
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
      </div>

      <div className="hero-card">
        <div className="hero-eyebrow">Gastamos en {monthWord(period.year, period.month)}</div>
        <div className="hero-total">{formatARS(periodSummary.total)}</div>
        <div className="hero-bar">
          <div style={{ height: '100%', background: '#3F3250', width: `${periodSummary.essentialPct}%` }} />
          <div style={{ height: '100%', background: '#E14658', width: `${nonEssentialPct}%` }} />
        </div>
        <div className="hero-legend">
          <div className="legend-item"><span className="dot" style={{ background: '#3F3250' }} />Indispensable {periodSummary.essentialPct}%</div>
          <div className="legend-item"><span className="dot" style={{ background: '#E14658' }} />Innecesario {nonEssentialPct}%</div>
        </div>
      </div>

      {isSettled ? (
        <div className="settled-card">
          <div className="check-badge"><IconCheck /></div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>Están al día — nadie le debe nada a nadie.</div>
        </div>
      ) : (
        <div className="balance-card">
          <div className="balance-people">
            <div className="balance-avatars">
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 12, background: PEOPLE[balance.owesId].color }}>{PEOPLE[balance.owesId].initials}</div>
              <IconArrow />
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 12, background: PEOPLE[balance.toId].color }}>{PEOPLE[balance.toId].initials}</div>
            </div>
            <div>
              <div className="balance-sentence">{balanceSentence}</div>
              <div className="balance-amount">{formatARS(balance.amount)}</div>
            </div>
          </div>
          <button className="balance-cta" onClick={onGoDividir}>Ir a Dividir →</button>
        </div>
      )}

      <div className="section-header">
        <div className="section-title">Por categoría</div>
        <button className="section-link" onClick={onGoMetricas}>VER TODO →</button>
      </div>
      {topCategories.length === 0 ? (
        <div className="empty-state">Todavía no hay gastos este mes.</div>
      ) : (
        <div className="list-card">
          {topCategories.map((cat) => (
            <div className="list-row" key={cat.id}>
              <span className="dot sm" style={{ background: cat.color }} />
              <span className="list-row-name">{cat.name}</span>
              <span className="list-row-pct">{cat.pct}%</span>
              <span className="list-row-amount">{formatARS(cat.total)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="section-title" style={{ margin: '24px 16px 8px', flexShrink: 0 }}>Últimos gastos</div>
      {recent.length === 0 ? (
        <div className="empty-state">Todavía no cargaste ningún gasto.</div>
      ) : (
        <div className="expense-cards">
          {recent.map((exp) => (
            <div className="expense-card" key={exp.id}>
              <span className="dot sm" style={{ background: exp.color }} />
              <div style={{ flex: 1 }}>
                <div className="expense-card-name">{exp.categoryName}</div>
                <div className="expense-card-meta">{formatDateShort(exp.date)} · {exp.payerName}</div>
              </div>
              <span className="expense-card-amount">{formatARS(exp.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
