// server.js

import express from 'express'
import 'babel-polyfill'
import cors from 'cors'
import env from './env.js'
import userRoute from './app/routes/userRoute'
import seedRoute from './app/routes/seedRoute.js'
import adminRoute from './app/routes/adminRoute.js'
import personRoute from './app/routes/personRoute.js'

const app = express()

// Add middleware for parsing URL encoded bodies (which are usually sent by browser)
app.use(cors())

// Add middleware for parsing JSON and urlencoded data and populating `req.body`
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use('/api/v1', userRoute)
app.use('/api/v1', seedRoute)
app.use('/api/v1', adminRoute)
app.use('/api/v1', personRoute)

app.listen(env.port).on('listening', () => {
  console.log(`🚀 are live on ${env.port}`)
})

export default app
