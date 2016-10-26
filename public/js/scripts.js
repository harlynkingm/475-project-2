$(document).ready(function(){
  var socket = io();
  
  var yourself;
  var lastUser;

  socket.on('connect', function(){
    username = prompt("Whats your name??");
//    username = "MAX";
    yourself = username;
    socket.emit('adduser', username);
    socket.emit('assignRoom', username);
  });

  socket.on('disconnected', function(username){
    socket.emit('reassignRoom', username);
  })

  $('#send').click(function(){
    sendMessage($('#m').val());
    $('#m').val('');
  });
  
  $('#happy').click(function(){
    sendHappy();
  });
  
  function sendMessage(message){
    if (message){
      socket.emit('chat message', message);
    }
  }
  
  function sendHappy(){
    var happy = ["You're awesome!", "Yay!", "Woohoo!", "Wow!", "Amazing!", "Woot!", "Nice!", "Way to go!", "Cool!", "Sweet!", "Fantastic!", "Great!", "Wonderful!", "Majestic!", "Marvelous!", "You rock!", "Splendid!", "Super!", "Swell!", "Brilliant!", "Impressive!", "Very cool!", "Fabulous!", "Excellent!", "Outstanding!", "Perfect!", "Terrific!", "Splendiferous!", "Dazzling!", "Wicked!", "Delightful!"];
    var happyInt = Math.floor(Math.random() * happy.length);
    sendMessage(happy[happyInt]);
  }
  
  $(".message-content").keypress(function(e){
    switch (e.keyCode){
      case 13:
        e.preventDefault();
        sendMessage($('#m').val());
        $('#m').val('');
        break;
      default:
        break;
    }
  });

//  socket.on('updateusers', function(data){
//    $("#users").empty();
//    $.each(data, function(key,value){
//      $('#users').append("<div>" + key + "</div>");
//    })
//  });
  
  function addClasses(obj, classes){
    for(var i = 0; i < classes.length; i++){
      $(obj).addClass(classes[i]);
    };
  };

  socket.on('updatechat', function(username, msg){
    var parentClasses = ["msg-container", "row"];
    var childClasses = ["message"];
    if (username == yourself) childClasses.push("message-you");
    if (username == lastUser) childClasses.push("message-nospace");
    
    var parent = $("<div></div>");
    var child = $("<div></div>");
    parent.append(child);
    child.text(msg);
    addClasses(parent, parentClasses);
    addClasses(child, childClasses);
    
    $("#messages").append(parent);
    $(".main .body").scrollTop($(".main .body").height());
    lastUser = username;
  });

});