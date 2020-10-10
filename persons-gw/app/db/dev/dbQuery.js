// app/db/dev/dbQuery.js
import pool from './pool.js'

export default {
  query (queryText, params) {
    return new Promise((resolve, reject) => {
      pool.query(queryText, params)
        .then((res) => { resolve(res) })
        .catch((err) => {
          reject(err)
        })
    })
  }
}
