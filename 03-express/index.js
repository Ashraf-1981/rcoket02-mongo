// require is a way to import NodeJS modules (aka packages)
// a module is a normal JavaScript file but it shares functions and/or variables
// require('express') to import from the express folder in `node/modules`
const express = require('express');
// require is the function to import from other JavaScript files
// "./db" - means "db.js" in the same folder as `index.js`
const { connect } = require("./db")

// allow reading from .env file
require('dotenv').config();

const app = express();
app.use(express.json()); // enable the server to recieve JSON POST requests

// when a client access the / URL on this server,
// call the function in the second argument
app.get('/', function (req, res) {
    // req = request - what the client sent to the server
    // res = response - used by the server to send response to the client
    res.send("hello world");

})

async function main() {

    // call and wait for the connect function to finish
    // and get the db connection
    const db = await connect(
       process.env.MONGO_URI,
        "sample_airbnb"
    );

    app.get('/listings', async function(req,res){
        // in compass: db.listingsAndReviews.find()
        // in nodejs: db.collection("listingsAndReviews").find().toArray()
        const listings = await db.collection("listingsAndReviews").find().limit(10).toArray();
        res.send(listings);
    })

    app.get('/health', function (req, res) {
        res.send("I'm alive");
    })

    // recieve user's data via route parameters
    // a route parameter begins with a :
    // then the name of the route parameter is behind :
    app.get('/greet/:userName', function (req, res) {
        // the route parameter will be a key in req.params
        const userName = req.params.userName;
        res.send("Hello " + userName);
    })

    app.get('/sum/:number1/:number2', function (req, res) {
        const n1 = Number(req.params.number1);
        const n2 = Number(req.params.number2);
        const sum = n1 + n2;
        res.send("The total is " + sum);
    });

    app.get('/divide/:number1/by/:number2', function (req, res) {
        const n1 = Number(req.params.number1);
        const n2 = Number(req.params.number2);
        const quotient = n1 / n2;
        res.send("quotient =" + quotient);
    });

    // the other way to get data is from query strings
    app.get('/place_order', function (req, res) {
        // we have to specify the email address and the phone number
        // and the date time (ISO)
        // assuming the query string aprameters are: email, phone and datetime
        const email = req.query.email;
        const phone = req.query.phone;
        const datetime = req.query.datetime;
        res.send(`Reservation acknowledge for ${email} ${phone} for ${datetime}`)
    })

    // is by body (used for POST, PUT and PATCH)
    // functions like req.query BUT it can recongize data types: integers, floats, strings
    // and if advanced, can even recongize arrays and objects
    // assuming the user will send their email and password to register
    app.post('/register', function (req, res) {
        const email = req.body.email;
        const password = req.body.password;
        res.send(`New acocunt created for ${email} with password ${password}`);
    })
}
main();




// starts the express server (aka backend)
// listen to port 3000 and listen for any incoming requests at port 3000
app.listen(3000, function () {
    console.log("Sever has started")
})
