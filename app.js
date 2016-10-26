var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require('socket.io')(http);
var path = require('path');
var mongodb = require('mongodb');


app.get('/', function(request,response){
	response.sendFile(__dirname + '/index.html')
});

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




io.on('connection', function(socket){

	socket.on('adduser', function(){
		socket.emit('giveID', socket.id)
		socket.join(socket.id);
		socket.emit('updatechat', socket.id, 'You have connected');
	});

	socket.on('connectToRoom', function(previousPartner){
		if(queue.length == 0 || queue[0] == previousPartner){
			queue.push(socket.id);
			socket.emit('updatechat', socket.id, 'Waiting for a partner');
		}else{
			partner = queue.shift();
			socket.partner = partner;
			socket.emit('updatechat', socket.id, 'Partner found');
			socket.broadcast.to(socket.partner).emit('assignPartner', socket.id);
		};
	});


	socket.on('acceptPartner', function(partner){
		socket.partner = partner;
		socket.emit('updatechat', socket.id, 'Partner found');
	});

	socket.on('chat message', function(msg){
		io.sockets.in(socket.partner).emit('updatechat', socket.id, msg);
		io.sockets.in(socket.id).emit('updatechat', socket.id, msg);
	});


	socket.on('disconnect', function(){
		socket.broadcast.to(socket.partner).emit('updatechat', socket.partner, "Your partner has left the chat");
		socket.broadcast.to(socket.partner).emit('newPartner');
	});

	socket.on('disconnectingFromPartner', function(id){
		socket.broadcast.to(id).emit('deleteConnectionToPartner');
		socket.broadcast.to(id).emit('newPartner');
	})

	socket.on('deleteConnectionToPartner', function(){
		socket.partner = "";
	})
});

http.listen(8000, function(){
  console.log('listening on *:8000');
});