//app/db/dev/pool.js
import pkg from 'pg';
const { Pool } = pkg;
import env from '../../../env.js';

const databaseConfig = { connectionString: env.database_url };
const pool = new Pool(databaseConfig);

export default pool;