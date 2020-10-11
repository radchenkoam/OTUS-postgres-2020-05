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
    empty: sql('truncateTable.sql'),
    init: sql('initSeedUser.sql'),
    drop: sql('dropTable.sql'),
    add: sql('insert.sql')
};
export const persons = {
    create: sql('createPersonsTable.sql'),
    empty: sql('truncateTable.sql'),
    drop: sql('dropTable.sql'),
    findById: sql('selectById.sql'),
    add: sql('insert.sql')
};

