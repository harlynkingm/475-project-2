$(document).ready(function(){
  var socket = io();
  
  var yourself;
  var person;

  socket.on('connect', function(){
    socket.emit('adduser');
  });

  socket.on('giveID', function(id){
    yourself = id;
    socket.emit('connectToRoom', false);
  })

  socket.on('assignPartner', function(partner){
    person = partner;
    socket.emit('acceptPartner', partner);
  })

  socket.on('newPartner', function(){
    socket.emit('connectToRoom', person);
  })

  socket.on('deleteConnectionToPartner', function(){
    socket.emit('deleteConnectionToPartner');
  })

  $('#send').click(function(){
    sendMessage();
  });
  
  function sendMessage(){
    if ($('#m').val()){
      socket.emit('chat message', $('#m').val());
      $('#m').val('');
    }
  }

  $("#newPartner").click(function(){
    console.log(person);
    socket.emit('connectToRoom', person);
    socket.emit('disconnectingFromPartner', person);
  });
  
  $(".message-content").keypress(function(e){
    switch (e.keyCode){
      case 13:
        e.preventDefault();
        sendMessage();
        break;
      default:
        break;
    }
  });



  socket.on('updatechat', function(username, msg){
    if (username == yourself){
      $('#messages').append("<div class='msg-container'><div class='message message-you'>" + msg + "</div></div>");
    } else {
      $('#messages').append("<div class='msg-container'><div class='message'>" + msg + "</div></div>");
    }
    $(".main .body").scrollTop($(".main .body").height())
  });

});