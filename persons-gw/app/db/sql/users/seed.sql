insert into public.users 
  (email, first_name, last_name, password, is_admin, created_on)
values 
  ('api_master@person.gw', 'Master', 'API', ${hashPwd}, true, current_timestamp)