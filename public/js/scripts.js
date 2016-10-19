$(document).ready(function(){
  var socket = io();
  
  var yourself;

  socket.on('connect', function(){
//    username = prompt("Whats your name??");
    username = "MAX";
    yourself = username;
    socket.emit('adduser', username);
    socket.emit('assignRoom', username);
  });

  socket.on('disconnected', function(username){
    socket.emit('reassignRoom', username);
  })

  $('#send').click(function(){
    if ($('#m').val()){
      socket.emit('chat message', $('#m').val());
      $('#m').val('');
    }
  });


//  socket.on('updateusers', function(data){
//    $("#users").empty();
//    $.each(data, function(key,value){
//      $('#users').append("<div>" + key + "</div>");
//    })
//  });


  socket.on('updatechat', function(username, msg){
    if (username == yourself){
      $('#messages').append("<div class='msg-container'><div class='message message-you'>" + msg + "</div></div>");
    } else {
      $('#messages').append("<div class='msg-container'><div class='message'>" + msg + "</div></div>");
    }
    $(".main .body").scrollTop($(".main .body").height())
  });

});