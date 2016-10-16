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

var MongoClient = mongodb.MongoClient

MongoClient.connect("mongodb://stresschat:stresschat@ds011943.mlab.com:11943/stresschat", function(err, database){
	if(err){
		console.log('Unable to connect to the mongoDB server. Error:', err);
	} else{
		console.log('Connection established to mongo');
		var collection = database.collection('users');
	}

});

chatrooms = {
	"room1":[],
	"room2":[],
	"room3":[],
	"room4":[],
	"room5":[]
};

function findRoom(username){
	var room;
	for(room in chatrooms){
		if(chatrooms[room].length == 2){
			continue;
		}
		else{
			chatrooms[room].push(username);
			return room;
		}
	}
};

function newRoom(username, previousRoom){
	for(room in chatrooms){
		if(room == previousRoom){
			continue;
		} else if(chatrooms[room].length == 2){
			continue;
		} else{
			chatrooms[room].push(username);
			return room;
		}
	}
}

function reassignRoom(username){
	for(room in chatrooms){
		if(chatrooms[room][0] == username){
			usernameToMove = chatrooms[room][1];
			roomToClear = room;
			break;
		} else if(chatrooms[room][1] == username){
			usernameToMove = chatrooms[room][0];
			roomToClear = room;
			break;
		}
	};
	chatrooms[roomToClear] = [];
	room = newRoom(usernameToMove, roomToClear);
	return [room, usernameToMove];
};


io.on('connection', function(socket){

	socket.on('adduser', function(username){
		socket.username = username;
		usernames[username] = username;
		room = findRoom(username);
		socket.room = room;
		socket.join(room);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ room);
		socket.broadcast.to(room).emit('updatechat', 'SERVER', username + " has connected");
		io.sockets.emit('updateusers', usernames);
	});

	socket.on('chat message', function(msg){
		io.sockets.in(socket.room).emit('updatechat', socket.username, msg);
	});

	socket.on('reassignRoom', function(username){
		data = reassignRoom(username);
		room = data[0];
		username = data[1];
		socket.username = username;
		socket.room = room;
		socket.join(room);
		socket.emit('updatechat', 'SERVER', 'you have been relocated to ' + room);
		socket.broadcast.to(room).emit('updatechat', 'SERVER', username + " has connected");
	});

	socket.on('disconnect', function(){
		delete usernames[socket.username];
		io.sockets.emit('updateusers', usernames);
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + " has left the chat");
		socket.broadcast.to(socket.room).emit('disconnected', socket.username);
		socket.leave(socket.room);
	});
});

http.listen(8000, function(){
  console.log('listening on *:8000');
});