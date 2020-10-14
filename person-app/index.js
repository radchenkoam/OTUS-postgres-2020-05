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
DELETE('/users/remove', req => db.users.remove(req.params.id))
// 5. remove all records from the table
DELETE('/users/empty', () => db.users.empty())
// 6. get all users
GET('/users/all', () => db.users.all())
// 7. count all users
GET('/users/total', () => db.users.total())
// 8. find a user by id
GET('/users/find', req => db.users.findById(req.params.id))
// 9. find a user by email
GET('/users/find', req => db.users.findByEmail(req.params.email))
// 10. add seed user
GET('/users/init', () => db.users.init(env.secret))

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
GET('/persons/table', () => db.persons.createTable())
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
