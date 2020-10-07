//app/db/dev/pool.js
import pkg from 'pg';
import env from '../../../env.js';

const { Pool } = pkg;

const databaseConfig = { connectionString: env.database_url };
const pool = new Pool(databaseConfig);

export default pool;