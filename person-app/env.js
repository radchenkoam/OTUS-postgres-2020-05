import dotenv from 'dotenv'
dotenv.config()

export default {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port_api: process.env.PORT || 5000,
  secret: process.env.SECRET
}