//app/db/dev/pool.js
import pkg from 'pg';
import env from '../../../env.js';

const { Pool } = pkg;

const databaseConfig = { connectionString: env.database_url };
console.log(env.database_url);
console.log(databaseConfig);
const pool = new Pool(databaseConfig);
console.log(pool);
export default pool;