/* Creates table public.persons */
create table if not exists public.persons (
  id serial primary key,
  "name" text not null,
  age integer not null,
  created_on timestamptz not null default current_timestamp
);