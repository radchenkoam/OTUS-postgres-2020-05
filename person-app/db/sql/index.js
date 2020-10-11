import { QueryFile } from 'pg-promise';
import { join as joinPath } from 'path';

/** Helper for linking to external query files;
 * @param {*} file 
 */
function sql(file) {
    const fullPath = joinPath(__dirname, file); // generating full path;
    const options = {
        minify: true
    };
    const qf = new QueryFile(fullPath, options);
    if (qf.error) {
        console.error(qf.error);
    }
    return qf;
    // See QueryFile API:
    // http://vitaly-t.github.io/pg-promise/QueryFile.html
}

export const users = {
    create: sql('createUsersTable.sql'),
    drop: sql('dropTable.sql'),
    add: sql('insert.sql'),
    remove: sql('deleteByid.sql'),
    empty: sql('truncateTable.sql'),
    all: sql('selectAll.sql'),
    total: sql('selectAll.sql'),
    findById: sql('selectById.sql'),
    findByEmail: sql('selectByEmail.sql'),
    init: sql('initSeedUser.sql')    
};
export const persons = {
    create: sql('createPersonsTable.sql'),
    drop: sql('dropTable.sql'),
    add: sql('insert.sql'), 
    remove: sql('deleteByid.sql'),
    empty: sql('truncateTable.sql'),
    findById: sql('selectById.sql')
};

