components.isometricView = function(){
	console.log('loading isometricView');
	window.IsometricView = Backbone.View.extend({
		el: $('#game'),
		events: {
			"click .clickable": "objectClicked"
		},
		initialize: function() {
			_.bindAll(this, 'loadRoom');
			this.render();
		},
		render: function() {
			$.get('/renders/isometric.html', function(t){
				this.el.html('');
				this.el.html(t);
				this.isometricMain = $('#isometric_main');
				this.transitionCanvas = $('#transitionCanvas')[0];
				this.transitionContext = this.transitionCanvas.getContext("2d");
				this.transitionVideo = $('#transitionVideo')[0];
				this.setupView();
			}.bind(this));
		},
		setupView: function() {
			this.loadRoom(1);
		},
		drawTransition: function() {
			this.transitionContext.drawImage(this.transitionVideo, 0,0,this.transitionCanvas.width,this.transitionCanvas.height);
				var self = this;
				_.delay(function(){
					self.drawTransition();
				}, 50);
		
		},
		loadRoom: function(roomNumber) {
			/*Initializes the html and isometric grids
			for a given room */
			me.roomNumber = roomNumber;
			switch(roomNumber){
				case 1:
					remote.playerJoinedIsometricRoom(me.roomNumber, me.id, {x:0,y:0,z:0});
					$.get('/renders/rooms/doctorsOffice.html', function(t){
						this.isometricMain.html('');
						this.isometricMain.html(t);
						(function($){ 
							$('#grid').iso({
							    unwalkables: [
									"3_0_0",
									"4_0_0",
									"5_0_0",
									"6_0_0",
									"7_0_0",
									"8_0_0",
							      	"9_0_0",
									"3_1_0",
									"4_1_0",
									"5_1_0",
									"6_1_0",
									"7_1_0",
									"8_1_0",
							      	"9_1_0",
									"3_4_0",
									"3_5_0",
									"4_3_0",
									"4_4_0",
							      	"4_5_0",
							      	"4_6_0",
							      	"4_7_0",
									"5_3_0",
							      	"5_4_0",
									"5_5_0",
									"5_6_0",
									"5_7_0",
									"6_4_0",
									"6_5_0",
									"6_6_0",
									"6_7_0",
									"7_7_0",
									"7_6_0",
									"7_5_0"
							    ], 
							    max_x: 10, 
							    max_y: 10,
							    avatar_offset: [4,-110],
								shadow_offset: [4,-8],
								tile_width:48,
							    tile_height:26,
							    iso_tile_height:26,
								roomNumber: 1
							  });
				
							  $('#grid').children().mouseenter(function(e) {
							    $(e.target).addClass('hover');
							  });

							  $('#grid').children().mouseleave(function(e) {
							    $(e.target).removeClass('hover');
							  });
							})(jQuery);
						}.bind(this));
						break;
				case 2:
					console.log("before 1?");
					remote.playerJoinedIsometricRoom(me.roomNumber, me.id, {x:9,y:4,z:3});
					$.get('/renders/rooms/room2.html', function(t){
						this.isometricMain.html('');
						this.isometricMain.html(t);
						(function($){
							var unwalkables = new Array();
							var elevateds = {};
							for(var x = 0; x < 10; x++)
								for(var y = 0; y<13; y++){
									if(x==9 && y<7){
										if(y>2){
											console.log(y);
											elevateds[""+x+"_"+y]=(7-y);
										}else{ 
											console.log("is fired");
											elevateds[""+x+"_"+y]=4;
										}
									}
									if(((x<4&&y<4) || y<2) || ((x>5&&x<9) && y<7)){
										if(elevateds[""+x+"_"+y])
											unwalkables.push(""+x+"_"+y+"_"+elevateds[""+x+"_"+y]);
										else
											unwalkables.push(""+x+"_"+y+"_0");
									}
								}
							console.log("stop");
							console.log(unwalkables);
							console.log(elevateds);
							console.log("end");
						
							$('#grid').iso({
								elevateds: elevateds,
								unwalkables: unwalkables,
							    max_x: 10, 
							    max_y: 13,
								startPosition: {x:9,y:4,z:3},
							    avatar_offset: [4,-110],
								shadow_offset: [4,-8],
								tile_width:48,
							    tile_height:26,
							    iso_tile_height:26,
								roomNumber: 2
							  });
							
							  $('#grid').children().mouseenter(function(e) {
							    $(e.target).addClass('hover');
							  });

							  $('#grid').children().mouseleave(function(e) {
							    $(e.target).removeClass('hover');
							  });
						})(jQuery);
				}.bind(this));
				break;
			}
		},
		objectClicked: function(e) {
			/*Handles the events triggered for clickable objects
			in a given room*/
			console.log(e.target.id);
			var position = jQuery.fn.iso.avatar.position;
			if(e.target.id == "whiteboard"){
				if(position[0]== 0 && (position[1]>1&&position[1]<7)){
					$('#message_info_text').html("Dang, all the markers are dried up!");
					$('#image_div').html("<img src='images/ed_head.png'/>");
				}else{
					$('#message_info_text').html("I'm pretty sure I need to be closer to the whiteboard to use it");
					$('#image_div').html("<img src='images/ed_head.png'/>");
				}
			}else if(e.target.id == "computerDesk"){
				if(position[1] == 2 && (position[0]>3 && position[0]<9)){
					remote.newCase(2, me, emit);
					new ComputerView(2);
				}else{
					$('#message_info_text').html("I think I need to be closer to the computer to use it");
					$('#image_div').html("<img src='images/ed_head.png'/>");
				}
			}else if((e.target.id == "message_help" || e.target.id == "no_selected")&&(me.roomNumber ==1)){
					$('#message_info_text').html("Walk around your office, click your computer to start contouring,"
					+" or click the whiteboard to draw for fun. "
					+"If you need help click the help box to your right.");
					$('#image_div').html("<img src='images/def_head.png'/>");
			}else if(e.target.id == "exitRoom"){
					$('#message_info_text').html("Are you sure you want to leave this room?"
					+"<div class='message_info_header clickable' id='yes_selected'>YES</div>"
					+"<div class='message_info_header clickable' id='no_selected'>NO</div>");
					$('#image_div').html("<img src='images/def_head.png'/>");
			}else if(e.target.id == "yes_selected"){
					$('#message_info_text').html("Leaving room");
					$('#grid').html('');
					$('#transitionCanvas').css('visibility','visible');
					//this.transitionVideo.play();
					this.drawTransition();
					this.loadRoom(2);
					remote.playerLeftIsometricRoom(me.roomNumber, me.id);
			}else{
				console.log("There's nothing there!");
			}
		}
	});
};
