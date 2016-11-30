$(document).ready(function(){
  
  
  var yourself;
  var lastUser;
  myPartner = false;
  var numOfConnected;
  var typing = false;
  
  $("#report").hide();
  
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
      if (message.startsWith("SERVER: ") || message.startsWith("HAPPY: ") || message.startsWith("REVEAL: ")){
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
      }else{
        socket.emit('message myself');
      }
    });

    $("#reportButton").click(function(){
      //sends to server to go fetch my partners andrew id
      $("#report").fadeIn();
    });
    
    $("#report").click(function(){
      $("#report").fadeOut();
    });
    
    $("#reportPartner").click(function(e){
      e.preventDefault();
      var msg = $("#report-form :input[name=reason]").val();
      var reason = $("#report-form :input[name=report-type]:checked").val();
      if (msg.length){
        msg = `User was reported for reason: ${reason}. ` + msg; 
        socket.emit('reportPartner', localStorage.getItem("username"), myPartner, msg);
        $("#report").fadeOut();
      }
    });
    
    $(".center-box").click(function(e){
      e.stopPropagation();
    });
    
    socket.on('getID', function(reporter, message){
      // send back to the server with my andrew id
      socket.emit('report', localStorage.getItem("username"), reporter, message);
    })

    $("#revealYourself").click(function(){
      socket.emit('reveal', localStorage.getItem("username"));
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
          socket.emit('stop-typing');
          typing = false;
          break;
        default:
          break;
      }
    });
    
    
    $("#m").on('input', function(){
      if ($(this).val() != '' && !typing){
        socket.emit('start-typing');
        typing = true;
      } else if ($(this).val() == '' && typing){
        socket.emit('stop-typing');
        typing = false;
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
    
    socket.on('start-typing', function(){
      var parentClasses = ["msg-container", "row", "u-noselect", "message-typing"];
      var childClasses = ["message"];
      var parent = $("<div></div>");
      var child = $("<img></img>");
      parent.append(child);
      child.attr("src", "./images/icons/ellipsis.svg");
      addClasses(parent, parentClasses);
      addClasses(child, childClasses);
      $("#messages").append(parent);
    })
    
    socket.on('stop-typing', function(){
      $(".message-typing").remove();
    })

    socket.on('setPartnerFalse', function(){
      myPartner = false;
    })


    socket.on('updatechat', function(username, msg){
      var isYou = (username == yourself);
      var useHTML = false;

      // Assigns classes to message text
      var parentClasses = ["msg-container", "row"];
      var childClasses = ["message"];
      
//      switch (type) {
//        case "SERVER":
//          break;
//        case 
//      }
      
      if (isYou){
        if (msg.startsWith("SERVER: ")){
          childClasses.push("message-server");
          childClasses.push("u-noselect");
          msg = msg.split("SERVER: ")[1];
        } else if (msg.startsWith("REVEAL: ")){
          childClasses.push("message-server");
          childClasses.push("u-noselect");
          childClasses.push("message-reveal")
          msg = msg.split("REVEAL: ")[1];
          useHTML = true;
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
      if (useHTML) {
        child.html(msg);
      } else {
        child.text(msg);
      }
      addClasses(parent, parentClasses);
      addClasses(child, childClasses);

      // Adds message to body
      $("#messages").append(parent);

      // Scans message for image links
      var scan = msg.split(' ');
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
        if (scan[i].startsWith('http') || scan[i].endsWith('.html')){
          scan[i] = "<a href='" + scan[i] + "' target='_blank'>" + scan[i] + "</a>";
          child.html(scan.join(' '));
        }
      }

      // Scrolls the page to the bottom
      scrollBottom();
      lastUser = username;
    });
    
  });

});