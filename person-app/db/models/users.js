import { hashPassword } from '../../helpers/validation.js'
import { users } from '../../helpers/sql.js';

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
        return this.db.none(users.create);
    }

    // 2. Drops the table;
    async drop() {
        return this.db.none(users.drop, { tableName: cs.table });
    }

    // 3. Adds a new user, and returns the new object;
    async add(r) {
        return this.db.one(
            users.add, 
            {
                tableName: cs.table, 
                values: { 
                    id = r.id, 
                    email = r.email, 
                    name = r.name, 
                    password = hashPassword(r.password), 
                    is_admin = r.is_admin || false, 
                    created_on = moment(new Date())
                },
                returnExp: 'returning *'
            }
        );
    }

    // 4. Tries to delete a user by id, and returns the number of records deleted;
    async remove(id) {
        return this.db.result(
            users.deleteFilter, 
            { 
                tableName: cs.tableName, 
                filterExp: pgp.as.format('where id = $1', [+id]) 
            }, 
            r => r.rowCount
        );
    }

    // 5. Removes all records from the table;
    async empty() {
        return this.db.none(users.empty, { tableName: cs.table });
    }

    // 6. Returns all user records;
    async all() {
        return this.db.any(users.all, { tableName: cs.table, fields: cs.names });
    }

    // 7. Returns the total number of users;
    async total() {
        return this.db.one(users.all, { tableName: cs.table, fields: 'count(*)' }, a => +a.count);
    }

    // 8. Tries to find a user from id;
    async findById(id) {
        return this.db.oneOrNone(users.selectFilter, { 
            tableName: cs.table, 
            fields: cs.names, 
            filterExp: pgp.as.format('where id = $1', [+id])
        });
    }

    // 9. Tries to find a user from email;
    async findByEmail(email) {
        return this.db.oneOrNone(users.selectFilter, { 
            tableName: cs.table, 
            fields: cs.names, 
            filterExp: pgp.as.format('where email = $1', [email])
        });
    }

    // 10. Initializes the table with seed user;
    async init(hashPwd) {
        return this.db.none(users.init, { hashPwd: hashPwd } );
    }

    insert into public.users 
  (email, "name", "password", is_admin)
values 
  ('api_master@person.gw', 'Master', 'API', ${hashPwd}:value, true)
}
insert into public.users 
  (email, "name", "password", is_admin)
values 
  ('api_master@person.gw', 'Master', 'API', ${hashPwd}:value, true)

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