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
    await db.exec(await readFile(new URL('../supabase/migrations/202609170001_portal_folders.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/202609170002_roles_and_admin.sql', import.meta.url), 'utf8'));
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
    await t.test('approved MFA employee creates, renames, and deletes folders', async () => {
      await asUser(alice, 'aal2');
      const id = (await db.query("insert into public.portal_folders (module, name) values ('documents', 'Contracts') returning id")).rows[0].id;
      assert.equal((await db.query('select name from public.portal_folders where id = $1', [id])).rows[0].name, 'Contracts');
      await db.query("update public.portal_folders set name = 'Signed contracts' where id = $1", [id]);
      assert.equal((await db.query('select name from public.portal_folders where id = $1', [id])).rows[0].name, 'Signed contracts');
      await db.query('delete from public.portal_folders where id = $1', [id]);
      assert.equal((await db.query('select * from public.portal_folders')).rows.length, 0);
    });
    await t.test('deleting a folder cascades to its subfolders', async () => {
      await asUser(alice, 'aal2');
      const parent = (await db.query("insert into public.portal_folders (module, name) values ('inventory', 'Warehouse A') returning id")).rows[0].id;
      await db.query("insert into public.portal_folders (module, name, parent_id) values ('inventory', 'Shelf 1', $1)", [parent]);
      assert.equal((await db.query('select * from public.portal_folders')).rows.length, 2);
      await db.query('delete from public.portal_folders where id = $1', [parent]);
      assert.equal((await db.query('select * from public.portal_folders')).rows.length, 0);
    });
    await t.test('anonymous and password-only users cannot access folders', async () => {
      await asUser(null, null, 'anon');
      await assert.rejects(db.query('select * from public.portal_folders'), /permission denied/);
      await asUser(alice, 'aal1');
      assert.equal((await db.query('select * from public.portal_folders')).rows.length, 0);
      await assert.rejects(db.query("insert into public.portal_folders (module, name) values ('reports', 'Blocked')"), /row-level security/);
    });
    await t.test('unapproved MFA user cannot create folders', async () => {
      await asUser(outsider, 'aal2');
      await assert.rejects(db.query("insert into public.portal_folders (module, name) values ('documents', 'Blocked')"), /row-level security/);
    });
    await t.test('the module check constraint rejects unknown modules', async () => {
      await asUser(alice, 'aal2');
      await assert.rejects(db.query("insert into public.portal_folders (module, name) values ('payroll', 'Nope')"), /violates check constraint/);
    });
    await t.test('a staff member with MFA can use the portal and folders', async () => {
      await db.exec('reset role');
      const staff = '00000000-0000-0000-0000-000000000005';
      await db.query('insert into auth.users values ($1, $2)', [staff, 'staff@example.invalid']);
      await db.query("insert into public.portal_members (user_id, display_name, role, active) values ($1, 'Staff member', 'staff', true)", [staff]);
      await asUser(staff, 'aal2');
      assert.equal((await db.query('select * from public.brands')).rows.length, 2);
      await db.query("insert into public.portal_folders (module, name) values ('documents', 'Staff folder')");
      assert.equal((await db.query("select * from public.portal_folders where name = 'Staff folder'")).rows.length, 1);
      await db.query("delete from public.portal_folders where name = 'Staff folder'");
    });
    await t.test('the role check constraint allows admin/staff and rejects others', async () => {
      await db.exec('reset role');
      const ghost = '00000000-0000-0000-0000-000000000006';
      await db.query('insert into auth.users values ($1, $2)', [ghost, 'ghost@example.invalid']);
      await assert.rejects(db.query("insert into public.portal_members (user_id, display_name, role) values ($1, 'Ghost', 'guest')", [ghost]), /violates check constraint/);
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
