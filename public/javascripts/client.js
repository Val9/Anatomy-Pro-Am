$(function(exports){
	var Backbone = require('backbone@0.3.3'),
		_ = require('underscore')._,
		resources = require('./models/resources'),
		drawing = new resources.collections.Drawing;
	
	window.Point = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');
			this.model.view = this;
			this.canvas = $('.game').dom[0];
			this.ctx = this.canvas.getContext("2d");
			this.ctx.fillStyle = "rgb(200,0,0)";
			this.render();
		},
		render: function() {
			this.ctx.beginPath();
			this.ctx.arc(this.model.get('x'), this.model.get('y'), 10, 0, Math.PI*2, true); 
			this.ctx.closePath();
			this.ctx.fill();
			return this;
		}
	});
	
	window.CaseView = Backbone.View.extend({
		el: $('#game'),
		events: {
			'click .light_grey_gradient_text': 'selectCase'
		},
		initialize: function() {
			_.bindAll(this, 'render');
			this.render();
		},
		render: function() {
			$.get('/render/cases.html', function(t){
				this.el.html(t);
			}.bind(this));
		},
		selectCase: function(e) {
			//console.log($(e.currentTarget));
			e.preventDefault();
			this.el.html('');
			window.Computer = new ComputerView;
		}
	});
	
	window.ComputerView = Backbone.View.extend({
		el: $('#game'),
		events: {
			'click .current_room_button': 'goBack'
		},
		initialize: function() {
			_.bindAll(this, 'render');
			this.render();
		},
		render: function() {
			$.get('/render/computer.html', function(t){
				this.el.html(t);
			}.bind(this));
		},
		goBack: function(e) {
			e.preventDefault();
			this.el.html('');
			window.Case = new CaseView;
		}
	});
	
	window.AppView = Backbone.View.extend({
		el: $('#game'),
		initialize: function() {
			
			window.Case = new CaseView;
			
			/*
			this.canvas = $('.game').dom[0];
			ctx = this.canvas.getContext("2d");
			
			_.bindAll(this, 'drawPoint', 'drawnPoints');
			var self = this;
			drawing.bind('add', this.drawPoint);
			drawing.bind('refresh', function(data) {
				data.each(function(model){
					if(self.drawnPoints[model.id]) {
						self.drawnPoints[model.id].model.set(model.attributes);
					} else {
						self.drawPoint(model);
					}
				});
			});
			
			// old fashion request to get the current state
			drawing.fetch({success: function(data) { } });
			
			DNode({
				// clientside RPC, these methods are called by the server
				add: function(data, options) {
					var aColl = eval(options.type);
					if (!aColl.get(data.id)) aColl.add(data);
				}
			}).connect(function(remote){
				var em = require('events').EventEmitter.prototype;
				remote.subscribe(function () {
					em.emit.apply(em, arguments);
				});
				// listen to events from the collection
				drawing.bind('drawing:add', function(data){
					// do a RPC (its either add or remove, type is the collection name)
					remote.add(data, {
						type: 'drawing'
					});
				});
			});
			*/
		},
		drawnPoints: {},
		drawPoint: function(model) {
			var point = new Point({model: model});
			this.drawnPoints[model.id] = point;
		},
		setNewPoint: function(event) {
			// trigger event (via collection)
			drawing.trigger('drawing:add', {x: event.clientX-this.canvas.offsetLeft, y: event.clientY-this.canvas.offsetTop});
			event.preventDefault();
		},
		clearPoints: function(event) {
			drawing.trigger('drawing:removeAll', {x: event.clientX-this.canvas.offsetLeft, y: event.clientY-this.canvas.offsetTop});
			event.preventDefault();
		}
	});
	window.App = new AppView;
});
