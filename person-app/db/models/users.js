import { hashPassword } from '../helpers/validation.js'
import { users as sql } from '../sql';

const cs = {}; // Reusable ColumnSet objects.

/** Users Manager
 */
class UsersManager {
    constructor(db, pgp) {
        this.db = db
        this.pgp = pgp

        // set-up all ColumnSet objects, if needed:
        createColumnsets(pgp);
    }

    // 1. Creates the table;
    async create() {
        return this.db.none(sql.create);
    }

    // 2. Drops the table;
    async drop() {
        return this.db.none(sql.drop, { tableName: cs.table });
    }

    // 3. Adds a new user, and returns the new object;
    async add(r) {
        return this.db.one(sql.add, {
            tableName: cs.table, 
            fields: cs.names,
            values: [r.id, r.email, r.name, hashPassword(r.password), r.is_admin || false, moment(new Date())],
            returning: '*'
        });
    }

    // 4. Tries to delete a user by id, and returns the number of records deleted;
    async remove(id) {
        return this.db.result(sql.deleteById, +id, r => r.rowCount);
    }

    // 5. Removes all records from the table;
    async empty() {
        return this.db.none(sql.empty, [cs.table]);
    }

    // 6. Returns all user records;
    async all() {
        return this.db.any(sql.selectAll, [cs.table, cs.names]);
    }

    // 7. Returns the total number of users;
    async total() {
        return this.db.one(sql.selectAll, [cs.table, 'count(*)'], a => +a.count);
    }

    // 8. Tries to find a user from id;
    async findById(id) {
        return this.db.oneOrNone(sql.selectById, [cs.names, cs.table, +id]);
    }

    // 9. Tries to find a user from email;
    async findByEmail(email) {
        return this.db.oneOrNone(sql.selectByEmail, [cs.names, cs.table, email]);
    }

    // 10. Initializes the table with seed user;
    async init(hashPwd) {
        return this.db.none(sql.init, [hashPwd]);
    }
}

/** Statically initializing ColumnSet objects
 * 
 * @param {*} pgp 
 */
function createColumnsets(pgp) {
    if (!cs.insert) {
        const table = new pgp.helpers.TableName({table: 'users', schema: 'public'});
        cs.insert = new pgp.helpers.ColumnSet([
            'id^', 'email', 'name', 'password', 'is_admin', 'created_on'
        ], {table});
    }
    return cs;
}

export default UsersManager;