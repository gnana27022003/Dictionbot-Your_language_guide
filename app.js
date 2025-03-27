const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');

const dict = require('./routes/dictionary');
const userr = require('./routes/userroute');
const authMiddleware = require('./middleware/authmid');

const app = express();
dotenv.config({ path: './config.env' });

mongoose.connect(process.env.mongodburl);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');

// **SESSION MIDDLEWARE MUST BE BEFORE ROUTES & AUTH**
app.use(session({
    secret: 'dictionbot',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'js')));
app.use(express.static(path.join(__dirname, 'routes')));
app.use(express.static(path.join(__dirname, 'images')));

// **DO NOT USE authMiddleware GLOBALLY**
// Instead, apply it only to protected routes

app.use(dict);
app.use(userr);

app.get('/', async (req, res) => {
    res.render('home');
});

app.get('/bot', async (req, res) => {
    res.render('index');
});

app.get('/login', async (req, res) => {
    res.render('signin');
});

app.get('/signup', async (req, res) => {
    res.render('signup');
});

app.listen(process.env.port || 3000, () => {
    console.log("Server running at http://localhost:3000/bot");
});
