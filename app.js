var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require('socket.io')(http);
var path = require('path');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var request = require('request');
var nodemailer = require('nodemailer');

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




function getUserData(id, callback){
    request('http://apis.scottylabs.org/directory/v1/andrewID/' + id, function (error, response, body) {
      console.log(body);
      if (!error && response.statusCode == 200) {
       	callback(body);
      }
    })
}


var smtpTransport = nodemailer.createTransport("SMTP",{
   service: "Gmail",  // sets automatically host, port and connection security settings
   auth: {
   	// account to send emails from
       user: "cmuchatverify@gmail.com",
       pass: "CMUchat67475"
   }
});


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
    
    socket.on('reveal', function(id){
    	getUserData(id, function(body){
			user = {};
			data = JSON.parse(body);
			user.name = data.first_name + " " + data.last_name;
			if (Array.isArray(data.department)){
				user.dept = data.department[0];
			} else {
				user.dept = data.department;
			}
			user.level = data.student_level;
			user.class = data.student_class;
			io.sockets.in(socket.id).emit('updatechat', socket.id, `REVEAL: You revealed that you are <b>${user.name}</b>, an <b>${user.level} ${user.class}</b> in the <b>${user.dept} Department!</b>`);
      		io.sockets.in(socket.partner).emit('updatechat', socket.partner, `REVEAL: Your partner revealed that they are <b>${user.name}</b>, an <b>${user.level} ${user.class}</b> in the <b>${user.dept} Department!</b>`);
    
      	});
      })

    socket.on('reportPartner', function(myself, myPartner, message){
    	// send to the reported user's side to retrieve their id
    	socket.broadcast.to(myPartner).emit('getID', myself, message);
    })

    socket.on('report', function(reported, reporter, message){
    	var newMessage = "User " + reported + " has been reported by " + reporter + ". ";
        newMessage += message;
		smtpTransport.sendMail({  //email options
		   from: "carnegieChat <cmuchatverify@gmail.com>", // sender address -- will change later to carnegiechat
		   to: "<mharlynk@andrew.cmu.edu>", // receiver - we will change this to all our emails (because we are the admins)
		   subject: "Reported", // subject
		   text: message // body
		}, function(error, response){  //callback
		   if(error){
		       console.log(error);
		   }else{
		       console.log("Message sent: " + response.message);
		   }
		   
		   smtpTransport.close(); // shut down the connection pool, no more messages.  Comment this line out to continue sending emails.
		});
    })


	socket.on('disconnect', function(){
		connectedCounter--;
		io.sockets.emit('connectedUsers', connectedCounter);
		// Must get rid of solo people from queue when they disconnect.
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