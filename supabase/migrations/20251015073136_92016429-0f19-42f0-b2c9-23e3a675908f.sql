-- 1) Ensure conversation creator is auto-added as a participant
create or replace function public.add_creator_as_participant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.conversation_participants (conversation_id, user_id)
  values (new.id, auth.uid());
  return new;
end;
$$;

-- Recreate trigger safely
drop trigger if exists trg_add_creator_participant on public.conversations;
create trigger trg_add_creator_participant
after insert on public.conversations
for each row
execute function public.add_creator_as_participant();

-- 2) Grant owner role to primary account if missing
insert into public.user_roles (user_id, role)
select u.id, 'owner'::app_role
from auth.users u
left join public.user_roles r on r.user_id = u.id and r.role = 'owner'
where u.email = 'richyrachfansgmial@gmail.com'
and r.user_id is null;

-- 3) Update handle for that account to "owner"
update public.profiles p
set handle = 'owner'
where p.user_id = (select id from auth.users where email = 'richyrachfansgmial@gmail.com');