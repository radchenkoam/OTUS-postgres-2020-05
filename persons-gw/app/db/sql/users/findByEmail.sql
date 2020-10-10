select id, email, first_name, last_name, password, creared_on 
from public.users 
where email = ${email}