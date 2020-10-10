import moment from 'moment'
import { users as sql } from '../sql'
import {
  hashPassword,
  comparePassword,
  isValidEmail,
  validatePassword,
  isEmpty,
  generateUserToken
} from '../helpers/validation.js'
import {
  errorMessage, successMessage, status
} from '../helpers/status.js'

const cs = {} // Reusable ColumnSet objects.

class UsersRepository {
  constructor (db, pgp) {
    this.db = db
    this.pgp = pgp

    createColumnsets(pgp)
  }

  // Creates the table;
  async create () {
    return this.db.none(sql.create)
  }

  // Drops the table;
  async drop () {
    return this.db.none(sql.drop)
  }

  // Removes all records from the table;
  async empty () {
    return this.db.none(sql.empty)
  }

  // Initializes the table with api_master user record, and return id;
  // hashPassword(env.secret)
  async seed () {
    return this.db.map(sql.seed, [], r => r.id)
  }

  /** Adds a new user, and returns the new object or error
   * @param {*} req
   * @param {*} res
   */
  async add (req, res) {
    const {
      email, firstName, lastName, password, isAdmin
    } = req.body

    const createdOn = moment(new Date())

    if (isEmpty(email) || isEmpty(firstName) || isEmpty(lastName) || isEmpty(password)) {
      errorMessage.error = 'Email, password, first name and last name field cannot be empty'
      return res.status(status.bad).send(errorMessage)
    }
    if (!isValidEmail(email)) {
      errorMessage.error = 'Please enter a valid Email'
      return res.status(status.bad).send(errorMessage)
    }
    if (!validatePassword(password)) {
      errorMessage.error = 'Password must be more than five(5) characters'
      return res.status(status.bad).send(errorMessage)
    }
    const hashPwd = hashPassword(password)
    const values = [email, firstName, lastName, hashPwd, isAdmin, createdOn]

    try {
      const dbResponse = this.db.map(sql.add, values) // r => r.id)
      delete dbResponse.password
      const token = generateUserToken(dbResponse.email, dbResponse.id, dbResponse.isAdmin, dbResponse.firstName, dbResponse.lastName)
      console.log('!!! temporary !!!', dbResponse.email, dbResponse.id, dbResponse.isAdmin, dbResponse.firstName, dbResponse.lastName)
      successMessage.data = dbResponse
      successMessage.data.token = token
      return res.status(status.created).send(successMessage)
    } catch (error) {
      if (error.routine === '_bt_check_unique') {
        errorMessage.error = 'User with that EMAIL already exist'
        return res.status(status.conflict).send(errorMessage)
      }
      errorMessage.error = 'Operation was not successful'
      return res.status(status.error).send(errorMessage)
    }
  }

  // Tries to delete a user by id, and returns the number of records deleted;
  async remove (id) {
    return this.db.result(sql.remove, +id, r => r.rowCount)
  }

  // Returns all user records;
  async all () {
    return this.db.any(sql.findAll)
  }

  /** Tries to find a user from id
   * @param {*} req
   * @param {*} res
   */
  async findById (req, res) {
    const id = req.query

    try {
      const dbResponse = this.db.oneOrNone(sql.findById, +id)
      if (!dbResponse[0]) {
        errorMessage.error = 'No user with such id'
        return res.status(status.notfound).send(errorMessage)
      }
      successMessage.data = dbResponse
      return res.status(status.success).send(successMessage)
    } catch (error) {
      errorMessage.error = 'Operation was not successful'
      return res.status(status.error).send(errorMessage)
    }
  }

  // Tries to find a user from name;
  async findByFirstnameOrLastname (firstName, lastName) {
    return this.db.oneOrNone(sql.findByFirstnameOrLastname, [firstName, lastName])
  }

  // Returns the total number of users;
  async total () {
    return this.db.one(sql.total, [], a => +a.count)
  }
}

/** initializing ColumnSet objects
 * @param {*} pgp
 */
function createColumnsets (pgp) {
  if (!cs.insert) {
    cs.insert = new pgp.helpers.ColumnSet([
      '?id', 'email', 'firstName', 'lastName', 'password', 'isAdmin', 'createdOn'
    ], { table: { table: 'users', schema: 'public' } })
  }
  return cs
}

export default UsersRepository
