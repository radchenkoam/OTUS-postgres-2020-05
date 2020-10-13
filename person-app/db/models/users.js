import moment from 'moment'
import { hashPassword } from '../../helpers/validation.js'
import { query } from '../../helpers/sql.js'

const cs = {} // Reusable ColumnSet objects.

/** Users Manager
 */
class UsersManager {
    constructor(db, pgp) {
        this.db = db
        this.pgp = pgp
        createColumnsets(pgp)
    }

    // 1. Creates the table
    async create() {
        return this.db.none(query.createUsersTable)
    }

    // 2. Drops the table
    async drop() {
        return this.db.none(query.drop, { tableName: cs.select.table })
    }

    // 3. Adds a new user, and returns the new object
    async add(b) {
        return this.db.one(
            query.insert, 
            {
                tableName: cs.insert.table, 
                values: { 
                    email: b.email, 
                    name: b.name, 
                    password: hashPassword(b.password), 
                    is_admin: b.is_admin || false, 
                    created_on: b.created_on || moment(new Date()).utc()
                },
                returnExp: 'returning *'
            }
        )
    }

    // 4. Tries to delete a user by id, and returns the number of records deleted
    async remove(id) {
        return this.db.result(
            query.del, 
            { 
                tableName: cs.select.table, 
                filterExp: pgp.as.format('where id = $1', [+id]) 
            }, 
            r => r.rowCount
        )
    }

    // 5. Removes all records from the table
    async empty() {
        return this.db.none(query.truncate, { tableName: cs.select.table })
    }

    // 6. Returns all user records
    async all() {
        return this.db.any(query.select, { tableName: cs.select.table, fields: cs.select.names })
    }

    // 7. Returns the total number of users
    async total() {
        return this.db.one(query.select, { tableName: cs.select.table, fields: 'count(*)' }, a => +a.count)
    }

    // 8. Tries to find a user from id
    async findById(id) {
        return this.db.oneOrNone(query.select, { 
            tableName: cs.select.table, 
            fields: cs.select.names, 
            filterExp: pgp.as.format('where id = $1', [+id])
        })
    }

    // 9. Tries to find a user from email
    async findByEmail(email) {
        return this.db.oneOrNone(query.select, { 
            tableName: cs.select.table, 
            fields: cs.select.names, 
            filterExp: pgp.as.format('where email = $1', [email])
        })
    }

    // 10. Initializes the table with seed user
    async init(pwd) {
        return this.db.one(
            query.insert, 
            {
                tableName: cs.insert.table, 
                values: { 
                    email: 'api_master@person.app', 
                    name: 'API-master', 
                    password: hashPassword(pwd), 
                    is_admin: true, 
                    created_on: moment(new Date())
                },
                returnExp: 'returning *'
            }
        )
    }
}

/** Statically initializing ColumnSet objects
 * 
 * @param {*} pgp 
 */
function createColumnsets(pgp) {
    if (!cs.insert) {
        const table = new pgp.helpers.TableName({table: 'users', schema: 'public'})
        cs.insert = new pgp.helpers.ColumnSet([
            'email', 'name', 'password', 'is_admin', 'created_on'
        ], {table})
        cs.update = cs.insert.extend(['?id'])
        cs.select = cs.update
    }
    return cs;
}

export default UsersManager