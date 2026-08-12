import { useEffect, useRef, useState } from 'react';
import { useAuth } from './auth/AuthContext';
import LoginScreen from './auth/LoginScreen';
import { DataProvider, useData } from './data/DataContext';
import { EMAIL_TO_PERSON } from './data/titosData';
import TabBar from './components/TabBar';
import UserMenu from './components/UserMenu';
import AddExpenseModal from './components/AddExpenseModal';
import InicioTab from './components/tabs/InicioTab';
import HistorialTab from './components/tabs/HistorialTab';
import DividirTab from './components/tabs/DividirTab';
import MetricasTab from './components/tabs/MetricasTab';

function UnauthorizedScreen({ message, onLogout }) {
  return (
    <div className="unauthorized-screen">
      <img src={`${import.meta.env.BASE_URL}logo-red.svg`} alt="" style={{ width: 44, height: 44 }} />
      <div style={{ fontWeight: 700, fontSize: 18 }}>Email no autorizado</div>
      <div style={{ fontSize: 13.5, color: '#4A4F5B', maxWidth: 280 }}>
        {message || 'Esta cuenta no tiene acceso a TITOS.'}
      </div>
      <button onClick={onLogout}>Probar con otra cuenta</button>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="toast-wrap">
      <div className="toast">{msg}</div>
    </div>
  );
}

function AppShell() {
  const { user, logout } = useAuth();
  const { categories, expenses, loading, error, addExpense, settleUp, settleExpense } = useData();
  const [tab, setTab] = useState('inicio');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1600);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  if (error) {
    return <UnauthorizedScreen message={error} onLogout={logout} />;
  }

  if (loading && categories.length === 0) {
    return <div className="empty-state" style={{ paddingTop: 120 }}>Cargando…</div>;
  }

  const viewer = EMAIL_TO_PERSON[user.email] || null;

  const handleAddExpense = async (expense) => {
    await addExpense(expense);
    setModalOpen(false);
    showToast('Gasto agregado');
  };

  const handleSettleUp = async () => {
    setBusy(true);
    try {
      await settleUp();
      showToast('¡Liquidado!');
    } finally {
      setBusy(false);
    }
  };

  const handleSettleExpense = async (expenseId) => {
    await settleExpense(expenseId);
    showToast('Gasto liquidado');
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="topbar-brand">
          <img src={`${import.meta.env.BASE_URL}logo-red.svg`} alt="" />
          <span>(gas)TITOS by Wild Ideas</span>
        </div>
        <UserMenu viewer={viewer} email={user.email} onLogout={logout} />
      </div>

      <Toast msg={toast} />

      {tab === 'inicio' && (
        <InicioTab
          categories={categories} expenses={expenses} viewer={viewer}
          onGoDividir={() => setTab('dividir')} onGoMetricas={() => setTab('metricas')}
        />
      )}
      {tab === 'historial' && <HistorialTab categories={categories} expenses={expenses} />}
      {tab === 'dividir' && (
        <DividirTab
          categories={categories} expenses={expenses} viewer={viewer}
          onSettleUp={handleSettleUp} onSettleExpense={handleSettleExpense} busy={busy}
        />
      )}
      {tab === 'metricas' && <MetricasTab categories={categories} expenses={expenses} />}

      <div style={{ flex: 1 }} />
      <TabBar tab={tab} onTab={setTab} onFab={() => setModalOpen(true)} />

      {modalOpen && (
        <AddExpenseModal
          categories={categories}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAddExpense}
        />
      )}
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  if (!user) return <LoginScreen />;

  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}
