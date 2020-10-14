import moment from 'moment'
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

    // 1. Returns all person records or person records by query
    async find(p) {
        return this.db.any(
            query.select, 
            {
                tableName: cs.select.table, 
                fields: cs.select.names, 
                filterExp: JSON.stringify(p) === '{}' ? '' : this.pgp.as.format('where $1:name = $1:csv', [p])
            }
        )
    }

    // 2. Tries to find a person by id
    async findById(id) {
        return this.db.oneOrNone(query.select, { 
            tableName: cs.select.table, 
            fields: cs.select.names, 
            filterExp: this.pgp.as.format('where id = $1', [+id])
        })
    }

    // 3. Adds a new or fake person and returns the full object
    async add(b) {
        return this.db.one(
            query.insert, 
            {
                tableName: cs.insert.table, 
                values: { 
                    name: b.name || faker.name.findName(), 
                    age: b.age || this.getAge(faker.date.between('1950-01-01', '2013-12-31')), 
                    created_on: b.created_on || moment().utc()
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
                tableName: cs.select.table, 
                filterExp: this.pgp.as.format('where id = $1', [+id]) 
            }, 
            r => r.rowCount
        )
    }

    // 5. Returns the total number of persons
    async total() {
        return this.db.one(
            query.select, 
            {
                tableName: cs.select.table, 
                fields: 'count(*)' , 
                filterExp: '' 
            }, 
            a => +a.count
        )
    }

    // Removes all records from the table
    async emptyTable() {
        return this.db.none(query.truncate, { tableName: cs.select.table })
    }

    // DDL. Creates the persons table
    async createTable() {
        return this.db.none(query.createPersonsTable)
    }

    // DDL. Drops the persons table
    async dropTable() {
        return this.db.none(query.drop, { tableName: cs.select.table })
    }
}

/** 
 * Statically initializing ColumnSet objects
 * @param {*} pgp 
 */
function createColumnsets(pgp) {
    if (!cs.insert) {
        const table = new pgp.helpers.TableName({table: 'persons', schema: 'public'})
        cs.insert = new pgp.helpers.ColumnSet(['name', 'age', 'created_on'], {table})
        cs.update = cs.insert.extend(['?id'])
        cs.select = cs.update
    }
    return cs;
}

export default PersonsManager