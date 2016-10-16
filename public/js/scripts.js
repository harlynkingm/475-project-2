$(document).ready(function(){
  var socket = io();

  socket.on('connect', function(){
    socket.emit('adduser', prompt("What's your name?"));
  });

  socket.on('disconnected', function(username){
    socket.emit('reassignRoom', username);
  })

  $('form').submit(function(){
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
  });

  socket.on('updateusers', function(data){
    $("#users").empty();
    $.each(data, function(key,value){
      $('#users').append("<div>" + key + "</div>");
    })
  });

  socket.on('updatechat', function(username, msg){
    $('#messages').append("<li>" + username + ": " + msg + "</li>");
  });

});