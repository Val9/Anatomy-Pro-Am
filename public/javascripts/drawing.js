components.drawing = function(){
	console.log('loaded drawing');
	
	window.Point = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');
			erase = false;
			this.model.view = this;
			this.canvas = $('.scanvas').dom[0];
			this.ctx = this.canvas.getContext("2d");
			var actionType = this.model.get('actionType');
			this.ctx.lineWidth  = size*2;
			tempImageData = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
			if (actionType==3) {
				curTool = this.model.get('tool');
			} else if (actionType==4) {
				this.load();
			} else {
				var x = this.model.get('x');
				var y = this.model.get('y');
				if (curTool == 0) {
					erase=false;
					this.ctx.fillStyle = "rgb(0,0,255)";
					this.ctx.strokeStyle = "rgb(0,0,255)";
				} else if (curTool == 1) {
					erase=false;
					this.ctx.fillStyle = "rgb(255,0,0)";
					this.ctx.strokeStyle = "rgb(255,0,0)";
				} else if(curTool == 2) {
					erase=true;
					this.ctx.fillStyle = "rgb(255,255,255)";
					this.ctx.strokeStyle = "rgb(255,255,255)";
				}
				this.render(x,y,actionType);
			}
		},
		updCanv: function() {
			tempImageData=this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
			var pix = tempImageData.data;
			for (var i = 0, n = pix.length; i < n; i += 4) {
			    if(pix[i]>0&&pix[i+1]>0&&pix[i+2]>0){
			    	pix[i+3]=0;
			    }
			    pix[i  ] = pix[i  ]; // red
			    pix[i+1] = pix[i+1]; // green
			    pix[i+2] = pix[i+2]; // blue
			    // i+3 is alpha (the fourth element)
			}
			// Draw the ImageData at the given (x,y) coordinates.
			this.canvas.width = this.canvas.width; //Purges canvas
			this.ctx.fillStyle = "rgba(0, 0, 0, 0.0)";
			this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
			this.ctx.putImageData(tempImageData, 0, 0);
		},
		load: function()  {
			var c = 0;
			var pointArray = this.model.get('pointArrayServer');
			var actionType;
			var x;
			var y;
			//console.log("and now");
			//console.log(pointArray);

			while(c<pointArray.length){
				actionType = pointArray[c].actionType;
				x = pointArray[c].x;
				y = pointArray[c].y;
				if(actionType==3){
					curTool = pointArray[c].tool;
				}else{
					if(curTool == 0){
						erase=false;
						this.ctx.fillStyle = "rgb(0,0,255)";
						this.ctx.strokeStyle = "rgb(0,0,255)";
					}else if(curTool == 1){
						erase=false;
						this.ctx.fillStyle = "rgb(255,0,0)";
						this.ctx.strokeStyle = "rgb(255,0,0)";
					}else if(curTool == 2){
						erase=true;
						this.ctx.fillStyle = "rgb(255,255,255)";
						this.ctx.strokeStyle = "rgb(255,255,255)";
					}
					if(actionType==0){
						this.ctx.beginPath();
						this.ctx.arc(x,y, size, 0, Math.PI*2, true); 
						this.ctx.closePath();
						this.ctx.fill();
						isDrawing = true;
					} else if(isDrawing && actionType==1){
						this.ctx.beginPath();
						this.ctx.arc(x,y, size, 0, Math.PI*2, true); 
						this.ctx.closePath();
						this.ctx.fill();
					} else if(actionType==2){
						this.ctx.beginPath();
						this.ctx.arc(x,y, size, 0, Math.PI*2, true); 
						this.ctx.closePath();
						this.ctx.fill();
						isDrawing = false;

					}
					if(erase) this.updCanv();
				}
				c++;
			}
			return this;
		},
		render: function(x,y,actionType) {
			if(actionType==0){
				this.ctx.beginPath();
				this.ctx.arc(x,y, size, 0, Math.PI*2, true); 
				this.ctx.closePath();
				this.ctx.fill();
				this.ctx.moveTo(x,y);
				this.ctx.beginPath();
				isDrawing = true;
			} else if(isDrawing && actionType==1){
				this.ctx.lineTo(x,y);
				this.ctx.closePath();
				this.ctx.stroke();
				this.ctx.beginPath();
				this.ctx.arc(x,y, size, 0, Math.PI*2, true); 
				this.ctx.closePath();
				this.ctx.fill();
				this.ctx.beginPath();
			} else if(actionType==2){
				this.ctx.lineTo(x,y);
				this.ctx.closePath();
				this.ctx.stroke();
				this.ctx.beginPath();
				this.ctx.arc(x,y, size, 0, Math.PI*2, true); 
				this.ctx.closePath();
				this.ctx.fill();
				isDrawing = false;
			}
			if(erase) this.updCanv();
			return this;
		}
	});
	
	window.pointArray = new Array()
	window.ComputerView = Backbone.View.extend({
		
		el: $('#game'),
		events: {
			'click .light_grey_gradient_text': 'goBack',
			"mousedown .scanvas": "startLine",
			/*"mousemove .scanvas" : "drawLine",
			"mouseup .scanvas": "endLine",
			"click .brush0": "changeColor0",
			"click .brush1": "changeColor1",
			"click .brush2": "changeColor2",
			"click .brush3": "Load"*/
		},
		initialize: function() {
			players.unbind();
			drawing.unbind();
			_.bindAll(this, 'addOne', 'addAll', 'render');
			players.bind('add', this.addOne);
			players.bind('refresh', this.addAll);
			players.bind('change', this.logger);
			this.render();
		},
		logger: function(){
			alckjaoijcalsdkjc;
		},
		goBack: function(e) {
			e.preventDefault();
			delete this;
			new CaseView;
		},
		render: function() {
			if (view.computer) {
				this.el.html('');
				this.el.html(view.computer);
				this.setupView();
			} else {
				$.get('/renders/computer.html', function(t){
					this.el.html('');
					view.computer = t;
					this.el.html(view.computer);
					this.setupView();
				}.bind(this));
			}
		},
		setupView: function() {
			this.canvas = $('canvas').dom[0];
			this.ctx = this.canvas.getContext("2d");
			_.bindAll(this, 'drawPoint', 'drawnPoints');
			_.bindAll(this, 'Load');
			var self = this;
			drawing.bind('add', this.drawPoint);
			// old fashion request to get the current state
			drawing.fetch({success: function(data) {
				var ca = 0; // Counter Array
				var cm = 0; // Counter Model
				while(cm < data.models.length){
					if(data.models[cm].attributes.actionType != 4){
						window.pointArray[ca] = data.models[cm].attributes;
						ca++;
					}else{
						var tc = 0; //Temp Counter 
						while(tc<data.models[cm].attributes.pointArrayServer.length){
							window.pointArray[cs] = data.models[cm].attributes.pointArrayServer[tc];
							tc++;
							ca++;
						}
					}
					cm++;
				}
				var tmp = window.pointArray;
			}});
			// fixtures:
			var images = ['/images/cases/case1/1.png', '/images/cases/case1/2.png','/images/cases/case1/3.png', '/images/cases/case1/4.png'];
			
			images.forEach(function(img){
				if(images.indexOf(img) == images.length-1) {
					this.$('#images').append('<img src="'+img+'" />');
				} else {
					this.$('#images').append('<img src="'+img+'" style="display: none;" />');
				}
			});
			
			players.fetch({success: function(data) { console.log(data); } });
			
			/*
			em.on('addPlayer', function(data) {
				console.log(data);
			});

			remote.setID(FB.getSession().uid);
			remote.subscribe(function () {
				em.emit.apply(em, arguments);
			});
			drawing.bind('dnode:add', function(data){
				remote.add(data, {
					type: 'drawing'
				});
			});
			self.Load();
			*/
				
			this.canvas = $('canvas').dom[0];
			this.ctx = this.canvas.getContext("2d");
			_.bindAll(this, 'drawPoint', 'drawnPoints');
			_.bindAll(this, 'Load');
			var self = this;
			//console.log(self);
			drawing.bind('add', this.drawPoint);
			// old fashion request to get the current state
			drawing.fetch({success: function(data) {
				var c = 0;
				//console.log(data);
				//console.log(data.models.length);
				while(c < data.models.length){
					window.smaller[c] = data.models[c].attributes;
					c++;
				}
				var tmp = window.smaller;
				//console.log(self);
			}});
		},
		drawnPoints: {},
		drawPoint: function(model) {
			var point = new Point({model: model});
			this.drawnPoints[model.id] = point;
		},
		startLine: function(event) {
			drawing.trigger('dnode:add', {x: event.clientX-this.canvas.offsetLeft, y: event.clientY-this.canvas.offsetTop, actionType:0, tool:curTool});
		},
		drawLine: function(event) {
			drawing.trigger('dnode:add', {x: event.clientX-this.canvas.offsetLeft, y: event.clientY-this.canvas.offsetTop, actionType:1, tool:curTool});
		},
		endLine: function(event) {
			drawing.trigger('dnode:add', {x: event.clientX-this.canvas.offsetLeft, y: event.clientY-this.canvas.offsetTop, actionType:2, tool:curTool});
		},
		
		changeColor0: function(event) {
			drawing.trigger('dnode:add', {x: event.clientX-this.canvas.offsetLeft, y: event.clientY-this.canvas.offsetTop, actionType:3, tool:0});
		},
		changeColor1: function(event) {
			drawing.trigger('dnode:add', {x: event.clientX-this.canvas.offsetLeft, y: event.clientY-this.canvas.offsetTop, actionType:3, tool:1});
		},
		changeColor2: function(event) {
			drawing.trigger('dnode:add', {x: event.clientX-this.canvas.offsetLeft, y: event.clientY-this.canvas.offsetTop, actionType:3, tool:2});
		},
		changeColor3: function(event) {
			drawing.trigger('dnode:add', {x: event.clientX-this.canvas.offsetLeft, y: event.clientY-this.canvas.offsetTop, actionType:3, tool:3});
		},
		Load: function() {
			drawing.trigger('dnode:addPointArray', {pointArrayServer: window.pointArray, actionType:4});
		},
		addAll: function() {
			console.log("addall");
			console.log(players.length);
			players.each(this.addOne);
		},
		addOne: function(player) {
			var view = new Player({model: player});
			this.$('#fb_friends_container').append(view.render().el);
		}
	});
};