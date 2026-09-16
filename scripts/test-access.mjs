import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Test the actual migration in isolated PostgreSQL, with Supabase claim helpers.
// This does not connect to or create users in the live project.
test('portal database permissions', async t => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key, email text);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub', '')::uuid;
      $$;
      create function auth.jwt() returns jsonb language sql stable as $$
        select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
      $$;
      grant usage on schema auth to anon, authenticated;
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/202609160001_portal_foundation.sql', import.meta.url), 'utf8'));
    const alice = '00000000-0000-0000-0000-000000000001';
    const bob = '00000000-0000-0000-0000-000000000002';
    const inactive = '00000000-0000-0000-0000-000000000003';
    const outsider = '00000000-0000-0000-0000-000000000004';
    for (const id of [alice, bob, inactive, outsider]) await db.query('insert into auth.users values ($1, $2)', [id, `${id}@example.invalid`]);
    for (const [id, active] of [[alice, true], [bob, true], [inactive, false]]) await db.query('insert into public.portal_members (user_id, display_name, active) values ($1, $2, $3)', [id, 'Test employee', active]);

    async function asUser(id, aal, role = 'authenticated') {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: id, aal, user_metadata: { role: 'admin' } })]);
      await db.exec(`set role ${role}`);
    }

    await t.test('anonymous visitors cannot read brands or memberships', async () => {
      await asUser(null, null, 'anon');
      await assert.rejects(db.query('select * from public.brands'), /permission denied/);
      await assert.rejects(db.query('select * from public.portal_members'), /permission denied/);
      await assert.rejects(db.query('select public.has_portal_access()'), /permission denied/);
    });
    await t.test('password-only employees see their membership, but no brands', async () => {
      await asUser(alice, 'aal1');
      assert.equal((await db.query('select * from public.portal_members')).rows.length, 1);
      assert.equal((await db.query('select * from public.brands')).rows.length, 0);
    });
    await t.test('approved MFA employee reads the two seeded brands', async () => {
      await asUser(alice, 'aal2');
      assert.deepEqual((await db.query('select name from public.brands order by name')).rows.map(row => row.name), ['Black Beauty Tomato', 'VirginValley']);
    });
    await t.test('employees cannot inspect another membership', async () => {
      await asUser(alice, 'aal2');
      assert.deepEqual((await db.query('select user_id from public.portal_members')).rows.map(row => row.user_id), [alice]);
    });
    await t.test('unapproved MFA user cannot read brands even with admin user_metadata', async () => {
      await asUser(outsider, 'aal2');
      assert.equal((await db.query('select * from public.brands')).rows.length, 0);
      assert.equal((await db.query('select public.has_portal_access() as allowed')).rows[0].allowed, false);
    });
    await t.test('deactivated MFA employee is blocked', async () => {
      await asUser(inactive, 'aal2');
      assert.equal((await db.query('select * from public.brands')).rows.length, 0);
    });
    await t.test('missing MFA claim fails closed', async () => {
      await asUser(alice, undefined);
      assert.equal((await db.query('select * from public.brands')).rows.length, 0);
    });
    await t.test('users cannot self-provision or reactivate memberships', async () => {
      await asUser(outsider, 'aal2');
      await assert.rejects(db.query('insert into public.portal_members (user_id, display_name) values ($1, $2)', [outsider, 'Self promotion']), /permission denied/);
      await asUser(inactive, 'aal2');
      await assert.rejects(db.query('update public.portal_members set active = true'), /permission denied/);
    });
    await t.test('approved users cannot modify membership or brand records via API', async () => {
      await asUser(alice, 'aal2');
      await assert.rejects(db.query('delete from public.portal_members'), /permission denied/);
      await assert.rejects(db.query("update public.brands set name = 'Changed'"), /permission denied/);
    });
    await t.test('deactivation blocks an already issued MFA identity on the next query', async () => {
      await db.exec('reset role');
      await db.query('update public.portal_members set active = false where user_id = $1', [alice]);
      await asUser(alice, 'aal2');
      assert.equal((await db.query('select * from public.brands')).rows.length, 0);
    });
  } finally { await db.close(); }
});
