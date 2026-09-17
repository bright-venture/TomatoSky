-- Run once in the Supabase SQL Editor, after the earlier migrations.
-- Introduces a second role ('staff') and lets both roles use the portal, while
-- Administration stays admin-only (enforced in the app via requireAdmin()).
-- Contains no credentials.
begin;

-- Allow 'staff' in addition to 'admin'. New members default to the lower role.
alter table public.portal_members drop constraint portal_members_role_check;
alter table public.portal_members add constraint portal_members_role_check check (role in ('admin', 'staff'));
alter table public.portal_members alter column role set default 'staff';

-- Portal access (brands, folders) now covers both roles; still requires MFA + active.
create or replace function public.has_portal_access()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt()->>'aal') = 'aal2', false)
    and exists (
      select 1 from public.portal_members
      where user_id = (select auth.uid())
        and active = true and role in ('admin', 'staff')
    );
$$;

commit;
