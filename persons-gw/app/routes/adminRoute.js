import express from 'express'

import { createAdmin, updateUserToAdmin } from '../controllers/adminController.js'
import verifyAuth from '../middleware/verifyAuth.js'

const router = express.Router()

// user Routes
router.post('/admin/signup', verifyAuth, createAdmin)
router.put('/user/:id/admin', verifyAuth, updateUserToAdmin)

export default router
