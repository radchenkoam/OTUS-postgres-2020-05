import env from '../env.js'
import promise from 'bluebird'
import pgPromise from 'pg-promise'
import UsersManager from './models/users.js'
import PersonsManager from './models/persons.js'

const initOptions = {
  promiseLib: promise,
  extend (obj, dc) {
    obj.users = new UsersManager(obj, pgp)
    obj.persons = new PersonsManager(obj, pgp)
  },
  /*query(e) {
    console.log('QUERY:', e.query);
  }*/
}

const pgp = pgPromise(initOptions)

const cn = {
  host: env.host,
  port: env.port,
  database: env.database,
  user: env.user,
  password: env.password,
  max: 50
  // idleTimeoutMillis: 30000,
  // connectionTimeoutMillis: 2000
}

const db = pgp(cn)

export { db, pgp }