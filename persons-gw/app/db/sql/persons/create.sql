/* Creates table Persons. */
create table if not exists public.persons (
  id serial primary key,
  name varchar(200) not null,
  age integer not null,
  created_on timestamptz not null default current_timestamp
);