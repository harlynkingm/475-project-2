$(document).ready(function(){
  var socket = io();
  
  var yourself;
  var lastUser;
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

  $("#newPartner").click(function(){
    console.log(person);
    socket.emit('connectToRoom', person);
    socket.emit('disconnectingFromPartner', person);
  });
  
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
  
  function addClasses(obj, classes){
    for(var i = 0; i < classes.length; i++){
      $(obj).addClass(classes[i]);
    };
  };
  
  function scrollBottom(){
    $(".main .body").scrollTop($("#messages").height());
  }
  
  $("#messages").on("load", function(){
    scrollBottom();
  });

  socket.on('updatechat', function(username, msg){
    // Assigns classes to message text
    var parentClasses = ["msg-container", "row"];
    var childClasses = ["message"];
    if (username == yourself) childClasses.push("message-you");
    if (username == lastUser) childClasses.push("message-nospace");
    
    // Prepares message div
    var parent = $("<div></div>");
    var child = $("<div></div>");
    parent.append(child);
    child.text(msg);
    addClasses(parent, parentClasses);
    addClasses(child, childClasses);
    
    // Adds message to body
    $("#messages").append(parent);
    
    // Scans message for image links
    var scan = msg.split();
    for (var i = 0; i < scan.length; i++){
      if (scan[i].endsWith('.gif') || scan[i].endsWith('.jpg') || scan[i].endsWith('.png')){
        
        // If image is found, prepare the parent
        var imgParent = $("<div></div>");
        addClasses(imgParent, ["row"]);
        
        // Gives the image a clickable link
        var imgLink = $("<a></a>");
        imgLink.attr("href", scan[i]).attr("target", "_blank");
        
        // Prepares the image in html
        var imgChild = $("<img>");
        imgChild.attr("src", scan[i]);
        var imgChildClasses = ["message-img"];
        if (username == yourself) imgChildClasses.push("message-img-you");
        if (username == lastUser) imgChildClasses.push("message-nospace");
        addClasses(imgChild, imgChildClasses);
        
        // Adds the image to the page
        imgParent.append(imgLink);
        imgLink.append(imgChild);
        $("#messages").append(imgParent);
      }
    }
    
    // Scrolls the page to the bottom
    scrollBottom();
    lastUser = username;
  });

});