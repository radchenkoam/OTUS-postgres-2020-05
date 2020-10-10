select id, email, firstName, lastName, password, isAdmin, createdOn 
from public.users 
where first_name = ${fistName} OR last_name = ${lastName} 
order by id