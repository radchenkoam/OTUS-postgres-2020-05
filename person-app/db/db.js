import env from '../../env.js'
const promise = require('bluebird')
const pgPromise = require('pg-promise')
const { Users, Products } = require('./repos')

const initOptions = {
  promiseLib: promise,
  extend (obj, dc) {
    obj.users = new Users(obj, pgp)
    obj.products = new Products(obj, pgp)
  }
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