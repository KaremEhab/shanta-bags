const crypto = require('node:crypto');
const OWNER_ID = 130329660;
const REPO = 'KaremEhab/shanta-bags';
const COOKIE = '__Host-shanta-owner';
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
function key() {
  const value = process.env.OWNER_SESSION_KEY;
  if (!value || !/^[a-f0-9]{64}$/.test(value)) throw new HttpError(503, 'Owner access is not configured.');
  return Buffer.from(value, 'hex');
}
function seal(token) {
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify({token, expires: Date.now() + 8*3600*1000})), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}
function unseal(value) {
  try {
    const bytes = Buffer.from(value, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), bytes.subarray(0,12));
    decipher.setAuthTag(bytes.subarray(12,28));
    const data = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString());
    return data.expires > Date.now() && typeof data.token === 'string' ? data.token : null;
  } catch { return null; }
}
function setCookie(res, value, maxAge = 28800) {
  res.setHeader('Set-Cookie', `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`);
}
function tokenFrom(req) {
  const value = (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));
  return value ? unseal(value.slice(COOKIE.length+1)) : null;
}
async function github(token, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options, headers: {Accept:'application/vnd.github+json', Authorization:`Bearer ${token}`, 'X-GitHub-Api-Version':'2022-11-28', 'Content-Type':'application/json', ...options.headers}, signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    if (response.status === 409 || response.status === 422) throw new HttpError(409, 'The catalog changed in another tab. Reload before saving again.');
    if (response.status === 401) throw new HttpError(401, 'Your GitHub token expired or was revoked. Sign in again.');
    if (response.status === 403 || response.status === 404) throw new HttpError(403, 'Check your token: select shanta-bags and give Contents read and write permission. GitHub may also be rate limiting requests.');
    throw new HttpError(502, 'GitHub is temporarily unavailable. Please try again.');
  }
  return response.json();
}
async function verifyOwner(token) {
  if (!token || token.length > 500 || /\s/.test(token)) throw new HttpError(401, 'Sign in with your GitHub token.');
  const user = await github(token, '/user');
  if (user.id !== OWNER_ID) throw new HttpError(403, 'Access is restricted to the store owner.');
  return token;
}
async function requireOwner(req) { return verifyOwner(tokenFrom(req)); }
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (origin !== 'https://shanta-bags.vercel.app') throw new HttpError(403, 'Request origin is not allowed. Use the production owner page.');
}
function privateHeaders(res) {
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https: blob: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
}
function fail(res, error) {
  if (!error.status) console.error('Owner request failed:', error.name);
  return res.status(error.status || 500).json({error:error.status ? error.message : 'Something went wrong. Please try again.'});
}
module.exports = {OWNER_ID, REPO, HttpError, seal, unseal, setCookie, tokenFrom, github, verifyOwner, requireOwner, sameOrigin, privateHeaders, fail};
