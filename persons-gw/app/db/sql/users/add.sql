/* Inserts a new User record. */
insert into public.users 
  (email, first_name, last_name, password, is_admin, created_on)
values 
  (${email}, ${firstName}, ${lastName}, ${hashPwd}, ${isAdmin} || default, ${createdOn}) 
returning *