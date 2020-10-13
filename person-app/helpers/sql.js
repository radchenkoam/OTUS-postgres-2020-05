import { join as joinPath } from 'path'
import path from 'path';
import pkg from 'pg-promise';

const { QueryFile } = pkg;
const __dirname = path.resolve();

export const query = {
  createUsersTable: sql('/db/sql/createUsersTable.sql'),
  createPersonsTable: sql('/db/sql/createPersonsTable.sql'),
  drop: sql('/db/sql/drop.sql'),
  insert: sql('/db/sql/insert.sql'),
  del: sql('/db/sql/del.sql'),
  truncate: sql('/db/sql/truncate.sql'),
  select: sql('/db/sql/select.sql')
}

/** Helper for linking to external query files;
 * @param {*} file 
 */
function sql(file) {
  const fullPath = joinPath(__dirname, file) // generating full path;
  const options = {
      minify: true
  }
  const qf = new QueryFile(fullPath, options)
  if (qf.error) {
      // console.error(qf.error)
      console.log(__dirname, fullPath, qf)
  }
  return qf
  // See QueryFile API:
  // http://vitaly-t.github.io/pg-promise/QueryFile.html
}