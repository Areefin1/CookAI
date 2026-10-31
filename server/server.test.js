const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./server');
const token = 'a'.repeat(48);
const valid = { ingredients: 'rice, garlic', mealType: 'Dinner', cuisine: 'Italian', cookingTime: '30-60 minutes', complexity: 'Beginner' };
async function fixture(t, options = {}) {
  const calls = [];
  const client = { chat: { completions: { create: async data => { calls.push(data); return { choices: [{ message: { content: 'A recipe' } }] }; } } } };
  const app = createApp({ apiKey: 'test-only', accessToken: token, client, ...options });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const send = (body = valid, headers = {}) => fetch(`http://127.0.0.1:${server.address().port}/recipe`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
  return { send, calls };
}
test('startup requires credentials', () => {
  assert.throws(() => createApp({ apiKey: '', accessToken: '' }));
  assert.throws(() => createApp({ apiKey: 'test', accessToken: 'short' }));
});
test('authorized requests have bounded output and separated user data', async t => {
  const {send, calls} = await fixture(t);
  const res = await send(valid, { Origin: 'http://localhost:3002' });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:3002');
  assert.deepEqual(await res.json(), { recipe: 'A recipe' });
  assert.equal(calls[0].model, 'gpt-6-luna');
  assert.equal(calls[0].reasoning_effort, 'none');
  assert.equal(calls[0].max_completion_tokens, 1000);
  assert.equal('max_tokens' in calls[0], false);
  assert.equal('temperature' in calls[0], false);
  assert.equal(calls[0].messages[1].role, 'user');
});
test('missing/incorrect credentials and disallowed origins never call OpenAI', async t => {
  const {send, calls} = await fixture(t);
  assert.equal((await send(valid, { Authorization: '' })).status, 401);
  assert.equal((await send(valid, { Authorization: 'Bearer wrong' })).status, 401);
  assert.equal((await send(valid, { Origin: 'https://untrusted.example' })).status, 403);
  assert.equal(calls.length, 0);
});
test('rejects invalid types, enum values, lengths, extra fields and malformed JSON', async t => {
  const {send, calls} = await fixture(t);
  for (const body of [[], null, {}, {...valid, ingredients: {}}, {...valid, ingredients: ' '}, {...valid, cuisine: 'x'.repeat(101)}, {...valid, complexity: 'expert'}, {...valid, unexpected: 'x'}, '{']) {
    assert.equal((await send(body === null ? 'null' : body)).status, 400);
  }
  assert.equal((await send('x'.repeat(9000))).status, 413);
  assert.equal((await send(valid, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal(calls.length, 0);
});
test('global request budget rejects excess requests and resets', async t => {
  let time = 0;
  const {send} = await fixture(t, {requestLimit: 1, now: () => time});
  assert.equal((await send()).status, 200);
  const limited = await send();
  assert.equal(limited.status, 429);
  assert.ok(limited.headers.get('retry-after'));
  time = 60001;
  assert.equal((await send()).status, 200);
});
test('generation budget prevents extra provider calls', async t => {
  const {send, calls} = await fixture(t, {generationLimit: 1});
  assert.equal((await send()).status, 200);
  assert.equal((await send()).status, 429);
  assert.equal(calls.length, 1);
});
test('provider errors return generic responses', async t => {
  const client = {chat: {completions: {create: async () => { throw new Error('sensitive provider details'); }}}};
  const {send} = await fixture(t, {client});
  const res = await send();
  assert.equal(res.status, 502);
  assert.deepEqual(await res.json(), {error: 'Failed to generate recipe'});
});
