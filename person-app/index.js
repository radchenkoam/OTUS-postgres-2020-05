import { db } from './db'
import { hashPassword } from './helpers/validation.js'
import { GET, POST, DELETE } from './helpers/handler.js'
import env from './env.js'

const express = require('express')
const app = express()
// Add middleware for parsing URL encoded bodies (which are usually sent by browser)
app.use(cors())
// Add middleware for parsing JSON and urlencoded data and populating `req.body`
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

//////////////////////////////////////////////
// Users Web API
//////////////////////////////////////////////
// create table Users
GET('/users/create', () => db.users.create());
// drop the table
GET('/users/drop', () => db.users.drop());
// add a new user, if it doesn't exist yet, and return the object
POST('/users/add/', req => {
    return db.task('add-user', async t => {
        const user = await t.users.findByEmail(req.body.email);
        return user || t.users.add(req.body);
    });
});
// remove a user by id
DELETE('/users/remove/:id', req => db.users.remove(req.params.id));
// remove all records from the table
DELETE('/users/empty', () => db.users.empty());
// get all users
GET('/users/all', () => db.users.all());
// count all users
GET('/users/total', () => db.users.total());
// find a user by id
GET('/users/find/:id', req => db.users.findById(req.params.id));
// find a user by email
GET('/users/find/:email', req => db.users.findByEmail(req.params.email));
// add seed user
GET('/users/init', () => db.users.init(hashPassword(env.secret)));

//////////////////////////////////////////////
// Persons Web API
//////////////////////////////////////////////
// create table Persons:
GET('/persons/create', () => db.persons.create());
// drop the table:
GET('/persons/drop', () => db.persons.drop());
// remove all persons:
GET('/persons/empty', () => db.persons.empty());
// add a new user person, if it doesn't exist yet, and return the object:
GET('/persons/add/:userId/:name', req => {
    return db.task('add-person', async t => {
        const person = await t.persons.find(req.params);
        return person || t.persons.add(req.params);
    });
});

// find a person by user id + person name id:
GET('/persons/find/:userId/:name', req => db.persons.find(req.params));

// remove a person by id:
GET('/persons/remove/:id', req => db.persons.remove(req.params.id));

// get all persons:
GET('/persons/all', () => db.persons.all());

// count all persons:
GET('/persons/total', () => db.persons.total());

app.listen(env.port_api).on('listening', () => {
    console.log(`🚀 are live on ${env.port_api}`)
  })