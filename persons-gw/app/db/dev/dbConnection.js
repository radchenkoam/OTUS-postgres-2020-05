//app/db/dev/dbConnection.js
import pool from './pool';

pool.on('connect', () => {
  console.log('connected to the db');
});


/**
 * Create Users Table
 */
const createUsersTable = () => {
  const usersCreateQuery = `create table if not exists public.users
  (id serial primary key, 
  email varchar(100) unique not null, 
  first_name varchar(100), 
  last_name varchar(100), 
  password varchar(100) not null,
  created_on date not null default current_timestamp)`;

  pool.query(usersCreateQuery)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
};


/**
 * Create Persons Table
 */
const createPersonsTable = () => {
  const personsCreateQuery = `create table if not exists public.persons
    (id serial primary key,
    name varchar(150) not null,
    age integer not null,
    created_on timestamptz not null default current_timestamp)`;

  pool.query(personsCreateQuery)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
};


/**
 * Drop Users Table
 */
const dropUsersTable = () => {
  const usersDropQuery = 'drop table if exists public.users';
  pool.query(usersDropQuery)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
};


/**
 * Drop Persons Table
 */
const dropPersonsTable = () => {
  const personsDropQuery = 'drop table if exists public.persons';
  pool.query(personsDropQuery)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
};


/**
 * Create All Tables
 */
const createAllTables = () => {
  createUsersTable();
  createPersonsTable();
};


/**
 * Drop All Tables
 */
const dropAllTables = () => {
  dropUsersTable();
  dropPersonsTable();
};


pool.on('remove', () => {
  console.log('client removed');
  process.exit(0);
});


export {
  createAllTables,
  dropAllTables,
};


require('make-runnable');