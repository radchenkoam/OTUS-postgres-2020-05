import express from 'express'
import seedUser from '../controllers/seedUserController.js'

const router = express.Router()

// seed user Route
router.get('/user/seed', seedUser)

/**
 router.get('/user/seed', (res, req, err) => {
  if (err) return err
  seedUser()
})
*/

export default router
// module.exports = router
