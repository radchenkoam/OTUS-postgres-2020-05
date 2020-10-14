import pkg from 'express'
import { db } from './db/db.js'
import env from './env.js'

const express = pkg
export const app = express()

// Add middleware for parsing URL encoded bodies (which are usually sent by browser)
// app.use(cors())

// Add middleware for parsing JSON and urlencoded data and populating `req.body`
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

//////////////////////////////////////////////
// Users Web API
//////////////////////////////////////////////
// 1. Returns all user records or user records by query
GET('/user', req => db.users.find(req.query))
// 2. Tries to find a user by id
GET('/user/:id', req => db.users.findById(req.params.id))
// 3. Adds a new user, and returns the new object
POST('/user', req => {
    return db.task('add-user', async t => {
        const user = await t.users.findByEmail(req.body.email)
        return user || t.users.add(req.body)
    })
})
// 4. Tries to delete a user by id, and returns the number of records deleted
DELETE('/user/:id', req => db.users.remove(req.params.id))
// 5. Returns the total number of users
GET('/users/total', () => db.users.total())
// 6. add seed user
POST('/users/init', () => db.users.init(env.secret))

// Remove all users
DELETE('/users/empty', () => db.users.empty())
// DDL. Creates the users table
POST('/users/table', () => db.users.createTable())
// DDL. Drops the users table
DELETE('/users/table', () => db.users.dropTable())

//////////////////////////////////////////////
// Persons Web API
//////////////////////////////////////////////
// 1. Returns all person records or person records by query
GET('/person', req => db.persons.find(req.query))
// 2. Tries to find a person by id
GET('/person/:id', req => db.persons.findById(req.params.id))
// 3. Adds a new or fake person and returns the full object
POST('/person', req => db.persons.add(req.body))
// 4. Tries to delete a person by id
DELETE('/person/:id', req => db.persons.remove(req.params.id))
// 5. Returns the total number of persons
GET('/persons/total', () => db.persons.total())

// Remove all persons
DELETE('/persons/empty', () => db.persons.emptyTable())
// DDL. Creates the persons table
POST('/persons/table', () => db.persons.createTable())
// DDL. Drops the persons table
DELETE('/persons/table', () => db.persons.dropTable())


app.listen(env.port_api).on('listening', () => {
    console.log(`🚀 are live on ${env.port_api}`)
})


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
function DELETE(url, handler) {
    app.delete(url, async (req, res) => {
        try {
            const data = await handler(req);
            res.json({
                success: true,
                data
            });
        } catch (error) {
            res.json({
                success: false,
                error: error.message || error
            });
        }
    });
}
