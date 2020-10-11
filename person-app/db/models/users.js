import { hashPassword } from '../helpers/validation.js'
import { users as sql } from '../sql';

const cs = {}; // Reusable ColumnSet objects.

/**
 * Users Manager
 */
class UsersManager {
    constructor(db, pgp) {
        this.db = db
        this.pgp = pgp
        this.tableName = 'public.users'
        this.fields = 'id, email, "name", "password", is_admin, created_on'

        // set-up all ColumnSet objects, if needed:
        createColumnsets(pgp);
    }

    // Creates the table;
    async create() {
        return this.db.none(sql.create);
    }

    // Drops the table;
    async drop() {
        return this.db.none(sql.drop, [this.tableName]);
    }

    // Removes all records from the table;
    async empty() {
        return this.db.none(sql.empty, [this.tableName]);
    }

    // Initializes the table with seed user;
    async init(hashPwd) {
        return this.db.none(sql.init, [hashPwd]);
    }

    // Adds a new user, and returns the new object;
    async add(r) {
        return this.db.one(sql.add, [
            this.tableName, 
            this.fields,
            [r.id, r.email, r.name, hashPassword(r.password), r.is_admin || false, moment(new Date())],
            '*'
        ]);
    }

    // Tries to delete a user by id, and returns the number of records deleted;
    async remove(id) {
        return this.db.result(sql.deleteById, +id, r => r.rowCount);
    }

    // Tries to find a user from id;
    async findById(id) {
        return this.db.oneOrNone(sql.selectById, [this.fields, this.tableName, +id]);
    }

    // Tries to find a user from email;
    async findByEmail(email) {
        return this.db.oneOrNone(sql.selectByEmail, [this.fields, this.tableName, email]);
    }

    // Returns all user records;
    async all() {
        return this.db.any(sql.selectAll, [this.tableName, this.fields]);
    }

    // Returns the total number of users;
    async total() {
        return this.db.one(sql.selectAll, [this.tableName, 'count(*)'], a => +a.count);
    }
}

//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:

function createColumnsets(pgp) {
    // create all ColumnSet objects only once:
    if (!cs.insert) {
        // Type TableName is useful when schema isn't default "public" ,
        // otherwise you can just pass in a string for the table name.
        const table = new pgp.helpers.TableName({table: 'users', schema: 'public'});

        cs.insert = new pgp.helpers.ColumnSet(['name'], {table});
        cs.update = cs.insert.extend(['?id']);
    }
    return cs;
}

export default UsersManager;