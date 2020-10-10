/* Creates table Users. */
create table if not exists public.users (
  id serial primary key, 
  email varchar(100) unique not null, 
  first_name varchar(100), 
  last_name varchar(100), 
  password varchar(100) not null,
  is_admin boolean not null default false, 
  created_on date not null default current_timestamp
)