// app/routes.js
module.exports = function(app, passport) {

    app.get('/', function(req, res) {
        //res.sendFile(__dirname + '/index.html')
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });
  
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
    // app.post('/login', do all our passport stuff here);

    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/chat',
        failureRedirect : '/login',
        failureFlash : true // allow flash messages
    }));

    // process the signup form
    // app.post('/signup', do all our passport stuff here);

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/chat',
        failureRedirect : '/signup',
        failureFlash : true // allow flash messages
    }));

    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/chat', isLoggedIn, function(req, res) {
        res.render('index.ejs', {username: req.user.local.email})
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}