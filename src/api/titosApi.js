// Cliente HTTP hacia el Google Apps Script Web App (backend de TITOS).
// Todo va por POST, sin header Content-Type explícito: el browser setea
// "text/plain;charset=UTF-8" (CORS-safelisted) y nunca dispara un preflight
// OPTIONS, que los Web Apps de Apps Script no manejan. El body es JSON crudo,
// parseado del lado del servidor con JSON.parse(e.postData.contents).

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;

async function callApi(action, params, credential) {
  if (!SCRIPT_URL) throw new Error('Falta configurar VITE_SCRIPT_URL.');
  let res;
  try {
    res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action, credential, ...params }),
      redirect: 'follow',
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisá tu conexión.');
  }
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error('Respuesta inválida del servidor.');
  }
  if (!json.success) throw new Error(json.error || 'Error desconocido.');
  return json;
}

export const titosApi = {
  getData: (credential) => callApi('getData', {}, credential),
  addExpense: (credential, expense) => callApi('addExpense', { expense }, credential),
  settleUp: (credential) => callApi('settleUp', {}, credential),
  settleExpense: (credential, expenseId) => callApi('settleExpense', { expenseId }, credential),
};
