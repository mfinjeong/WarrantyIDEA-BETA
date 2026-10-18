import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import test from 'node:test';

const base = process.env.API_BASE_URL || 'http://127.0.0.1:3000';
const url = new URL(base);
if (url.hostname !== '127.0.0.1' || process.env.ALLOW_ISOLATED_HTTP_TESTS !== '1') {
  throw new Error('HTTP write tests require ALLOW_ISOLATED_HTTP_TESTS=1 and a loopback API_BASE_URL. Never run against production.');
}
const database = new URL(process.env.DATABASE_URL || 'postgresql://unset/unset');
if (database.hostname !== '127.0.0.1' || database.port !== '55432' || database.pathname !== '/warrantyidea_test') {
  throw new Error('Expected the isolated warrantyidea_test database on loopback port 55432.');
}

class Client {
  cookies = new Map();
  lastSetCookies = [];
  async request(path, method = 'GET', body) {
    const headers = { Origin: base };
    if (this.cookies.size) headers.Cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(new URL(path, base), {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual',
    });
    this.lastSetCookies = response.headers.getSetCookie();
    for (const cookie of this.lastSetCookies) {
      const pair = cookie.split(';')[0];
      const at = pair.indexOf('=');
      if (at > 0) {
        const name = pair.slice(0, at);
        const value = pair.slice(at + 1);
        if (!value || /max-age=0(?:;|$)/i.test(cookie)) this.cookies.delete(name);
        else this.cookies.set(name, value);
      }
    }
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { nonJson: text.slice(0, 200) }; }
    return { status: response.status, body: data, response, text };
  }
}
function data(result, status = 200) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  assert.ok('data' in result.body, JSON.stringify(result.body));
  return result.body.data;
}
function failure(result, status) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  assert.equal(typeof result.body.error?.message, 'string');
  assert.equal(typeof result.body.error?.code, 'string');
  assert.ok(!JSON.stringify(result.body).includes('postgresql://'));
}

await test('real HTTP auth, persistence, authorization and owner isolation', async (t) => {
  const anon = new Client();
  const alice = new Client();
  const bob = new Client();
  const suffix = randomUUID();
  const password = randomBytes(24).toString('base64url');
  const email = `alice-${suffix}@example.test`;
  let id;
  const input = {
    productName: 'HTTP Test Laptop', brand: 'Test Brand', model: 'Model Alpha',
    category: 'electronics', serialNumber: `SERIAL-${suffix}`, store: 'Isolated Test Store',
    purchaseDate: '2025-01-01', expiryDate: '2099-12-31', price: 2499000, notes: 'Generated integration test record',
  };
  await t.test('unauthenticated APIs return structured 401 and pages redirect', async () => {
    failure(await anon.request('/api/warranties'), 401);
    failure(await anon.request('/api/workspace'), 401);
    const page = await anon.request('/app');
    if (page.status === 200) {
      // App Router may stream the shell before the server layout redirects.
      assert.match(page.text, /<meta[^>]+http-equiv="refresh"[^>]+url=\/login/);
    } else {
      assert.ok([302, 303, 307, 308].includes(page.status));
      assert.ok(page.response.headers.get('location')?.includes('/login'));
    }
  });
  await t.test('registration rejects weak passwords and invalid email', async () => {
    const weak = await anon.request('/api/auth/sign-up/email', 'POST', { name: 'Weak User', email: `weak-${suffix}@example.test`, password: 'short' });
    assert.ok(weak.status >= 400 && weak.status < 500);
    const invalid = await anon.request('/api/auth/sign-up/email', 'POST', { name: 'Bad Email', email: 'not-email', password });
    assert.ok(invalid.status >= 400 && invalid.status < 500);
  });
  await t.test('registration creates real sessions, not an admin role from input', async () => {
    const a = await alice.request('/api/auth/sign-up/email', 'POST', { name: 'Alice Integration', email, password });
    assert.ok([200, 201].includes(a.status), JSON.stringify(a.body));
    assert.ok(alice.cookies.size > 0);
    assert.ok(alice.lastSetCookies.some((c) => /httponly/i.test(c) && /samesite=lax/i.test(c)));
    const b = await bob.request('/api/auth/sign-up/email', 'POST', { name: 'Bob Integration', email: `bob-${suffix}@example.test`, password, role: 'admin' });
    if (b.status >= 400) {
      const retry = await bob.request('/api/auth/sign-up/email', 'POST', { name: 'Bob Integration', email: `bob-${suffix}@example.test`, password });
      assert.ok([200, 201].includes(retry.status), JSON.stringify(retry.body));
    }
    failure(await bob.request('/api/workspace?scope=admin'), 403);
    const workspace = data(await bob.request('/api/workspace?scope=buyer'));
    assert.equal(workspace.profile.role, 'buyer');
    assert.equal(workspace.warranties.length, 0);
  });
  await t.test('server input validation rejects invalid warranty and forged ownership', async () => {
    failure(await alice.request('/api/warranties', 'POST', { ...input, expiryDate: '2024-02-30' }), 400);
    failure(await alice.request('/api/warranties', 'POST', { ...input, ownerId: 'another-user' }), 400);
    failure(await alice.request('/api/warranties', 'POST', { ...input, price: -1 }), 400);
  });
  await t.test('create warranty and reject duplicate serial for same owner', async () => {
    const created = data(await alice.request('/api/warranties', 'POST', input), 201);
    id = created.id;
    assert.equal(created.productName, input.productName);
    assert.equal(created.purchaseDate, input.purchaseDate);
    assert.equal(created.expiryDate, input.expiryDate);
    assert.equal(created.price, input.price);
    failure(await alice.request('/api/warranties', 'POST', { ...input, serialNumber: input.serialNumber.toLowerCase() }), 409);
  });
  await t.test('search, filters, sorting and pagination are database-backed', async () => {
    assert.ok(id);
    const list = data(await alice.request('/api/warranties?q=HTTP%20Test&status=active&category=electronics&sort=name&page=1&pageSize=1'));
    assert.equal(list.total, 1);
    assert.equal(list.items[0].id, id);
    assert.equal(list.pageSize, 1);
    assert.equal(data(await alice.request('/api/warranties?status=expired')).total, 0);
    failure(await alice.request('/api/warranties?page=garbage'), 400);
    failure(await alice.request('/api/warranties?sort=invalid'), 400);
    const stats = data(await alice.request('/api/dashboard'));
    assert.equal(stats.total, 1);
    assert.equal(stats.active, 1);
  });
  await t.test('another user cannot read, update, delete, search or count owner data', async () => {
    assert.ok(id);
    failure(await bob.request(`/api/warranties/${id}`), 404);
    failure(await bob.request(`/api/warranties/${id}`, 'PUT', input), 404);
    failure(await bob.request(`/api/warranties/${id}`, 'DELETE'), 404);
    assert.equal(data(await bob.request('/api/warranties')).total, 0);
    assert.equal(data(await bob.request('/api/dashboard')).total, 0);
    failure(await bob.request('/api/catalog', 'POST', { id: '', name: 'Forged Item', brand: 'Brand', model: 'Forged', category: 'electronics', warrantyMonths: 12, active: true }), 403);
    failure(await bob.request(`/api/reviews/${id}`, 'POST', { status: 'approved' }), 403);
  });
  await t.test('update persists and recalculates expiration', async () => {
    assert.ok(id);
    const updated = data(await alice.request(`/api/warranties/${id}`, 'PUT', { ...input, expiryDate: '2025-12-31', notes: 'Updated persisted note' }));
    assert.equal(updated.notes, 'Updated persisted note');
    const reread = data(await alice.request(`/api/warranties/${id}`));
    assert.equal(reread.expiryDate, '2025-12-31');
    assert.equal(data(await alice.request('/api/warranties?status=expired')).total, 1);
    assert.equal(data(await alice.request('/api/dashboard')).expired, 1);
  });
  await t.test('profile settings persist', async () => {
    const profile = data(await alice.request('/api/profile', 'PATCH', { name: 'Alice Updated', reminders: false }));
    assert.equal(profile.name, 'Alice Updated');
    const snapshot = data(await alice.request('/api/workspace'));
    assert.equal(snapshot.profile.reminders, false);
    assert.equal(snapshot.profile.email, email);
  });
  await t.test('untrusted Origin cannot mutate authenticated state', async () => {
    const response = await fetch(new URL('/api/profile', base), { method: 'PATCH', headers: { 'Content-Type': 'application/json', Origin: 'https://attacker.invalid', Cookie: [...alice.cookies].map(([k,v]) => `${k}=${v}`).join('; ') }, body: JSON.stringify({ name: 'Attacker', reminders: true }) });
    assert.equal(response.status, 403);
  });
  await t.test('logout revokes session and login restores database records', async () => {
    const stale = new Client();
    stale.cookies = new Map(alice.cookies);
    const logout = await alice.request('/api/auth/sign-out', 'POST', {});
    assert.equal(logout.status, 200, JSON.stringify(logout.body));
    failure(await stale.request('/api/warranties'), 401);
    const bad = await alice.request('/api/auth/sign-in/email', 'POST', { email, password: randomBytes(24).toString('base64url') });
    assert.ok(bad.status >= 400 && bad.status < 500);
    const login = await alice.request('/api/auth/sign-in/email', 'POST', { email, password });
    assert.equal(login.status, 200, JSON.stringify(login.body));
    assert.equal(data(await alice.request(`/api/warranties/${id}`)).notes, 'Updated persisted note');
  });
  await t.test('owner deletes generated warranty; subsequent reads return 404', async () => {
    assert.ok(id);
    data(await alice.request(`/api/warranties/${id}`, 'DELETE'));
    failure(await alice.request(`/api/warranties/${id}`), 404);
    assert.equal(data(await alice.request('/api/dashboard')).total, 0);
  });
});
