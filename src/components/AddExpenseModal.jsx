import { useState } from 'react';
import { PEOPLE, formatARS } from '../data/titosData';
import { IconClose } from './ui/Icons';

export default function AddExpenseModal({ categories, onClose, onSubmit }) {
  const [categoryId, setCategoryId] = useState(null);
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('wilson');
  const [wilsonPct, setWilsonPct] = useState(50);
  const [essential, setEssential] = useState(true);
  const [useAsDefault, setUseAsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const selectCategory = (cat) => {
    setCategoryId(cat.id);
    setWilsonPct(cat.defaultSplit.wilson);
    setEssential(cat.essential);
  };

  const amountNum = Number(amount) || 0;
  const canSubmit = !!categoryId && amountNum > 0 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        categoryId,
        amount: amountNum,
        paidBy,
        split: { wilson: wilsonPct, yanina: 100 - wilsonPct },
        essential,
        detail,
        useAsDefault,
      });
    } catch (err) {
      setError(err.message || 'No se pudo guardar el gasto.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Nuevo gasto</div>
          <button className="modal-close" onClick={onClose}><IconClose /></button>
        </div>

        <div className="field-label">Categoría</div>
        <div className="chip-row">
          {categories.map((cat) => {
            const selected = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                className="chip-btn"
                style={{
                  background: selected ? '#22252C' : '#fff',
                  color: selected ? '#F8F5EF' : '#22252C',
                  border: selected ? 'none' : '1.5px solid rgba(34,37,44,0.16)',
                }}
                onClick={() => selectCategory(cat)}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        <div className="field-label">Detalle <span className="optional">(opcional)</span></div>
        <div className="input-box">
          <input
            type="text" value={detail} onChange={(e) => setDetail(e.target.value)}
            placeholder="Ej: Netflix, changas, super de la esquina…"
          />
        </div>

        <div className="field-label">Monto</div>
        <div className="input-box">
          <span className="prefix">$</span>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </div>

        <div className="field-label">Pagó</div>
        <div className="toggle-row">
          <button
            className="toggle-btn"
            style={{ background: paidBy === 'wilson' ? '#22252C' : '#F1ECE2', color: paidBy === 'wilson' ? '#F8F5EF' : '#4A4F5B' }}
            onClick={() => setPaidBy('wilson')}
          >{PEOPLE.wilson.name}</button>
          <button
            className="toggle-btn"
            style={{ background: paidBy === 'yanina' ? '#22252C' : '#F1ECE2', color: paidBy === 'yanina' ? '#F8F5EF' : '#4A4F5B' }}
            onClick={() => setPaidBy('yanina')}
          >{PEOPLE.yanina.name}</button>
        </div>

        <div className="field-label">División</div>
        <div className="split-box">
          <div className="split-labels">
            <span>Wilson {wilsonPct}% · {formatARS(amountNum * wilsonPct / 100)}</span>
            <span>Yanina {100 - wilsonPct}% · {formatARS(amountNum * (100 - wilsonPct) / 100)}</span>
          </div>
          <input type="range" min="0" max="100" step="5" value={wilsonPct} onChange={(e) => setWilsonPct(Number(e.target.value))} />
          <label className="default-check">
            <input type="checkbox" checked={useAsDefault} onChange={(e) => setUseAsDefault(e.target.checked)} />
            Usar esta división para esta categoría de ahora en adelante
          </label>
        </div>

        <div className="field-label">Este gasto es</div>
        <div className="toggle-row">
          <button
            className="toggle-btn with-dot"
            style={{ background: essential ? '#22252C' : '#F1ECE2', color: essential ? '#F8F5EF' : '#4A4F5B' }}
            onClick={() => setEssential(true)}
          ><span className="dot sm" style={{ background: '#3F3250' }} />Indispensable</button>
          <button
            className="toggle-btn with-dot"
            style={{ background: !essential ? '#22252C' : '#F1ECE2', color: !essential ? '#F8F5EF' : '#4A4F5B' }}
            onClick={() => setEssential(false)}
          ><span className="dot sm" style={{ background: '#E14658' }} />Innecesario</button>
        </div>

        {error && <div style={{ color: '#E14658', fontSize: 12.5, marginBottom: 12 }}>{error}</div>}

        <button
          className="submit-btn"
          style={{ background: canSubmit ? '#E14658' : '#D1C6B5' }}
          disabled={!canSubmit}
          onClick={submit}
        >
          {submitting ? 'Agregando…' : 'Agregar gasto'}
        </button>
      </div>
    </div>
  );
}
