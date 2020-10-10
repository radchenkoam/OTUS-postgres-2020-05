import express from 'express'
import { GET } from '../helpers/handler.js'

const router = express.Router()

GET('/init', createAdmin)

export default router
