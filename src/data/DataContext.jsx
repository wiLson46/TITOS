import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { titosApi } from '../api/titosApi';
import { useAuth } from '../auth/AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { credential, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const applyDataset = (json) => {
    setCategories(json.categories || []);
    setExpenses(json.expenses || []);
  };

  const refetch = useCallback(async () => {
    if (!credential) return;
    setLoading(true);
    setError(null);
    try {
      const json = await titosApi.getData(credential);
      applyDataset(json);
    } catch (err) {
      const msg = err.message || 'Error al cargar los datos.';
      setError(msg);
      if (msg.toLowerCase().includes('autorizado') || msg.toLowerCase().includes('sesión')) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [credential, logout]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addExpense = useCallback(
    async (expense) => {
      const json = await titosApi.addExpense(credential, expense);
      applyDataset(json);
    },
    [credential]
  );

  const updateCategoryDefaultSplit = useCallback(
    async (categoryId, split) => {
      const json = await titosApi.updateCategoryDefaultSplit(credential, categoryId, split);
      applyDataset(json);
    },
    [credential]
  );

  const settleUp = useCallback(async () => {
    const json = await titosApi.settleUp(credential);
    applyDataset(json);
  }, [credential]);

  return (
    <DataContext.Provider
      value={{ categories, expenses, loading, error, refetch, addExpense, updateCategoryDefaultSplit, settleUp }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
