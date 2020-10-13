import pkg from 'faker'
import { query } from '../../helpers/sql.js'

const faker = pkg
faker.locale = "ru"

const cs = {} // Reusable ColumnSet objects.

class PersonsManager {
    constructor(db, pgp) {
        this.db = db
        this.pgp = pgp
        createColumnsets(pgp)
    }

    // Returns the age given the date of birth
    getAge(birthday) {
        const millis = Date.now() - Date.parse(birthday);
        return new Date(millis).getFullYear() - 1970;
    }

    // 1. Creates the table
    async create() {
        return this.db.none(query.createPersonsTable)
    }

    // 2. Drops the table
    async drop() {
        return this.db.none(query.drop, { tableName: cs.table })
    }

    // 3. Adds a new or fake person and returns the full object
    async add(r) {
        return this.db.one(
            query.insert, 
            {
                tableName: cs.table, 
                values: { 
                    name: r.name || faker.name.findName(), 
                    age: age || this.getAge(faker.date.between('1950-01-01', '2013-12-31')), 
                    created_on: r.created_on || moment(new Date())
                },
                returnExp: 'returning *'
            }
        )
    }

    // 4. Tries to delete a person by id, and returns the number of records deleted
    async remove(id) {
        return this.db.result(
            query.delete, 
            { 
                tableName: cs.tableName, 
                filterExp: pgp.as.format('where id = $1', [+id]) 
            }, 
            r => r.rowCount
        )
    }

    // 5. Removes all records from the table
    async empty() {
        return this.db.none(query.truncate, { tableName: cs.table })
    }

    // 6. Returns all person records
    async all() {
        return this.db.any(query.select, { tableName: cs.table, fields: cs.names })
    }

    // 7. Returns the total number of persons
    async total() {
        return this.db.one(query.select, { tableName: cs.table, fields: 'count(*)' }, a => +a.count)
    }

    // 8. Tries to find a person from id
    async findById(id) {
        return this.db.oneOrNone(query.select, { 
            tableName: cs.table, 
            fields: cs.names, 
            filterExp: pgp.as.format('where id = $1', [+id])
        })
    }

    // 9. Tries to find a person from name
    async findByName(name) {
        return this.db.oneOrNone(query.select, { 
            tableName: cs.table, 
            fields: cs.names, 
            filterExp: pgp.as.format('where name = $1', [name])
        })
    }
}

/** 
 * Statically initializing ColumnSet objects
 * @param {*} pgp 
 */
function createColumnsets(pgp) {
    if (!cs.insert) {
        const table = new pgp.helpers.TableName({table: 'persons', schema: 'public'})
        cs.insert = new pgp.helpers.ColumnSet([
            'id^', 'name', 'age', 'created_on'
        ], {table})
    }
    return cs
}

export default PersonsManager