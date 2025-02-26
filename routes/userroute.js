const express = require('express');
const route = express.Router();
const bcrypt = require('bcrypt');
const usermodel = require('../model/usermodel');
const { storeUserData } = require('../userjs/storeUserData');
const { validateUser } = require('../userjs/validateUser');
const authMiddleware = require('../middleware/authmid');

route.get('/home2', authMiddleware, async (req, res) => {
    res.render('home2');
});

route.get('/signin', (req, res) => {
    res.render('signin', { errorMessage: null });
});

route.get('/signup', async (req, res) => {
    res.render('signup');
});

route.post('/signup', async (req, res) => {
    if (req.body.email && req.body.password) {
        req.session.email = req.body.email;
        req.session.password = await bcrypt.hash(req.body.password, 10);

        req.body.email = req.session.email;
        req.body.password = req.session.password;

        req.session.loggedIn = true;
        const result = await storeUserData(req, res);

        if (result.success) {
            res.redirect('/home2');
        } else {
            res.send('Sorry, try again later.');
        }
    } else {
        res.send('Please enter email and password.');
    }
});

route.post('/signin', async (req, res) => {
    const data = {
        email: req.body.email,
        password: req.body.password,
    };

    const result = await validateUser(data);
    req.session.user = result.user;

    if (result.success) {
        req.session.loggedIn = true;
        console.log(result.user);
        res.redirect(result.redirectTo);
    } else {
        res.render('signin', { errorMessage: result.message });
    }
});

route.get('/userprofile', authMiddleware, async (req, res) => {
    if (req.session.user && req.session.user.email) {
        const worker = await usermodel.findOne({ email: req.session.user.email });
        if (worker) {
            console.log(worker);
            res.render('profile', { worker });
        }
    } else {
        res.redirect('/home2');
    }
});

module.exports = route;
