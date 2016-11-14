var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require('socket.io')(http);
var path = require('path');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');

var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var configDB = require('./config/database.js');

mongoose.connect(configDB.url);

require('./config/passport')(passport); // pass passport for configuration

app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms


// required for passport
app.use(session({ secret: '67475cmuchat' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

require('./routes.js')(app, passport); // load our routes and pass in our app and fully configured passport


/*

app.get('/', function(request,response){
	response.sendFile(__dirname + '/index.html')
});

*/

app.use(express.static(path.join(__dirname, 'public')));




var usernames = {};


/*
var MongoClient = mongodb.MongoClient

MongoClient.connect("mongodb://stresschat:stresschat@ds011943.mlab.com:11943/stresschat", function(err, database){
	if(err){
		console.log('Unable to connect to the mongoDB server. Error:', err);
	} else{
		console.log('Connection established to mongo');
		var collection = database.collection('users');
	}

});

*/

queue = [];
connectedCounter = 0;

function isPrevious(previousPartner){
	if(queue.length == 1){
		if(previousPartner == queue[0]){
			return true;
		}
	} else if(queue.length == 2){
		if(previousPartner == queue[1]){
			return true;
		}
	}
	return false;
}




io.on('connection', function(socket){

	socket.on('adduser', function(){
		// Keep track of connected
		connectedCounter++;
		io.sockets.emit('connectedUsers', connectedCounter);
		// So client has their own id, then join their own channel
		socket.emit('giveID', socket.id)
		socket.join(socket.id);
		socket.emit('updatechat', socket.id, 'SERVER: You have connected!');
	});

	socket.on('connectToRoom', function(previousPartner){
		if(queue.length == 0 || isPrevious(previousPartner)){
			// Should never be more than one, so if its your previous, just put yourself on queue
			delete socket.partner;
			queue.push(socket.id);
			socket.emit('setPartnerFalse');
			socket.emit('updatechat', socket.id, 'SERVER: Waiting for a partner...');
		}else{
			// Grab a partner from queue
			partner = queue.shift();
			socket.partner = partner;
			// Must send to partner so they know who their new partner is
			socket.emit('assignPartner', socket.partner);
			socket.broadcast.to(socket.partner).emit('assignPartner', socket.id);
		};
	});


	socket.on('acceptPartner', function(partner){
		// Set socket.partner so it can now chat with them
		socket.partner = partner;
		socket.emit('updatechat', socket.id, 'SERVER: Partner found!');
	});

	socket.on('chat message', function(msg){
		// Update theirs and my own chat
		io.sockets.in(socket.partner).emit('updatechat', socket.id, msg);
		io.sockets.in(socket.id).emit('updatechat', socket.id, msg);
	});
  
    socket.on('start-typing', function(){
      io.sockets.in(socket.partner).emit('start-typing');
    });
  
    socket.on('stop-typing', function(){
      io.sockets.in(socket.partner).emit('stop-typing');
    });

	socket.on('message myself', function(){
		io.sockets.in(socket.id).emit('updatechat', socket.id, 'SERVER: No available partners at the moment.');
	})


	socket.on('disconnect', function(){
		connectedCounter--;
		io.sockets.emit('connectedUsers', connectedCounter);
		// Must get rid of solo people from queue when they disconnect
		if(socket.id == queue[0]){
			index = queue.indexOf(socket.id);
			queue.splice(index, 1);
		}else{
			socket.broadcast.to(socket.partner).emit('updatechat', socket.partner, "SERVER: Your partner has left the chat.");
			socket.broadcast.to(socket.partner).emit('newPartner', socket.id);
		};
	});

	socket.on('disconnectingFromPartner', function(id){	
		io.sockets.in(socket.id).emit('updatechat', socket.id, 'SERVER: You have left your partner.');
		socket.broadcast.to(id).emit('updatechat', id, "SERVER: Your partner has left the chat.");
		delete socket.partner;
		socket.broadcast.to(id).emit('newPartner', socket.id);
	})

});

http.listen(8000, function(){
  console.log('listening on *:8000');
});