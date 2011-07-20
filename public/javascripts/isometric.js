components.isometricView = function(){
	console.log('loading isometricView');
	window.IsometricView = Backbone.View.extend({
		el: $('#game'),
		events: {
			"click #background_Office": "moveMe",
			"click #whiteboard": "moveMe",
			"click #computerDesk": "moveMe"
		},
		initialize: function() {
			_.bindAll(this, 'render');
			this.render();
		},
		render: function() {
			$.get('/renders/isometric.html', function(t){
				this.el.html('');
				view.isometric = t;
				this.el.html(view.isometric);
				this.setupView();
				console.log("Here");
			}.bind(this));
		},
		setupView: function() {
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
				    avatar_offset: [15,0],
					tile_width:48,
				    tile_height:26,
				    iso_tile_height:26
				  });
				
				
				
				  	
				  $('#grid').children().mouseenter(function(e) {
				    $(e.target).addClass('hover');
				  });

				  $('#grid').children().mouseleave(function(e) {
				    $(e.target).removeClass('hover');
				  });
			})(jQuery);

		},
		moveMe: function(e) {
			console.log(e.target.id);
			var position = jQuery.fn.iso.avatar.position
			if(e.target.id == "whiteboard"){
				if(position[0]== 0 && (position[1]>1&&position[1]<7))
					console.log("use whiteboard");
				else
					console.log("You need to be closer to the whiteboard to use it");
			}else if(e.target.id == "computerDesk"){
				if(position[1] == 2 && (position[0]>3 && position[0]<9))
					console.log("use computer");
				else
					console.log("You need to be closer to the computer to use it");
			}else{
				console.log("There's nothing there!");
			}
			/*
			function() {
		        $('#information').html("");
		        $('li a').removeClass("selected");
		        $(this).addClass("selected");
		        $("#demo").load(e.currentTarget.href, function() {
		        	$('#information').fadeIn("fast");
				});
			});*/
		}
	});
};
