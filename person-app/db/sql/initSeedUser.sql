insert into public.users 
  (email, "name", "password", is_admin)
values 
  ('api_master@person.gw', 'Master', 'API', ${hashPwd}:value, true)