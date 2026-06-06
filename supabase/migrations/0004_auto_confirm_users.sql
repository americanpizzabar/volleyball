-- 新規登録ユーザーを自動的にメール確認済みにする（部活用：確認メールを不要に）。
-- これにより「Confirm email」の設定に関わらず、登録直後にログインできる。
create or replace function public.auto_confirm_email()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists auto_confirm_email on auth.users;
create trigger auto_confirm_email
  before insert on auth.users
  for each row execute function public.auto_confirm_email();
