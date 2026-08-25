const SUPABASE_URL = 'https://bccymgcmmqcpaudjhknv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TI1VW_NeWtIzZ6SRFkYXDw_XXQrOFHP';
const SESSION_KEY = 'fluencyai.auth.session.v1';

function authHeaders(token, extra = {}) {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${token || SUPABASE_KEY}`, 'Content-Type': 'application/json', ...extra };
}
async function request(path, options = {}) {
  let response;
  try { response = await fetch(`${SUPABASE_URL}${path}`, options); }
  catch { throw new Error('Sem conexão. Verifique sua internet e tente novamente.'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.msg || data.message || data.error_description || 'Não foi possível concluir a solicitação.';
    const translations = {
      'Invalid login credentials': 'E-mail ou senha incorretos.',
      'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
      'User already registered': 'Este e-mail já está cadastrado.',
      'Password should be at least 6 characters.': 'A senha não atende aos requisitos de segurança.'
    };
    throw new Error(translations[message] || message);
  }
  return data;
}
function persist(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  return session;
}
async function refresh(session) {
  const data = await request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ refresh_token: session.refresh_token }) });
  return persist(data);
}
async function getSession() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (params.get('access_token')) {
    const session = { access_token: params.get('access_token'), refresh_token: params.get('refresh_token'), expires_at: Math.floor(Date.now()/1000) + Number(params.get('expires_in') || 3600), user: null };
    session.user = await request('/auth/v1/user', { headers: authHeaders(session.access_token) });
    persist(session);
    history.replaceState(null, '', location.pathname + (params.get('type') === 'recovery' ? '#redefinir-senha' : '#dashboard'));
    return { session, recovery: params.get('type') === 'recovery' };
  }
  let session;
  try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { persist(null); }
  if (!session) return { session: null, recovery: false };
  try {
    if (!session.expires_at || session.expires_at <= Math.floor(Date.now()/1000) + 30) session = await refresh(session);
    if (!session.user) session.user = await request('/auth/v1/user', { headers: authHeaders(session.access_token) });
    persist(session);
    return { session, recovery: false };
  } catch { persist(null); return { session: null, recovery: false }; }
}
const authService = {
  SESSION_KEY,
  getSession,
  signUp: async ({ name, email, password }) => request('/auth/v1/signup', { method:'POST', headers:authHeaders(), body:JSON.stringify({ email, password, data:{ name }, options:{ emailRedirectTo: `${location.origin}${location.pathname}` } }) }),
  signIn: async ({ email, password }) => persist(await request('/auth/v1/token?grant_type=password', { method:'POST', headers:authHeaders(), body:JSON.stringify({ email, password }) })),
  recover: email => request('/auth/v1/recover', { method:'POST', headers:authHeaders(), body:JSON.stringify({ email, redirect_to:`${location.origin}${location.pathname}` }) }),
  updatePassword: (password, token) => request('/auth/v1/user', { method:'PUT', headers:authHeaders(token), body:JSON.stringify({ password }) }),
  signOut: async session => { try { await request('/auth/v1/logout', { method:'POST', headers:authHeaders(session.access_token) }); } finally { persist(null); } },
  loadProgress: async session => {
    const rows = await request('/rest/v1/student_progress?select=profile,progress&user_id=eq.' + encodeURIComponent(session.user.id), { headers:authHeaders(session.access_token) });
    return rows[0] || null;
  },
  saveProgress: (session, profile, progress) => request('/rest/v1/student_progress?on_conflict=user_id', { method:'POST', headers:authHeaders(session.access_token, { Prefer:'resolution=merge-duplicates,return=minimal' }), body:JSON.stringify({ user_id:session.user.id, profile, progress }) })
};
window.authService = authService;
