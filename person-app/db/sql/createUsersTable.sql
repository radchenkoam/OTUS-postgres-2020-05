/* Creates table public.users */
create table if not exists public.users (
  id serial primary key, 
  email text unique not null, 
  "name" text not null, 
  "password" text not null,
  is_admin boolean not null default false, 
  created_on date not null default current_timestamp
)