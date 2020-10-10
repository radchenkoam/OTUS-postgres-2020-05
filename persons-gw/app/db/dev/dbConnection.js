// app/db/dev/dbConnection.js
import pool from './pool.js'

pool.on('connect', () => {
  console.log('connected to the db')
})

/** Create Users Table
 */
const createUsersTable = (req, res) => {
  const usersCreateQuery = `create table if not exists public.users
  (id serial primary key, 
  email varchar(100) unique not null, 
  first_name varchar(100), 
  last_name varchar(100), 
  password varchar(100) not null,
  is_admin boolean not null, 
  created_on date not null default current_timestamp);`

  try {
    const { rows } = pool.query(usersCreateQuery)
      .then(res => console.log(res))
      .catch(err => console.error('Executing query', err.stack))

    const dbResponse = rows
    if (!dbResponse) {
      return res.status(status.bad).send('Create Users table Was not Successful')
    }
    return res.status(status.created).send('Users table created Successful')
  } catch (error) {
    return res.status(status.error).send('An Error occured try later')
  }
}

/** Create Persons Table
 */
const createPersonsTable = (req, res) => {
  const personsCreateQuery = `create table if not exists public.persons
    (id serial primary key,
    name varchar(150) not null,
    age integer not null,
    created_on timestamptz not null default current_timestamp);`

  try {
    const { rows } = pool.query(personsCreateQuery)
      .then(res => console.log(res))
      .catch(err => console.error('Executing query', err.stack))

    const dbResponse = rows
    if (!dbResponse) {
      return res.status(status.bad).send('Create Persons table Was not Successful')
    }
    return res.status(status.created).send('Persons table created Successful')
  } catch (error) {
    return res.status(status.error).send('An Error occured try later')
  }
}

/** Drop Users Table
 */
const dropUsersTable = (req, res) => {
  const usersDropQuery = 'drop table if exists public.users;'

  try {
    const { rows } = pool.query(usersDropQuery)
      .then(res => console.log(res))
      .catch(err => console.error('Executing query', err.stack))

    const dbResponse = rows
    if (!dbResponse) {
      return res.status(status.bad).send('Drop Users table Was not Successful')
    }
    return res.status(status.created).send('Users table dropped Successful')
  } catch (error) {
    return res.status(status.error).send('An Error occured try later')
  }
}

/** Drop Persons Table
 */
const dropPersonsTable = (req, res) => {
  const personsDropQuery = 'drop table if exists public.persons;'

  try {
    const { rows } = pool.query(personsDropQuery)
      .then(res => console.log(res))
      .catch(err => console.error('Executing query', err.stack))

    const dbResponse = rows
    if (!dbResponse) {
      return res.status(status.bad).send('Drop Persons table Was not Successful')
    }
    return res.status(status.created).send('Persons table dropped Successful')
  } catch (error) {
    return res.status(status.error).send('An Error occured try later')
  }
}

/** Create All Tables
 */
const createAllTables = () => {
  createUsersTable()
  createPersonsTable()
}

/** Drop All Tables
 */
const dropAllTables = () => {
  dropUsersTable()
  dropPersonsTable()
}

pool.on('remove', () => {
  console.log('client removed')
  process.exit(0)
})

export {
  createAllTables,
  dropAllTables
}

// require('make-runnable');
