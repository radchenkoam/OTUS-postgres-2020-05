// app/db/dev/dbQuery.js

import pool from './pool.js'

export default {
  /** DB Query
   * @param {object} req
   * @param {object} res
   * @returns {object} object
   */
  query (quertText, params) {
    return new Promise((resolve, reject) => {
      pool.query(quertText, params)
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}
