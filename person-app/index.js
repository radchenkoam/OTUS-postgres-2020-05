import pkg from 'express'
import { db } from './db/db.js'
import env from './env.js'

const express = pkg
const app = express()

// Add middleware for parsing URL encoded bodies (which are usually sent by browser)
// app.use(cors())

// Add middleware for parsing JSON and urlencoded data and populating `req.body`
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

//////////////////////////////////////////////
// Users Web API
//////////////////////////////////////////////
// 1. create table Users
GET('/users/create', () => db.users.create())
// 2. drop the table
GET('/users/drop', () => db.users.drop())
// 3. add a new user, if it doesn't exist yet, and return the object
POST('/users/add/', req => {
    return db.task('add-user', async t => {
        const user = await t.users.findByEmail(req.body.email)
        return user || t.users.add(req.body)
    })
})
// 4. remove a user by id
DEL('/users/remove/:id', req => db.users.remove(req.params.id))
// 5. remove all records from the table
DEL('/users/empty', () => db.users.empty())
// 6. get all users
GET('/users/all', () => db.users.all())
// 7. count all users
GET('/users/total', () => db.users.total())
// 8. find a user by id
GET('/users/find/:id', req => db.users.findById(req.params.id))
// 9. find a user by email
GET('/users/find/:email', req => db.users.findByEmail(req.params.email))
// 10. add seed user
GET('/users/init', () => db.users.init(env.secret))

//////////////////////////////////////////////
// Persons Web API
//////////////////////////////////////////////
// 1. create table Persons:
GET('/persons/create', () => db.persons.create())
// 2. drop the table:
GET('/persons/drop', () => db.persons.drop())
// 3. add a new person, if it doesn't exist yet, and return the object:
POST('/persons/add', req => db.persons.add(req.body))
// 4. remove a person by id:
DEL('/persons/remove/:id', req => db.persons.remove(req.params.id))
// 5. remove all persons:
DEL('/persons/empty', () => db.persons.empty())
// 6. get all persons:
GET('/persons/all', () => db.persons.all())
// 7. count all persons:
GET('/persons/total', () => db.persons.total())
// 8. find a person by user id
GET('/persons/find/:id', req => db.persons.findById(req.params.id))
// 9. find a person by user name
GET('/persons/find/:name', req => db.persons.findByName(req.params.name))

app.listen(env.port_api).on('listening', () => {
    console.log(`🚀 are live on ${env.port_api}`)
})

/////////////////////////////////////////////
// Express/server part
/////////////////////////////////////////////

// Generic GET handler
function GET(url, handler) {
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
  
// Generic POST handler
function POST(url, handler) {
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
  
// Generic DELETE handler
function DEL(url, handler) {
    app.delete(url, async (req, res) => {
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
