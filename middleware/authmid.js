const authMiddleware = (req, res, next) => {
    console.log('Checking session:', req.session);  // Debugging output
    if (req.session && req.session.loggedIn) {
        next();
    } else {
        res.redirect('/');
    }
};

module.exports = authMiddleware;
