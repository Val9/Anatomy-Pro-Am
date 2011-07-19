components.isometricView = function(){
	console.log('loading isometricView');
	window.IsometricView = Backbone.View.extend({
		el: $('#game'),
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
				      "2_2_0",
				      "2_3_0",
				      "3_2_0",
				      "4_2_0",
				      "4_3_0",
				      "4_4_0",
				      "4_5_0",
				      "4_6_0",
				      "4_7_0",
				      "4_8_0",
				      "4_9_0",
				    ], 
				    max_x: 10, 
				    max_y: 10,
				    avatar_offset: [0,-8],
				    tile_width:16,
				    tile_height:8,
				    iso_tile_height:8
				  });
				
				  $('#grid').children().mouseenter(function(e) {
				    $(e.target).addClass('hover');
				  });

				  $('#grid').children().mouseleave(function(e) {
				    $(e.target).removeClass('hover');
				  });
			})(jQuery);

		},
		clickOccured: function(e) {
			console.log(e);
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
