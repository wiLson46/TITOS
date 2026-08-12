import { IconHistorial, IconInicio, IconDividir, IconMetricas, IconPlus } from './ui/Icons';

const ACTIVE = '#22252C';
const INACTIVE = '#8A8E99';

export default function TabBar({ tab, onTab, onFab }) {
  const c = (t) => (tab === t ? ACTIVE : INACTIVE);
  const w = (t) => (tab === t ? 700 : 400);
  return (
    <div className="tab-bar">
      <button className="tab-btn" onClick={() => onTab('historial')}>
        <IconHistorial color={c('historial')} />
        <span style={{ color: c('historial'), fontWeight: w('historial') }}>Historial</span>
      </button>
      <button className="tab-btn" onClick={() => onTab('inicio')}>
        <IconInicio color={c('inicio')} />
        <span style={{ color: c('inicio'), fontWeight: w('inicio') }}>Inicio</span>
      </button>
      <button className="fab-btn" onClick={onFab} aria-label="Nuevo gasto">
        <IconPlus />
      </button>
      <button className="tab-btn" onClick={() => onTab('dividir')}>
        <IconDividir color={c('dividir')} />
        <span style={{ color: c('dividir'), fontWeight: w('dividir') }}>Dividir</span>
      </button>
      <button className="tab-btn" onClick={() => onTab('metricas')}>
        <IconMetricas color={c('metricas')} />
        <span style={{ color: c('metricas'), fontWeight: w('metricas') }}>Métricas</span>
      </button>
    </div>
  );
}
