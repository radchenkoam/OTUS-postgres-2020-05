import pool from '../db/dev/pool.js'
import {
  hashPassword
} from '../helpers/validation.js'

pool.on('connect', () => {
  console.log('connected to the db')
})

/** SEED Admin User
 */
const seed = () => {
  const seedUserQuery = `insert into public.users values 
  (default, 'radchenkoam@gmail.com', 'Andrey', 'Radchenko', '${hashPassword('DruM@Ba$E')}', true, NOW());`

  console.log(seedUserQuery)
  pool.query(seedUserQuery)
    .then((res) => {
      console.log(res)
      pool.end()
    })
    .catch((err) => {
      console.log(err)
      pool.end()
    })
}

/** Seed users
 */
const seedUser = () => {
  seed()
}

pool.on('remove', () => {
  console.log('client removed')
  process.exit(0)
})

export { seedUser }

// require('make-runnable')
