const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:3333').replace(/\/$/, '');

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error(`Não foi possível conectar ao backend em ${API_URL}. Confira se ele está rodando e se EXPO_PUBLIC_API_URL aponta para o computador correto.`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a solicitação.');
  return data;
}

export { API_URL };
