components.drawing = function(){
	console.log('loaded drawing');
	window.invitation = {};
	window.pendingMessages = 0;
	window.ComputerView = Backbone.View.extend({
		el: $('#game'),
		events: {
			'click #back_to_cases': 'goBack',
			'click #current_case_info_open': 'expandInfo', //added to allow current case info roll down
			'click #current_case_info_close': 'retractInfo', //added to allow current case info roll up
			'click #expand_collapse_button':'chatExpandRetract',
			'click #chat_notification' : 'chatExpandRetract',
			"mousedown #doubleBufferedCanvas": "startLine",
			"mousemove #doubleBufferedCanvas" : "drawLine",
			"mouseup #doubleBufferedCanvas": "endLine",
			"mouseout #doubleBufferedCanvas": "endLine",
			"change .slider": "changeLayer",
			'click #invite_friends':'inviteFriends',
			'click #hide_drawing':'hideDrawing',
			'click #reset_drawing':'resetDrawing',
			"click #drawingTool": "drawTool",
			"click #erasingTool": "eraseTool",
			'click #team_tab':'teamTab',
			'click #online_tab':'onlineTab',
			'click #friends_tab':'friendsTab',
			'click #undoTool': 'undoTool',
			'click #send_chat':'sendChat',
			'keyup #type':'sendChat',
			'click #score_button':'scoreButton',
			'click #individual_score_close':'closeIndiScore',
			"click #done_button": "doneButton",
			"click #accept_invite":"pagerAcceptInvite",
			"click #decline_invite":"pagerDeclineInvite",
			"click #invite":"invite",
			"click #dont_invite":"dontInvite",
			'click #cursorTool':'cursorTool',
			'click #zoomInTool':'zoomIn',
			'click #zoomOutTool':'zoomOut',
			'mousemove #scan_container': 'cursorMovement',
			'click #open_leaderboard_button':'openLeaderboardButton',
			'click #close_scorecard_button':'closeScorecardButton'
		},
		initialize: function(caseNum) {
			_.bindAll(this, 'render', 'newCursorPosition');		
			this.zoom = 1;
			this.locked = false;
			this.chatExpanded = false;
			this.infoExpanded = false;
			this.cursorToolEnabled = true;
			this.caseNum = caseNum;
			this.everyoneDone = false;
			this.hideEveryone = false;
			this.render();
		},
		render: function() {
			if (view.computer) {
				this.el.html('');
				this.el.html(view.computer);
				this.setupView();
			} else {
				$.get('/renders/computer2.html', function(t){
					console.log ('cached drawing');
					this.el.html('');
					view.computer = t;
					this.el.html(view.computer);
					this.setupView();
				}.bind(this));
			}
		},
		setupView: function() {
			window.friendbar = new FriendBar;
			this.otherPlayersCanvasArray = {};
			this.otherPlayersContextArray = {};
			this.canvasIndex = 0;
			this.index = 0;
			var self = this;
			online_friends.each(function(item){
				var playerID = item.get('id');
				if(playerID != me.id){
					console.log($('.otherPlayerCanvas'));
					console.log(playerID);
					console.log(me.id);
					console.log(self.index);
					self.otherPlayersCanvasArray[playerID] = ($('.otherPlayerCanvas')[self.index]);
					self.otherPlayersContextArray[playerID] = self.otherPlayersCanvasArray[playerID].getContext("2d");
					self.otherPlayersContextArray[playerID].globalCompositeOperation = "source-over"; //Needed to erase 
					self.otherPlayersContextArray[playerID].lineCap = "butt"; 
					self.index++;
					console.log("won't work if this logs");
				}
			});
			this.myPlayerCanvas = $('#myPlayerCanvas')[0];
			this.myPlayerContext = this.myPlayerCanvas.getContext("2d");
			this.singleBufferCanvas = $('#singleBufferedCanvas')[0];
			this.singleBufferContext = this.singleBufferCanvas.getContext("2d");
			this.doubleBufferCanvas = $('#doubleBufferedCanvas')[0];
			this.doubleBufferContext = this.doubleBufferCanvas.getContext("2d");
			this.isErasing = false;
			this.myPlayerContext.clearRect(0, 0, this.myPlayerCanvas.width, this.myPlayerCanvas.height);
			this.myPlayerCanvas.width = this.myPlayerCanvas.width;
			this.singleBufferContext.clearRect(0, 0, this.singleBufferCanvas.width, this.singleBufferCanvas.height);
			this.singleBufferCanvas.width = this.singleBufferCanvas.width;
			this.doubleBufferContext.clearRect(0, 0, this.doubleBufferCanvas.width, this.doubleBufferCanvas.height);
			this.doubleBufferCanvas.width = this.doubleBufferCanvas.width;


			/* Retreive chat messages */
			remote.getChatHistoryForActivity(me.get('current_case_id'), emit);
						
			/* Retrieve my color */
			remote.getColor(me.get('current_case_id'), me.get('id'), emit);
			
			/*********************************************
			*               Event listeners              *
			*********************************************/
			
			em.on('playerLeft', function (player_id){
				online_friends.fetch();
			});
			
			em.on('playerIsDone', function (player){
					online_friends.get(player.id).set({isDone:true});
			}.bind(this));
			
			em.on('playerSubmitted', function (player){
					online_friends.get(player.id).set({hasSubmitted:true});
			}.bind(this));
			
			em.on('playerNotDone', function (player){
				if (player.current_case_id == me.get('current_case_id')){
					online_friends.get(player.id).set({isDone:false});
					online_friends.get(player.id).set({hasSubmitted:false});
					this.everyoneDone = false;
					this.$('#score_button').removeClass('red_button');
					this.$('#score_button').addClass('red_button_disabled');
				}
			}.bind(this));
			
			em.on('everyoneIsDone', function (player){
				if (player.current_case_id == me.get('current_case_id')){
					this.everyoneDone = true;
					this.$('#score_button').addClass('red_button');
					this.$('#score_button').removeClass('red_button_disabled');
				}
			}.bind(this));

			em.on('allScores', function (scores){
				this.showAllScores(scores);

			}.bind(this));
			em.on('setColor', function (color){
				me.set({player_color:color.payload},{silent: true});
				online_friends.get(me.get('id')).set({player_color:color.payload},{silent: true});
				online_friends.fetch();
			});
			
			em.on('pointColored', function (player_id, firstPoint, lastPoint) {
				if (online_friends.get(player_id).get('layer_enabled')){
					if(player_id != me.id)
						this.localDrawEvent(firstPoint, lastPoint, online_friends.get(player_id).get('player_color'), this.otherPlayersContextArray[player_id]);	
				}
			}.bind(this));
			
			em.on('canvasCleared', function (player_id, player_layer) {
				if (layer == player_layer){
					if(player_id == me.id){
						this.myPlayerContext.clearRect(0, 0, this.myPlayerCanvas.width, this.myPlayerCanvas.height);	
						this.myPlayerCanvas.width =  this.myPlayerCanvas.width;
					}else if (this.otherPlayersContextArray[player_id] != null && this.otherPlayersContextArray[player_id] != undefined){
						this.otherPlayersContextArray[player_id].clearRect(0, 0, this.myPlayerCanvas.width, this.myPlayerCanvas.height);	
						this.otherPlayersCanvasArray[player_id].width =  this.otherPlayersCanvasArray[player_id].width;
					}
				}
			}.bind(this));
			
			em.on('pointErased', function(player_id, firstPoint, lastPoint) {
				if (online_friends.get(player_id).get('layer_enabled')){
					if(player_id != me.id)
						this.localEraseEvent(firstPoint, lastPoint, this.otherPlayersContextArray[player_id]);	
				}	
			}.bind(this));
			
			//Needs removal
			if(false){ 
						self.setGoalPointsForCase('images/cases/case1/perfect3F.png', 3);
					}

			em.on('setScoreForCase', function(data) {
				var targetHit = data.payload.tumorHit;
				var healthyHit = data.payload.healthyHit;
				targetHit = Clamp(targetHit, 0, 100);
				healthyHit = Clamp(healthyHit, 0, 100) / 4;
				var friend = me;
				var nameString = 'Individual Score for: <span style="color:#' + friend.get("player_color") + '">'+friend.get('name')+'</span>'
				var scoreString = '<span class="des_cancer">' + (targetHit).toFixed(0) + '</span> - <span class="des_healthy">'+ ((healthyHit)).toFixed(0) +'</span> = <span style="color:#' + friend.get("player_color") + '">'+ ((targetHit) - (healthyHit)).toFixed(0) +'</span>'
				$('#individual_score_name').html(nameString);
				$('#individual_score_score').html(scoreString);				
				$('#individual_score_card').removeClass('individual_score_retract');
				$('#individual_score_card').removeClass('individual_score_closed');
				$('#individual_score_card').addClass('individual_score_extend');
				console.log("Score value is");
				console.log(data.payload);
			}.bind(this));
			
			var Clamp = function (v, min, max){
				if (v>max){v=max;}
				if (v<min){v=min;}
				return v;
			}
			
			em.on('setColoredPointsForThisLayer', function(points){
				if(points) {
					var color = online_friends.get(points.player).get('player_color');
					var pointArr = new Array();
					var playerID = points.player;
					if(me.id != playerID && !this.otherPlayersCanvasArray[playerID]){
						this.otherPlayersCanvasArray[playerID] = ($('.otherPlayerCanvas')[this.index]);
						this.otherPlayersContextArray[playerID] = this.otherPlayersCanvasArray[playerID].getContext("2d");
						this.index++;
					}
					for(key in points.payload) {
						if(points.payload[key].point.layer == window.layer)
							pointArr.push(points.payload[key].point);
					}
					if(playerID == me.id) this.colorPoint(pointArr, color, this.myPlayerContext);
					else this.colorPoint(pointArr, color, this.otherPlayersContextArray[playerID]);
				}
			}.bind(this));

			//Removed the below function from apps.js, placed here to make it more relevant for the drawing pager.  This will be changed later. 
			em.on('JoinRequest', function(activity_id, case_number, player_id, player_name, player_avatar) {
				invitation['activity_id'] = activity_id;
				invitation['case_number'] = case_number;
				invitation['player_id'] = player_id;
				invitation['player_name'] = player_name;
				invitation['player_avitar'] = player_avatar;
				$('.pager_facebook_image').attr('style', 'background: url(\'' + player_avatar + '?type=normal\') no-repeat; ');
				$('#invitation_text').html('<h3>' + player_name + ' requests your opinion.</h3>');
				console.log ('received invitation');
				this.showPager(true);
			}.bind(this));
			
			// event listener for chat
			em.on('setChatHistory', this.setChatHistory);
			em.on('newChat', this.receiveChat);			
			em.on('newCursorPosition', this.newCursorPosition);
			
			/*********************************************/
			
			// fixtures for the images (scans):
			// Needs refactoring
			console.log (this.caseNum);
			
		/*	this.imageArray = new Array();
			this.layerImage = new Image();
			if(this.caseNum == 1){
				this.imageArray = ['/images/cases/case3/1.png', '/images/cases/case3/2.png'];
			}else{
				this.imageArray = ['/images/cases/case1/1.png', '/images/cases/case1/2.png','/images/cases/case1/3.png', '/images/cases/case1/4.png'];
			}
			
			for(imageSrc in this.imageArray) this.layerImage.src = imageSrc;
			*/
			if(this.caseNum == 1){
				var imageRefs = ['/images/cases/case3/1.png', '/images/cases/case3/2.png'];
			}else{
				var imageRefs = ['/images/cases/case1/1.png', '/images/cases/case1/2.png','/images/cases/case1/3.png', '/images/cases/case1/4.png'];
			}
			this.$('#slider_input').attr('style', 'width:' + ((imageRefs.length - 1) * 28));
			
			
			this.layerCount = imageRefs.length;
			var slider;
			slider = YAHOO.widget.Slider.getHorizSlider("slider-bg", "slider-thumb", 0, (this.layerCount - 1) * 40, 40);
			slider.subscribe('change', function(){
				this.changeLayer(slider.getValue() / 40);
			}.bind(this));
			$('#slider-bg').css({'height': 20, 'width':(imageRefs.length) * 33});
			var counter = 0;
			imageRefs.forEach(function(img){
				var distance = (counter * 40) + 5;
				var tickTemplate = '<div class="tick" style="padding-left:' + distance + 'px;">' + (counter + 1) + '</div>';
				this.$('#images').append('<img src="'+img+'" style="display: none; horizontal-align: center; vertical-align: center;" />');
				this.$('#tick_holder').append(tickTemplate);
				counter++;
			});
			
			layers = this.$('#images').children();
			$(layers[0]).show();
			// refactor to put images/slides/layers ?? into models/collections with attribute active: true
			window.layer = 0;
			remote.getColoredPointsForThisLayerAndPlayer(me.get('current_case_id'), me.get('id'), me.get('id'), layer, emit);
		},
		removeAllListeners: function() {
			em.removeAllListeners('pointColored');
			em.removeAllListeners('playerLeft');
			em.removeAllListeners('canvasCleared');
			em.removeAllListeners('pointErased');
			em.removeAllListeners('setColoredPointsForThisLayer');
			em.removeAllListeners('JoinRequest');
			em.removeAllListeners('setChatHistory');
			em.removeAllListeners('newChat');
			em.removeAllListeners('newCursorPosition');
			em.removeAllListeners('playerNotDone');
			em.removeAllListeners('everyoneIsDone');
			em.removeAllListeners('scoreEveryone');
			em.removeAllListeners('setGoalPointsForCase');
			em.removeAllListeners('setScoreForCase');
		},
		openLeaderboardButton: function(e){
			e.preventDefault();
			this.goBack(e);
		},
		closeScorecardButton: function (e){
			e.preventDefault();
			this.goBack(e);
		},
		goBack: function(e) {
			e.preventDefault();
			me.set({current_case_id:0},{silent:true});
			view.computer = null;
			this.removeAllListeners();
			delete this;
			new CaseView();
		},
		colorPoint: function(points, color, context) {
			var imageData = context.getImageData(0, 0, this.myPlayerCanvas.width*this.zoom, this.myPlayerCanvas.height*this.zoom);
			var pix = imageData.data;
			var redVal = (parseInt(color.substr(0,2),16));
			var greenVal = (parseInt(color.substr(2,2),16));
			var blueVal = (parseInt(color.substr(4,2),16));
			for(var c = 0; c < points.length; c++){
				var point = points[c];
				var x = point.x;
				var y = point.y; 
				var slide = point.layer;
				if(layer == slide) {
					if(x>0&&y>0){
							pix[((y*(imageData.width*4)) + (x*4)) + 0]=redVal;
							pix[((y*(imageData.width*4)) + (x*4)) + 1]=greenVal;
							pix[((y*(imageData.width*4)) + (x*4)) + 2]=blueVal;
							pix[((y*(imageData.width*4)) + (x*4)) + 3]=255;	
					}
				}
			}
			context.clearRect(0, 0, this.myPlayerCanvas.width, this.myPlayerCanvas.height);
			context.putImageData(imageData, 0, 0);	
			this.canvasBuffer();
		},
		localDrawEvent: function(firstPoint, lastPoint,color,context){
			if(layer == firstPoint.layer){
				context.beginPath();
				context.strokeStyle = '#' + color;
				context.lineWidth = "1"; 
				context.moveTo(firstPoint.x*this.zoom, firstPoint.y*this.zoom);
				context.lineTo(lastPoint.x*this.zoom, lastPoint.y*this.zoom);
				context.stroke();	
				this.canvasBuffer();		
			}
		},
		localEraseEvent: function(firstPoint, lastPoint, context){
			if(layer == firstPoint.layer){
				context.globalCompositeOperation = "destination-out";
				context.beginPath();
				var tempStrokeStyle = context.strokeStyle;
				context.strokeStyle = "rgba(0,0,0,1)";
				context.lineWidth = ""+(10);
				var offset = Math.floor(context.lineWidth/2);
				context.moveTo(firstPoint.x*this.zoom, firstPoint.y*this.zoom);
				context.lineTo(lastPoint.x*this.zoom, lastPoint.y*this.zoom);
				context.stroke();
				context.strokeStyle = tempStrokeStyle;
				context.globalCompositeOperation = "source-over";
				this.canvasBuffer();
			}
		},
		clean: function(){
				this.getColorPointsForLayerAndPlayer(false);
				this.canvasBuffer();
		},
		zoomIn: function(event){
			event.preventDefault();
			if(this.zoom == 1){
				this.zoom = 2;
				/*this.myPlayerContext.clearRect(0, 0, this.myPlayerCanvas.width, this.myPlayerCanvas.height);
				for(arrKey in this.otherPlayersContextArray){
					this.otherPlayersContextArray[arrKey].clearRect(0, 0, this.myPlayerCanvas.width, this.myPlayerCanvas.height);
				}		
				for(arrKey in this.otherPlayersCanvasArray){
					this.otherPlayersCanvasArray[arrKey].width = this.otherPlayersCanvasArray[arrKey].width;
				}*/							
				this.zoomXOffset = event.clientX-this.doubleBufferCanvas.offsetLeft;
				this.zoomYOffset = event.clientY-this.doubleBufferCanvas.offsetTop;
				this.$('#scan_container').css('overflow', "scroll");		
				var halfHeight = Math.floor(this.$('#scan_container').attr('scrollHeight')/4);
				var halfWidth = Math.floor(this.$('#scan_container').attr('scrollWidth')/4);		
				for(arrKey in layers){
					layers[arrKey].height *= 2;
				}
				this.$('#scan_container')[0].scrollTop = halfHeight;
				this.$('#scan_container')[0].scrollLeft = halfWidth;
				this.$('#scan_container')[0].scrollTop = halfHeight;
				this.$('#scan_container')[0].scrollLeft = halfWidth;
				this.canvasBuffer();
			}
		},
		zoomOut: function(event){
			event.preventDefault();
			if(this.zoom == 2){
				/*this.myPlayerContext.clearRect(0, 0, this.myPlayerCanvas.width, this.myPlayerCanvas.height);
				for(arrKey in this.otherPlayersContextArray){
					this.otherPlayersContextArray[arrKey].clearRect(0, 0, this.myPlayerCanvas.width, this.myPlayerCanvas.height);
				}
				for(arrKey in this.otherPlayersCanvasArray){
					this.otherPlayersCanvasArray[arrKey].width = this.otherPlayersCanvasArray[arrKey].width;
				}*/
				this.zoom = 1;
				for(arrKey in layers){
					layers[arrKey].height /= 2;
				}
				this.$('#scan_container')[0].scrollTop = 0;
				this.$('#scan_container')[0].scrollLeft = 0;
				this.$('#scan_container').css('overflow', "hidden");
				this.canvasBuffer();
			}
		},
		erasePoint: function(points,context) {
			var imageData=context.getImageData(0, 0, this.myPlayerCanvas.width*this.zoom, this.myPlayerCanvas.height*this.zoom);
			var pix = imageData.data;
			for(var c = 0; c < points.length; c++){
				var point = points[c];
				var x = point.x;
				var y = point.y; 
				var slide = point.layer;
				if(layer == slide) {
					if(x>0&&y>0){
						if(this.zoom == 1){
							pix[((y*(imageData.width*4)) + (x*4)) + 3]=0;
						}else if(this.zoom == 2){
							pix[(((2*y+0)*(imageData.width*4)) + ((2*x+0)*4)) + 3]=0;
							pix[(((2*y+0)*(imageData.width*4)) + ((2*x+1)*4)) + 3]=0;
							pix[(((2*y+1)*(imageData.width*4)) + ((2*x+0)*4)) + 3]=0;
							pix[(((2*y+1)*(imageData.width*4)) + ((2*x+1)*4)) + 3]=0;
						}			

					}
				}
			}
			context.clearRect(0, 0, this.myPlayerCanvas.width, this.myPlayerCanvas.height);
			context.putImageData(imageData, 0, 0);		
			this.canvasBuffer();
		},
		removeDuplicateElement: function(arrayName){
		        var newArray=new Array();
		        for(var i=0; i<arrayName.length;i++ )
		        {  
					var j;
		          	for(j=0; (newArray[j]!=arrayName[i]) && j<newArray.length;j++ );
		          	if(j==newArray.length) newArray[newArray.length] = arrayName[i];
		        }
		        return newArray;
		},
		startLine: function(event) {
			event.preventDefault();
				if(this.isErasing){
					this.myPlayerContext.globalCompositeOperation = "destination-out"; //Needed to erase 
				}
				this.isDrawing = true;
				this.oldX = event.clientX - this.doubleBufferCanvas.offsetLeft;
				this.oldY = event.clientY - this.doubleBufferCanvas.offsetTop;
		},
		drawLine: function(event) {
			event.preventDefault();
			if(this.isDrawing && !this.locked) {
				var xvar = event.clientX - this.doubleBufferCanvas.offsetLeft;
				var yvar = event.clientY - this.doubleBufferCanvas.offsetTop;
				var points = new Array();
				var delX = (xvar-this.oldX);
				var delY = (yvar-this.oldY);
				var arrayPos = 0;
				if(Math.abs(delX)>Math.abs(delY)){
					var stepCount = Math.abs(delX);
					var isVertical = true;
				}else{
					var stepCount = Math.abs(delY);
					var isVertical = false;
				}				
				if(this.isErasing){var penWidth = 4;}
				else{ var penWidth = 1;}
				var self = this;
				var leftOffset = Math.floor(this.$('#scan_container')[0].scrollLeft/2);
				var topOffset = Math.floor(this.$('#scan_container')[0].scrollTop/2);
				var xProcess = function(x) {return (Math.floor(x/self.zoom)+leftOffset);};
				var yProcess = function(y) {return (Math.floor(y/self.zoom)+topOffset);};
				for(var c = 0; c <= stepCount; c++){
					var curX = Math.floor(this.oldX+(delX/stepCount)*(c+1));
					var curY = Math.floor(this.oldY+(delY/stepCount)*(c+1));
					if(isVertical){
						for (var ySubset = curY; ySubset < curY+penWidth; ySubset++)
							if(ySubset>0 && ySubset<this.myPlayerCanvas.height){
								points[arrayPos] = {x: xProcess(curX),
									y:  yProcess(ySubset),
									layer: layer};
								arrayPos++;
							}
					}else{
						for (var xSubset = curX; xSubset < curX+penWidth; xSubset++)
							if(xSubset>0 && xSubset<this.myPlayerCanvas.width){
								points[arrayPos] = {x: xProcess(xSubset),
									y: yProcess(curY),
									layer: layer};
								arrayPos++;
							}
					}
				}
				var firstPoint = { x: xProcess(this.oldX)/this.zoom, y: yProcess(this.oldY)/this.zoom, layer: layer};
				var lastPoint = { x: xProcess(xvar)/this.zoom, y: yProcess(yvar)/this.zoom, layer: layer};									
				this.oldX = xvar;
				this.oldY = yvar;
				if(this.isErasing){
					remote.pointErased(me.get('current_case_id'), me.id, points);
					this.localEraseEvent(firstPoint, lastPoint, this.myPlayerContext);
				}else{
					remote.pointColored(me.get('current_case_id'), me.id, points);
					this.localDrawEvent(firstPoint, lastPoint, me.get('player_color'), this.myPlayerContext);
				}
				this.canvasBuffer();
			}
		},
		endLine: function(event) {
			event.preventDefault();
			if(this.myPlayerContext.globalCompositeOperation != "source-over"){
				this.myPlayerContext.globalCompositeOperation = "source-over";
			}
			this.isDrawing = false;			
		},
		drawTool: function(event) {
			event.preventDefault();
			this.isErasing = false;
			$('#doubleBufferedCanvas')[0].style.cursor='url(images/brush_cursor.png) 3 27';
			this.clearButtonStyles();
			this.$('#drawingTool').addClass('red_button_active');
			this.$('#erasingTool').addClass('red_button');
		},
		eraseTool: function(event) {
			event.preventDefault();
			this.isErasing = true;
			$('#doubleBufferedCanvas')[0].style.cursor='url(images/eraser_cursor.png) 3 27';
			this.clearButtonStyles();
			this.$('#erasingTool').addClass('red_button_active');
			this.$('#drawingTool').addClass('red_button');
		},
		clearButtonStyles : function (){
			this.$('#drawingTool').removeClass('red_button_active');
			this.$('#erasingTool').removeClass('red_button_active');
			this.$('#drawingTool').removeClass('red_button');
			this.$('#erasingTool').removeClass('red_button');	

		},
		changeLayer: function(sliderValue) {
			if(sliderValue != layer){
			  // remove all cursors
			  $('.cursors').each(function(i, el) {
			    $(el).remove();
			  });
			  	layer = sliderValue;
				this.myPlayerContext.clearRect(0, 0, this.myPlayerCanvas.width, this.myPlayerCanvas.height);
				for(ctxKey in this.otherPlayersContextArray){
					this.otherPlayersContextArray[ctxKey].clearRect(0, 0, this.myPlayerCanvas.width, this.myPlayerCanvas.height);
				}
				
				for(arrKey in this.otherPlayersCanvasArray){
					this.otherPlayersCanvasArray[arrKey].width = this.otherPlayersCanvasArray[arrKey].width;
				}
				
				layers.each(function(n, el){
					if(layer != n) {
						$(el).hide();
					} else {
						$(el).show();
						$('#slide').html('#'+(n+1));
					}
				});
				var wasZoomedIn = (this.zoom == 2);
				if(wasZoomedIn) this.zoom == 1;
				this.getColorPointsForLayerAndPlayer(false);
				if(wasZoomedIn) this.zoom == 2;
				this.canvasBuffer();
			}
		},
		arrayMin: function(array) {
			var curMin = array[0];
			for(var c = 1; c < array.length; c++)
				if(curMin > array[c])curMin = array[c];
			return curMin;
		},
		blobify: function(imageData, color, context){
				var pixelStack = [[0, 0]];
				var width = imageData.width;
				var height = imageData.height;
				var pix = imageData.data;
				while(pixelStack.length)
				{
					var newPos, x, y, pixelPos, reachLeft, reachRight;
					newPos = pixelStack.pop();
					x = newPos[0];
					y = newPos[1];
					pixelPos = (y*width + x) * 4;
					while(y-- >= 0 && pix[pixelPos+3]==0){
						pixelPos -= width * 4;
				  	}
				  	pixelPos += width * 4;
				  	++y;
				  	reachLeft = false;
				  	reachRight = false;
				  	while(y++ < height-1 && pix[pixelPos+3]==0)
				  	{
				 		pix[pixelPos]=0;
						pix[pixelPos+1]=0;
						pix[pixelPos+2]=0;
						pix[pixelPos+3]=255;
				    	if(x > 0)
				    	{
				      		if(pix[(pixelPos - 4)+3]==0)
				      		{
				        		if(!reachLeft){
				          			pixelStack.push([x - 1, y]);
				          			reachLeft = true;
				        		}
				      		}
				      		else if(reachLeft)
				      		{
				        		reachLeft = false;
				      		}
				    	}
				    	if(x < width-1)
				    	{
				      		if(pix[(pixelPos + 4)+3]==0)
				      			{
				        			if(!reachRight)
				        			{
				          				pixelStack.push([x + 1, y]);
				          				reachRight = true;
				        			}
				      			}
				      			else if(reachRight)
				      			{
									reachRight = false;
				    			}
				    		}
				    		pixelPos += width * 4;
						}
					}
					imageData.data = pix;
					var redVal = (parseInt(color.substr(0,2),16));
					var greenVal = (parseInt(color.substr(2,2),16));
					var blueVal = (parseInt(color.substr(4,2),16));
					//Uninvert the blobify
					for(var y = 0; y < imageData.height; y++){
						for(var x = 0; x < imageData.width; x++){
							if(imageData.data[((y*(imageData.width*4)) + (x*4)) + 3] == 0){
								imageData.data[((y*(imageData.width*4)) + (x*4)) + 0]=redVal;
								imageData.data[((y*(imageData.width*4)) + (x*4)) + 1]=greenVal;
								imageData.data[((y*(imageData.width*4)) + (x*4)) + 2]=blueVal;
								imageData.data[((y*(imageData.width*4)) + (x*4)) + 3]=100;
							}else if( (imageData.data[((y*(imageData.width*4)) + (x*4)) + 0] == 0)	
									&& (imageData.data[((y*(imageData.width*4)) + (x*4)) + 1] == 0)	
									&& (imageData.data[((y*(imageData.width*4)) + (x*4)) + 2] == 0)){	
								imageData.data[((y*(imageData.width*4)) + (x*4)) + 3]=0;	
							}
						}

					}
					context.clearRect(0, 0, this.myPlayerCanvas.width, this.myPlayerCanvas.height);
					context.putImageData(imageData, 0, 0);
					return imageData;
				},
		scoreButton: function(e){
			e.preventDefault();
			if (this.everyoneDone){
				//get everyone's scores.
				remote.getScores(me.get('current_case_id'), me);
			}else{
				//do nothing
			}
			
		},
		closeIndiScore: function (e) {
			e.preventDefault();
			$('#individual_score_card').removeClass('individual_score_extend');
			$('#individual_score_card').addClass('individual_score_retract');
		},
		doneButton: function (e){
			e.preventDefault();
			this.locked = !this.locked;
			if (this.locked){
				//remote.done(me.get('current_case_id'), me);
				this.getColorPointsForLayerAndPlayer(true);
				this.done();
				$('#done_text').text('UNLOCK');
			}else{
				$('#individual_score_card').removeClass('individual_score_extend');
				$('#individual_score_card').addClass('individual_score_retract');
				remote.notDone(me.get('current_case_id'),me);
				$('#done_text').text("I'M DONE");
			}
		},
		done: function() {
			/* Retreive score */
			remote.getScoreForCase(me.get('current_case_id'), me, this.myPlayerCanvas.width, this.myPlayerCanvas.height, this.layerCount, emit);
			//Show small done display
			this.clean();
			var self = this;
			var totalScore = 0;
			var totalPlayers = 0;
			var color = me.get('player_color');
			var context = this.myPlayerContext;
			var imageData=context.getImageData(0, 0, this.myPlayerCanvas.width, this.myPlayerCanvas.height);
			var pix = imageData.data;
			this.blobify(imageData, color, context);
			this.canvasBuffer();
		},
		canvasBuffer: _.throttle(function() {
			var d1 = new Date();
			this.singleBufferContext.globalCompositeOperation = "destination-out";
			this.singleBufferContext.fillRect(0, 0, this.singleBufferCanvas.width, this.singleBufferCanvas.height);
			this.singleBufferContext.globalCompositeOperation = "copy";

			this.singleBufferContext.drawImage(this.myPlayerCanvas, 0, 0);
			for(canvasKey in this.otherPlayersCanvasArray){
				this.singleBufferContext.drawImage(this.otherPlayersCanvasArray[canvasKey], 0, 0);
			}
			
			var d2 = new Date();
			
			
			this.doubleBufferContext.globalCompositeOperation = "destination-out";
			this.doubleBufferContext.fillRect(0, 0, this.doubleBufferCanvas.width, this.doubleBufferCanvas.height);
			this.doubleBufferContext.globalCompositeOperation = "copy";
			//this.doubleBufferContext.save();
			
			console.log(this.singleBufferCanvas.width);
			console.log(this.doubleBufferCanvas.width);
			
			if(this.zoom == 1) this.doubleBufferContext.drawImage(this.singleBufferCanvas, 0, 0, this.singleBufferCanvas.width, this.singleBufferCanvas.height);
			if(this.zoom == 2) this.doubleBufferContext.drawImage(this.singleBufferCanvas, 0, 0, this.doubleBufferCanvas.width, this.doubleBufferCanvas.height);
			
			//this.doubleBufferContext.restore();
			
			var d3 = new Date();
			console.log("Just this Canvas (zoom/time)");
			console.log(this.zoom);
			console.log(d3-d2);
			console.log("Total Canvas");
			console.log(d3-d1);
		}, 50),
		showAllScores: function (scoreList){
			var totalPlayers = 0;
			var totalScore = 0;
			console.log (scoreList);
			this.score_card_template = _.template($('#score_card_template').html());
			$("#score_popup_tag").html(this.score_card_template());
			_.each(scoreList.scores, function (player) {
				totalPlayers++;
				var nameString = '<li><span style="color:#' + online_friends.get(player.id).get("player_color") + '">' + online_friends.get(player.id).get("name") + '</span></li>';
				var scoreString = '<li><span class="des_cancer">'+ player.tumorHit +'</span> - <span class="des_healthy">'+ player.healthyHit+'</span> = <span style="color:#' + online_friends.get(player.id).get('player_color') + '">' + (player.tumorHit - player.healthyHit) + '</span></li>';
				$("#score_names_ul").append(nameString);
				$("#score_number_ul").append(scoreString);
				totalScore += (player.tumorHit - player.healthyHit);
			});
			$("#numbers_total_ul").append('<li>' + (totalScore / totalPlayers) + '</li>');
			$("#score_popup_tag").show();
		},
		expandInfo: function (e) { //added to allow current case info roll down
			e.preventDefault();
			this.infoExpanded = !this.infoExpanded;
			if (this.infoExpanded){
				this.$('#current_info_container').show();
			}else{
				this.$('#current_info_container').hide();	
			}
		},
		retractInfo: function (e) { //added to allow current case info roll up
			e.preventDefault();
			this.expandInfo(e);
		},
		undoTool: function (e) { //added to allow undo functions
			e.preventDefault();
			//TODO - Allow for Undo
		},
		inviteFriends: function (e){ // added to allow invitation of friends
			e.preventDefault();
			FB.ui({method: 'apprequests',  message: me.get('name') + " needs your help with a tough case!", title: "Help!"});
		},
		hideDrawing: function (e){ //added to allow hiding of all drawings 
			e.preventDefault();
			self = this;
			this.hideEveryone = !this.hideEveryone
			if (this.hideEveryone){
				this.saveListState(e);
				$("#hide_drawing").html("<a href=''><span>SHOW DRAWINGS</span></a>");
				online_friends.each(function(friend){
					if (friend.get('layer_enabled')){
						self.otherPlayersContextArray[friend.get('id')].clearRect(0, 0, self.myPlayerCanvas.width, self.myPlayerCanvas.height);
						friend.toggleVisibility();
					}
				});
			}else{	
				$("#hide_drawing").html("<a href=''><span>HIDE DRAWINGS</span></a>");
				_.each(listState, function(friend){
					console.log (friend);
					online_friends.get(friend.id).set({layer_enabled: friend.layer_enabled});
				});
				this.getColorPointsForLayerAndPlayer(true);
				this.canvasBuffer();
			}
		},
		resetDrawing: function (e){ //added to allow reset of entire drawing (clear all my points)
			e.preventDefault();
			remote.clearCanvas (me.get('current_case_id'), me.get('id'), layer);
		},
		teamTab: function (e){ //added to allow team tab clicking
			if (e != null && e != undefined){
				e.preventDefault();
			}
			currentView = 0;
			friendbar = new FriendBar;
			this.$('#team_tab').attr('style','background: url(../images/tab_bg_active.png) repeat-x');
			this.$('#online_tab').attr('style','background: url(../images/tab_bg.png) repeat-x');
			this.$('#friends_tab').attr('style','background: url(../images/tab_bg.png) repeat-x');
		},
		onlineTab: function (e){ //added to allow online tab clicking
			e.preventDefault();
			this.saveListState();
			currentView = 1;
			friendbar = new FriendBar;
			this.$('#team_tab').attr('style','background: url(../images/tab_bg.png) repeat-x');
			this.$('#online_tab').attr('style','background: url(../images/tab_bg_active.png) repeat-x');
			this.$('#friends_tab').attr('style','background: url(../images/tab_bg.png) repeat-x');
		},
		friendsTab: function (e){
			e.preventDefault();
			this.saveListState();
			currentView = 2;
			friendBar = new FriendBar;
			this.$('#friends_tab').attr('style','background: url(../images/tab_bg_active.png) repeat-x');
			this.$('#online_tab').attr('style','background: url(../images/tab_bg.png) repeat-x');
			this.$('#team_tab').attr('style','background: url(../images/tab_bg.png) repeat-x');
		},
		saveListState: function (e) {
			if (currentView == 0){
				listState = {}
				online_friends.each (function (f){
					listState[f.get ('id')] = {id: f.get('id'), layer_enabled: f.get('layer_enabled')};
					console.log (f.get('layer_enabled'));
				});
			}
		},
		sendChat: function (e){
			e.preventDefault();
			var inputEl = this.$('#type')[0];
			var chatEl = this.$('#chat_window')[0];
			var message = inputEl.value;
			
			if(e.type == "click" || e.keyCode == 13 && message != '') {
				$(chatEl).append('<div class="chat_msg_con"><span class="chat_person" style="color: #'+me.get('player_color')+'; font-weight: bold;">me:</span><span class="chat_message"> '+message.replace(/&/g, "&amp;").replace(/</g,"&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;")+'</span></div>');
				inputEl.value = '';
				chatEl.scrollTop = chatEl.scrollHeight;
				remote.sendChat(me.get('current_case_id'), me.get('id'), layer, message);
			}
		},
		receiveChat: function(player_id, layer, message) {
			var chatEl = $('#chat_window')[0];
			if (!this.chatExpanded){
				pendingMessages++;
				if ($('#chat_container').find('#chat_notification').size() == 0) {
					this.chat_notification_template = _.template($('#chat_notification_template').html());
					$('#chat_container').append(this.chat_notification_template());
					$('#chat_notification').html('<p>' + pendingMessages + '</p>');
				}else{
					$('#chat_notification').html('<p>' + pendingMessages + '</p>');
				}
			}
	      	if(player_id != me.get('id')) {
		        var player = online_friends.filter(function(chatFriend) { return chatFriend.get('id') === player_id });
				$('#cursor_'+player_id+' .cursor_blob').html(message);
		        $('#chat_window').append('<div class="chat_msg_con"><span class="chat_person" style="color: #'+player[0].get('player_color')+'; font-weight: bold;">'+player[0].get('name')+':</span><span class="chat_message"> '+message+'</span></div>');
		        chatEl.scrollTop = chatEl.scrollHeight;
			}
		},
		setChatHistory: function(data) {
			var chatEl = $('#chat_window')[0];
			_.each(data.payload, function(message) {
				var player = online_friends.filter(function(chatFriend) { return chatFriend.get('id') === message.player });
				$('#chat_window').append('<div class="chat_msg_con"><span class="chat_person" style="color: #'+player[0].get('player_color')+'; font-weight: bold;">'+player[0].get('name')+':</span><span class="chat_message"> '+message.message+'</span></div>');
				chatEl.scrollTop = chatEl.scrollHeight;
			});
		},
		setGoalPointsForCase: function(fileName, layer_ID) {
				console.log("Load Data Run");
				this.goalCanvas = $('canvas')[10];
				this.goalCtx = this.goalCanvas.getContext("2d");
				console.log(this.goalCanvas);
				var left = 0;
				var top = 0;
				var self = this;
				var img = new Image();
				img.onload = function(){
					var targetArr = new Array();
					var healthyArr = new Array();
				    self.goalCtx.drawImage(img, 0, 0, img.width, img.height);
					var imageData=self.goalCtx.getImageData(0, 0, img.width, img.height);
					var pix = imageData.data;
					var k = 0;
					for(var i = 0; i <img.height; i++){
					    for(var j = 0; j <img.width; j++){
					 		if(parseInt(pix[k].toString()) >= 200){
								targetArr.push(j+left);
								targetArr.push(i+top);
					
							}
							if(parseInt(pix[k+2].toString()) >= 200){
								healthyArr.push(j+left);
								healthyArr.push(i+top);
					
							}
							k+=4;
					    }
					}
					this.goalPoints = {"targetPoints": targetArr, "healthyPoints": healthyArr};
					remote.setGoalPointsForCaseAndLayer(me.get('current_case_id'), layer_ID, this.goalPoints);
					console.log(targetArr.length);
					console.log(healthyArr.length);
					console.log(this.goalPoints);
				}
				img.src = fileName;			
		},
		showPager: function (b){
			if(b){
				this.$(".pager").show();
			}else{	
				this.$(".pager").hide();
			}
		},	
		pagerAcceptInvite: function (e){
			e.preventDefault();
			console.log ('received case id ' + invitation['case_number'] + " activity " + invitation['activity_id']);
			remote.joinActivity(invitation['activity_id'], me);
			me.set({current_case_id: invitation['activity_id']}, {silent:false});
			online_friends.each(function (friend){
				if (friend.get('id') == me.get('id')){
					friend.set({current_case_id: invitation['activity_id']}, {silent:false});
					console.log ('changed friend case id');
				}
			});
			this.removeAllListeners();
			currentView = 0;
			console.log (invitation['case_number']);
			delete this;
			new ComputerView(invitation['case_number']);
			invitation = {};
		},
		pagerDeclineInvite: function (e){
			e.preventDefault();
			showPager (false);
		},
		chatExpandRetract: function (e){
			e.preventDefault();
			console.log (this.chatExpanded);
			this.chatExpanded = !this.chatExpanded;
			if(this.chatExpanded){
				this.$('#chat_container').attr('style', 'margin: 100px 0px 0px 0px');
				pendingMessages = 0;
				$('#chat_notification').remove();
			}else{
				this.$('#chat_container').attr('style', 'margin:100px 0px 0px -193px;');
			}
		},
		invite: function (e) {
			e.preventDefault();
			var inv_id = invited['player_id']
			var inv_name = me.get('name')
			var inv_avatar = me.get('avatar')
			remote.sendJoinRequest('JoinRequest', me.get('current_case_id'), inv_id, inv_name, inv_avatar);
			this.$('.invite_popup').hide();
		},
		dontInvite: function (e) {
			e.preventDefault();
			this.$('.invite_popup').hide();
		},
		getColorPointsForLayerAndPlayer: function(showAll) {
			if(showAll) {
				if(this.locked) {
					online_friends.each(function(friend){
						if (!friend.get('layer_enabled') && friend.get('current_case_id') == me.get('current_case_id')){
							friend.toggleVisibility();
							remote.getColoredPointsForThisLayerAndPlayer(me.get('current_case_id'), me.get('id'), friend.get('id'), layer, emit);
						}
					});
				} 
			} else {
				online_friends.each(function(friend){
					if (friend.get('layer_enabled')){
						remote.getColoredPointsForThisLayerAndPlayer(me.get('current_case_id'), me.get('id'), friend.get('id'), layer, emit);
					}
				});
			}
		},
		cursorTool: function(e) {
		    e.preventDefault();
		    this.cursorToolEnabled = !this.cursorToolEnabled;
		    if(!this.cursorToolEnabled) {
		      $('.cursors').each(function(i, el) {
  			    $(el).remove();
  			  });
		    }
		},
		cursorMovement: _.throttle(function(e) {
			var self = this;
			if(this.zoom == 1)
		  		remote.cursorPosition(me.get('current_case_id'), me.get('id'), layer, {x: e.pageX, y: e.pageY});
			if(this.zoom == 2)
		  		remote.cursorPosition(me.get('current_case_id'), me.get('id'), layer, {x: ((e.pageX+self.$('#scan_container')[0].scrollLeft)/2), y: ((e.pageY+self.$('#scan_container')[0].scrollTop)/2)});
		}, 50),
		newCursorPosition: function(player, current_layer, position) {
		  if(player != me.get('id') && online_friends.get(player).get('layer_enabled') && online_friends.get(player).get('current_case_id') == me.get('current_case_id')) {
		    var offset = $('#scan_container').offset();	
			  var color = online_friends.get(player).get('player_color');
		    if(position.x >= offset.left && position.x <= (offset.left+offset.width) && position.y >= offset.top && position.y <= (offset.top+offset.height)) {
		      if($('#cursor_'+player).size() == 0) {
		        $('#cursor_'+player).show();
				if (current_layer == layer){
    		    	$('#scan_container #images').after('<div class="cursors" id="cursor_'+player+'"><div class="cursor_blob">...</div><div class="cursor_arrow"></div></div>');
    		   		$('#cursor_'+player+' .cursor_blob').css({'background-color': '#'+color, opacity: 1});
	    		    $('#cursor_'+player+' .cursor_arrow').css({'border-top-color': '#'+color, opacity: 1});
				}else{
	    		    $('#scan_container #images').after('<div class="cursors" id="cursor_'+player+'"><div class="cursor_blob">...</div><div class="cursor_arrow"></div></div>');
	    		   	$('#cursor_'+player+' .cursor_blob').css({'background-color': '#'+color, opacity: .5});
	    		    $('#cursor_'+player+' .cursor_arrow').css({'border-top-color': '#'+color, opacity: .5});
				}
    		    $('#cursor_'+player).css({
    		      top: (position.y)+'px',
    		      left: (position.x)+'px'
    		    });
 			 } else {
    		    $('#cursor_'+player).show();
				if (current_layer == layer){
    		   		$('#cursor_'+player+' .cursor_blob').css({'background-color': '#'+color, opacity: 1});
	    		    $('#cursor_'+player+' .cursor_arrow').css({'border-top-color': '#'+color, opacity: 1});
				}else{
	    		    $('#cursor_'+player+' .cursor_blob').css({'background-color': '#'+color, opacity: .5});
	    		    $('#cursor_'+player+' .cursor_arrow').css({'border-top-color': '#'+color, opacity: .5});
				}
    		    $('#cursor_'+player).css({
    		      top: (position.y)+'px',
    		      left: (position.x)+'px'
    		    });
    		  }
		    } else {
		      $('#cursor_'+player).hide();
		    }
		  } else {
		    $('#cursor_'+player).hide();
		  }
		}
	});
};
