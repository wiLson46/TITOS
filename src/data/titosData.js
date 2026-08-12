// TITOS — lógica de negocio compartida (helpers de formato + cálculos de resumen/balance).
// Portado de titos-data.js (mock del diseño en Claude Design), adaptado a los campos
// reales del backend (settled/settledAt) y a operar sobre el dataset que devuelve la API.

export const PEOPLE = {
  wilson: { id: 'wilson', name: 'Wilson', initials: 'W', color: '#3F3250' },
  yanina: { id: 'yanina', name: 'Yanina', initials: 'Y', color: '#E14658' },
};

// Mapeo puramente de UI (para saber a quién le corresponde la sesión logueada y
// personalizar frases como "Yanina te debe"). La whitelist real vive en el backend.
export const EMAIL_TO_PERSON = {
  'flashiando@gmail.com': 'wilson',
  'yaninabelensbarbaro@gmail.com': 'yanina',
};

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function formatARS(n) {
  return '$' + Math.round(n || 0).toLocaleString('es-AR');
}

export function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
}

export function formatDateGroup(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diffDays = Math.round((today - d) / 86400000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  return `${DAYS_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`;
}

export function categoryById(categories, id) {
  return categories.find((c) => c.id === id);
}

function isEssential(exp, categories) {
  const cat = categoryById(categories, exp.categoryId);
  return exp.essential !== undefined && exp.essential !== null ? exp.essential : !!(cat && cat.essential);
}

// Resumen (totales + por categoría) sobre una lista de expenses ya filtrada por período si hace falta.
// No filtra por settled — se usa tanto para Historial/Métricas (todo el histórico) como, con el array
// ya pre-filtrado por el caller, para el balance de deuda pendiente (ver computeBalance).
export function computeSummary(expenses, categories) {
  let total = 0, essentialTotal = 0, nonEssentialTotal = 0;
  const byCategory = {};

  for (const exp of expenses) {
    const cat = categoryById(categories, exp.categoryId);
    if (!cat) continue;
    const essential = isEssential(exp, categories);
    total += exp.amount;
    if (essential) essentialTotal += exp.amount; else nonEssentialTotal += exp.amount;

    if (!byCategory[cat.id]) byCategory[cat.id] = { id: cat.id, name: cat.name, essential: cat.essential, total: 0 };
    byCategory[cat.id].total += exp.amount;
  }

  const byCategoryList = Object.values(byCategory).sort((a, b) => b.total - a.total);

  return {
    total,
    essentialTotal,
    nonEssentialTotal,
    essentialPct: total ? Math.round((essentialTotal / total) * 100) : 0,
    byCategory: byCategoryList,
  };
}

// Balance de deuda: solo sobre expenses NO saldados (settled=false).
export function computeBalance(expenses) {
  let netYaninaOwesWilson = 0; // positivo = yanina le debe a wilson, negativo = wilson le debe a yanina
  for (const exp of expenses) {
    if (exp.settled) continue;
    const wilsonShare = (exp.amount * exp.split.wilson) / 100;
    const yaninaShare = (exp.amount * exp.split.yanina) / 100;
    if (exp.paidBy === 'wilson') netYaninaOwesWilson += yaninaShare;
    else netYaninaOwesWilson -= wilsonShare;
  }
  const amount = Math.round(Math.abs(netYaninaOwesWilson));
  return {
    amount,
    owesId: netYaninaOwesWilson > 0 ? 'yanina' : netYaninaOwesWilson < 0 ? 'wilson' : null,
    toId: netYaninaOwesWilson > 0 ? 'wilson' : 'yanina',
  };
}

export function expensesForMonth(expenses, year, month) {
  return expenses.filter((e) => {
    const d = new Date(e.date + 'T12:00:00');
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function monthlyTotals(expenses, categories, months) {
  return months.map(({ year, month, label }) => {
    const s = computeSummary(expensesForMonth(expenses, year, month), categories);
    return { label, total: s.total, essentialTotal: s.essentialTotal, nonEssentialTotal: s.nonEssentialTotal };
  });
}

export function expenseIsEssential(exp, categories) {
  return isEssential(exp, categories);
}

// Un gasto es "conjunto" cuando ambas partes tienen % > 0 (genera deuda entre las dos personas).
// Un gasto "unilateral" (100/0 o 0/100) es plata de una sola persona y no afecta el balance.
export function isSharedExpense(exp) {
  return exp.split.wilson > 0 && exp.split.yanina > 0;
}

export const OWNERSHIP_OPTIONS = [
  { key: 'wilson', label: 'Solo Wilson' },
  { key: 'yanina', label: 'Solo Yanina' },
  { key: 'shared', label: 'Gastos conjuntos' },
  { key: 'all', label: 'Todos los gastos' },
];

export function matchesOwnershipFilter(exp, filter) {
  switch (filter) {
    case 'wilson':
      return exp.split.wilson === 100 && exp.split.yanina === 0;
    case 'yanina':
      return exp.split.yanina === 100 && exp.split.wilson === 0;
    case 'shared':
      return isSharedExpense(exp);
    case 'all':
    default:
      return true;
  }
}

const MONTHS_ES_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function monthLabel(year, month) {
  return `${MONTHS_ES_FULL[month]} ${year}`;
}

export function monthWord(year, month) {
  return MONTHS_ES_FULL[month].toLowerCase();
}

// Últimos N períodos (mes/año) terminando en el actual, más nuevo primero.
export function recentPeriods(count = 2) {
  const now = new Date();
  const periods = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return periods;
}
