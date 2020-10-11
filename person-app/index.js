import { db } from './db'
import env from './env.js'
import { hashPassword } from '../helpers/validation.js'

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
// create table Users:
GET('/users/create', () => db.users.create());
// drop the table:
GET('/users/drop', () => db.users.drop());
// remove all records from the table:
GET('/users/empty', () => db.users.empty());
// add seed user
GET('/users/init', () => db.users.init(hashPassword(env.secret)));
// add a new user, if it doesn't exist yet, and return the object:
POST('/users/add/', req => {
    return db.task('add-user', async t => {
        const user = await t.users.findByEmail(req.body.email);
        return user || t.users.add(req.body);
    });
});
// remove a user by id:
DELETE('/users/remove/:id', req => db.users.remove(req.params.id));
// find a user by id:
GET('/users/find/:id', req => db.users.findById(req.params.id));
// find a user by email:
GET('/users/find/:email', req => db.users.findByEmail(req.params.email));
// get all users:
GET('/users/all', () => db.users.all());
// count all users:
GET('/users/total', () => db.users.total());

//////////////////////////////////////////////
// Products Web API
//////////////////////////////////////////////

// create table Products:
GET('/products/create', () => db.products.create());

// drop the table:
GET('/products/drop', () => db.products.drop());

// remove all products:
GET('/products/empty', () => db.products.empty());

// add a new user product, if it doesn't exist yet, and return the object:
GET('/products/add/:userId/:name', req => {
    return db.task('add-product', async t => {
        const product = await t.products.find(req.params);
        return product || t.products.add(req.params);
    });
});

// find a product by user id + product name id:
GET('/products/find/:userId/:name', req => db.products.find(req.params));

// remove a product by id:
GET('/products/remove/:id', req => db.products.remove(req.params.id));

// get all products:
GET('/products/all', () => db.products.all());

// count all products:
GET('/products/total', () => db.products.total());

/////////////////////////////////////////////
// Express/server part;
/////////////////////////////////////////////

// Generic GET handler;
function GET(url, handler) {
    app.get(url, async (req, res) => {
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

// Generic POST handler;
function POST(url, handler) {
    app.post(url, async (req, res) => {
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

const port = 5000;

app.listen(port, () => {
    console.log('\nReady for GET requests on http://localhost:' + port);
});