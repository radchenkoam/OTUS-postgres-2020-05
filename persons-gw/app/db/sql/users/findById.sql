select id, email, firstName, lastName, password, isAdmin, createdOn 
from public.users
where id = ${id}