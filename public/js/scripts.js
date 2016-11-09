$(document).ready(function(){
  
  var yourself;
  var lastUser;
  myPartner = false;
  var numOfConnected;
  
  $("#startButton").on("click", function(){
    
    $("#info").fadeOut(400, function(){
      $("#startButton").remove();
      $("#info").css("cursor", "pointer");
    });
    
    var socket = io();
    
    $("#info").on("click", function(){
      $("#info").fadeOut();
    });
    
    $('#send').click(function(){
      sendMessage($('#m').val());
      $('#m').val('');
    });

    $('#happy').click(function(){
      sendHappy();
    });

    function sendMessage(message){
      if (message.startsWith("SERVER: ") || message.startsWith("HAPPY: ")){
        message = " " + message;
      }
      if (message){
        socket.emit('chat message', message);
      }
    }

    $("#newPartner").click(function(){
      if(myPartner){
        socket.emit('disconnectingFromPartner', myPartner);
        socket.emit('connectToRoom', myPartner);
        myPartner = false;
      }
    });

    function sendHappy(){
      var happy = ["You're awesome!", "Yay!", "Woohoo!", "Wow!", "Amazing!", "Woot!", "Nice!", "Way to go!", "Cool!", "Sweet!", "Fantastic!", "Great!", "Wonderful!", "Majestic!", "Marvelous!", "You rock!", "Splendid!", "Super!", "Swell!", "Brilliant!", "Impressive!", "Very cool!", "Fabulous!", "Excellent!", "Outstanding!", "Perfect!", "Terrific!", "Splendiferous!", "Dazzling!", "Wicked!", "Delightful!"];
      var happyInt = Math.floor(Math.random() * happy.length);
      socket.emit('chat message', "HAPPY: " + happy[happyInt]);
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

    $(window).on("resize", function(){
      scrollBottom();
    });

    $("#infoButton").on("click", function(){
      $("#info").fadeIn();
    });
  
    socket.on('connectedUsers', function(count){
      $("#usercount").text(count);
    });
    
    socket.on('connect', function(){
      socket.emit('adduser');
    });

    socket.on('connectedUsers', function(count){
      numOfConnected = count;
    })

    socket.on('giveID', function(id){
      yourself = id;
      socket.emit('connectToRoom', false);
    })

    socket.on('assignPartner', function(partner){
      myPartner = partner;
      socket.emit('acceptPartner', partner);
    })

    socket.on('newPartner', function(partner){
      socket.emit('connectToRoom', partner);
    })


    socket.on('updatechat', function(username, msg){
      var isYou = (username == yourself);

      // Assigns classes to message text
      var parentClasses = ["msg-container", "row"];
      var childClasses = ["message"];
      if (isYou){
        if (msg.startsWith("SERVER: ")){
          childClasses.push("message-server");
          msg = msg.split("SERVER: ")[1];
        } else {
          childClasses.push("message-you");
        }
      }
      if (username == lastUser) childClasses.push("message-nospace");
      if (msg.startsWith("HAPPY: ")){
        childClasses.push("message-happy");
        childClasses.push("u-noselect");
        msg = msg.split("HAPPY: ")[1];
        if (isYou){
          childClasses.push("message-happy-you");
        }
      }

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

          // Scrolls page down once the image is loaded  
          $(imgParent).imagesLoaded( function(){
            scrollBottom();
          });
        }
      }

      // Scrolls the page to the bottom
      scrollBottom();
      lastUser = username;
    });
    
  });

});