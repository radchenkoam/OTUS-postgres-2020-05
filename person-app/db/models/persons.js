import { persons as sql } from '../sql';
const cs = {}; // Reusable ColumnSet objects.

class PersonsManager {
    constructor(db, pgp) {
        this.db = db;
        this.pgp = pgp;
        createColumnsets(pgp);
    }

    // Creates the table;
    async create() {
        return this.db.none(sql.create);
    }

    // Drops the table;
    async drop() {
        return this.db.none(sql.drop, { tableName: cs.table });
    }

    // Removes all records from the table;
    async empty() {
        return this.db.none(sql.empty, { tableName: cs.table });
    }

    // Adds a new record and returns the full object;
    // It is also an example of mapping HTTP requests into query parameters;
    async add(values) {
        return this.db.one(sql.add, {
            userId: +values.userId,
            productName: values.name
        });
    }

    // Tries to delete a product by id, and returns the number of records deleted;
    async remove(id) {
        return this.db.result('DELETE FROM persons WHERE id = $1', +id, r => r.rowCount);
    }

    // Tries to find a user product from user id + product name;
    async find(values) {
        return this.db.oneOrNone(sql.find, {
            userId: +values.userId,
            productName: values.name
        });
    }

    // Returns all product records;
    async all() {
        return this.db.any('SELECT * FROM persons');
    }

    // Returns the total number of persons;
    async total() {
        return this.db.one('SELECT count(*) FROM persons', [], a => +a.count);
    }
}

/** 
 * Statically initializing ColumnSet objects
 * @param {*} pgp 
 */
function createColumnsets(pgp) {
    if (!cs.insert) {
        const table = new pgp.helpers.TableName({table: 'persons', schema: 'public'});
        cs.insert = new pgp.helpers.ColumnSet([
            'id^', 'name', 'age', 'created_on'
        ], {table});
    }
    return cs;
}

export default PersonsManager;