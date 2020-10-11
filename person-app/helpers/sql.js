import { QueryFile } from 'pg-promise'
import { join as joinPath } from 'path'

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
      console.error(qf.error)
  }
  return qf
  // See QueryFile API:
  // http://vitaly-t.github.io/pg-promise/QueryFile.html
}

export const users = {
  create: sql('../db/sql/createUsersTable.sql'),
  drop: sql('../db/sql/drop.sql'),
  add: sql('../db/sql/insert.sql'),
  remove: sql('../db/sql/delete.sql'),
  empty: sql('../db/sql/truncate.sql'),
  all: sql('../db/sql/select.sql'),
  total: sql('../db/sql/select.sql'),
  findById: sql('../db/sql/select.sql'),
  findByEmail: sql('../db/sql/select.sql'),
  init: sql('../db/sql/insert.sql')    
}
export const persons = {
  create: sql('../db/sql/createPersonsTable.sql'),
  drop: sql('../db/sql/drop.sql'),
  add: sql('../db/sql/insert.sql'), 
  remove: sql('../db/sql/delete.sql'),
  empty: sql('../db/sql/truncate.sql'),
  all: sql('../db/sql/select.sql'),
  total: sql('../db/sql/select.sql'),
  findById: sql('../db/sql/select.sql'), 
  findByName: sql('../db/sql/select.sql')
}