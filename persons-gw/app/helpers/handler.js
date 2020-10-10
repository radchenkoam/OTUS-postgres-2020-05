import app from './server.js'

/** Generic GET handler;;
 * @param {*} url
 * @param {*} handler
 */
function GET (url, handler) {
  app.get(url, async (req, res) => {
    try {
      const data = await handler(req)
      res.json({
        success: true,
        data
      })
    } catch (error) {
      res.json({
        success: false,
        error: error.message || error
      })
    }
  })
}

/** Generic POST handler;;
 * @param {*} url
 * @param {*} handler
 */
function POST (url, handler) {
  app.post(url, async (req, res) => {
    try {
      const data = await handler(req)
      res.json({
        success: true,
        data
      })
    } catch (error) {
      res.json({
        success: false,
        error: error.message || error
      })
    }
  })
}

export { GET, POST }
