// app/db/dev/pool.js
import env from '../../../env.js'

const { Pool } = require('pg')

const pool = new Pool({
  user: env.user,
  host: env.host,
  database: env.database,
  password: env.password,
  port: env.port,
  max: 100,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

export default pool
