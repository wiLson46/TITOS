import { useState } from 'react';
import { computeSummary, expensesForMonth, monthlyTotals, formatARS, recentPeriods, monthLabel } from '../../data/titosData';

const PERIODS = recentPeriods(2); // [actual, anterior]
const TREND_MONTHS = [...PERIODS].reverse().map((p) => ({
  ...p,
  label: monthLabel(p.year, p.month).slice(0, 3).toUpperCase(),
}));

export default function MetricasTab({ categories, expenses }) {
  const [periodIdx, setPeriodIdx] = useState(0);
  const [centerMode, setCenterMode] = useState('total');
  const period = PERIODS[periodIdx];

  const periodExpenses = expensesForMonth(expenses, period.year, period.month);
  const periodSummary = computeSummary(periodExpenses, categories);
  const nonEssentialPct = 100 - periodSummary.essentialPct;

  let centerCaption = 'Total', centerValue = periodSummary.total;
  if (centerMode === 'essential') { centerCaption = 'Indispensable'; centerValue = periodSummary.essentialTotal; }
  if (centerMode === 'nonessential') { centerCaption = 'Innecesario'; centerValue = periodSummary.nonEssentialTotal; }

  const periodCategories = periodSummary.byCategory.slice(0, 6).map((c) => ({
    ...c,
    color: c.essential ? '#3F3250' : '#E14658',
  }));

  const totals = monthlyTotals(expenses, categories, TREND_MONTHS);
  const maxTotal = Math.max(totals[0]?.total || 0, totals[1]?.total || 0, 1);
  const maxBarPx = 96;
  const trendBars = totals.map((t) => {
    const heightPx = Math.max(8, Math.round((t.total / maxTotal) * maxBarPx));
    const essentialHeightPx = t.total ? Math.round(heightPx * (t.essentialTotal / t.total)) : 0;
    return { ...t, heightPx, essentialHeightPx, nonEssentialHeightPx: heightPx - essentialHeightPx };
  });

  const prevTotal = totals[0]?.total || 0;
  const curTotal = totals[1]?.total || 0;
  const change = prevTotal ? Math.round(((curTotal - prevTotal) / prevTotal) * 100) : 0;
  const deltaLabel = `${change >= 0 ? '+' : ''}${change}% vs. mes anterior`;
  const deltaColor = change >= 0 ? '#E14658' : '#3F7D5B';

  const toggleStyle = (active) => ({ background: active ? '#22252C' : '#F1ECE2', color: active ? '#F8F5EF' : '#4A4F5B' });

  return (
    <>
      <div className="screen-title">Métricas</div>
      <div className="period-toggle">
        {PERIODS.map((p, i) => (
          <button key={i} style={toggleStyle(periodIdx === i)} onClick={() => setPeriodIdx(i)}>
            {monthLabel(p.year, p.month).split(' ')[0].toUpperCase()}
          </button>
        ))}
      </div>

      <div className="donut-wrap">
        <div className="donut" style={{ background: `conic-gradient(#3F3250 0% ${periodSummary.essentialPct}%, #E14658 ${periodSummary.essentialPct}% 100%)` }}>
          <div
            className="donut-center"
            onClick={() => setCenterMode((m) => (m === 'total' ? 'essential' : m === 'essential' ? 'nonessential' : 'total'))}
          >
            <div className="donut-caption">{centerCaption}</div>
            <div className="donut-value">{formatARS(centerValue)}</div>
          </div>
        </div>
        <div className="donut-chips">
          <button className="donut-chip" style={{ background: centerMode === 'essential' ? '#E4DCCE' : '#F1ECE2' }} onClick={() => setCenterMode((m) => (m === 'essential' ? 'total' : 'essential'))}>
            <span className="dot sm" style={{ background: '#3F3250' }} />Indispensable · {periodSummary.essentialPct}%
          </button>
          <button className="donut-chip" style={{ background: centerMode === 'nonessential' ? '#E4DCCE' : '#F1ECE2' }} onClick={() => setCenterMode((m) => (m === 'nonessential' ? 'total' : 'nonessential'))}>
            <span className="dot sm" style={{ background: '#E14658' }} />Innecesario · {nonEssentialPct}%
          </button>
        </div>
      </div>

      {periodCategories.length > 0 && (
        <div className="cat-chips">
          {periodCategories.map((c) => (
            <div className="cat-chip" key={c.id}>
              <span className="dot sm" style={{ background: c.color }} />
              <span className="cat-chip-name">{c.name}</span>
              <span className="cat-chip-amount">{formatARS(c.total)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="section-header" style={{ margin: '22px 16px 12px' }}>
        <div className="section-title">Tendencia</div>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color: deltaColor }}>{deltaLabel}</div>
      </div>
      <div className="trend-card">
        <div className="trend-bars">
          {trendBars.map((bar) => (
            <div className="trend-bar-col" key={bar.label}>
              <div className="trend-bar-total">{formatARS(bar.total)}</div>
              <div className="trend-bar" style={{ height: bar.heightPx }}>
                <div style={{ width: '100%', height: bar.essentialHeightPx, background: '#3F3250' }} />
                <div style={{ width: '100%', height: bar.nonEssentialHeightPx, background: '#E14658' }} />
              </div>
              <div className="trend-bar-label">{bar.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
