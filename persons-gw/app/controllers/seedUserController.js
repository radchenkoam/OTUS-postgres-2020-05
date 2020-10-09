import pool from '../db/dev/pool.js';
import {
    hashPassword,
  } from '../helpers/validation.js';
import {
  status,
} from '../helpers/status.js';
/**
   * Create A User
   * @param {object} req
   * @param {object} res
   * @returns {object} reflection object
   */
const seedUser = async (req, res) => {
  const seedUserQuery = `insert into public.users values \
  ( default, 'radchenkoam@gmail.com', 'Andrey', 'Radchenko', '${hashPassword('DruM@Ba$E')}', true, NOW());`;

  console.log(`insert into public.users values \
  ( default, 'radchenkoam@gmail.com', 'Andrey', 'Radchenko', '${hashPassword('DruM@Ba$E')}', true, NOW());`);

  try {
    const { rows } = await pool.query(seedUserQuery);
    console.log(pool);
    const dbResponse = rows;
    if (!dbResponse) {
      return res.status(status.bad).send('Seeding Was not Successful');
    }
    return res.status(status.created).send('Seeding Users table Was Successful');
  } catch (error) {
    return res.status(status.error).send('An Error occured try later');
  }
};

export default seedUser;