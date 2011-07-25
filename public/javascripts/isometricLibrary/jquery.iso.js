var node_trap = new Array();
(function($) {
  $.fn.iso = function(options) {
    var defaults = $.extend({}, $.fn.iso.defaults, options);
    
    return this.each(function() {
      $this = $(this);
      $this.grid = new Grid(defaults.max_x,defaults.max_y,defaults);
      console.log($this.grid);
	  console.log($this.grid.nodes);
      if (defaults.unwalkables.length > 0) {
        for (var i=0; i < defaults.unwalkables.length; i++) {
		  console.log(defaults.unwalkables[i]);
          $this.grid.nodes[defaults.unwalkables[i]].walkable = false;
        };
      };

	if (defaults.elevateds.length > 0) {
        for (var i=0; i < defaults.elevateds.length; i++) {
          	console.log($this.grid);
			$this.grid.nodes[defaults.elevateds[i]].z = 4;
        };
      };

      $this.nodes = $this.grid.nodes;
      node_trap.push($this.grid);

      $this.avatars = new Array();
      for (var i=0; i < defaults.avatar_count; i++) {
        $this.avatars.push(new Avatar($this.grid, defaults.startPosition));
      };
      
      $.each($this.avatars,function() {
        this.offset = defaults.avatar_offset;
      });

      $this.avatar = $this.avatars[0]; // is this needed?
      
      // exposing some things to public
      $.fn.iso.avatar = $this.avatar;
      $.fn.iso.avatars = $this.avatars;
      $.fn.iso.grid = $this.grid;
      $.fn.iso.nodes = $this.nodes;
      
      function render_tiles() {
        var nodes = $this.nodes;
        var html = '';

        for (var key in nodes) {
		  console.log(key);
          var node = nodes[key];
          var parent_id = $this.attr('id');
          var id = parent_id + '_tile_' + key;
          var label = (defaults.labels) ? id : '';
		if(defaults.elevateds[''+node.x+'_'+node.y]) node.z = defaults.elevateds[''+node.x+'_'+node.y];
			

          if (defaults.render_all == false) {
            if (node.walkable != true) {
              $this.append('<div class="layer_' + node.z + '" id="' + id + '"></div>');
              $('#' + id).css({
                zIndex: node.zindex,
                left: (node.left+defaults.tile_offset[0]) + 'px',
                top: (node.top) + 'px'
              }).data("xyz", [node.x,node.y,node.z]);
              $('#' + id).addClass('dirt');
            }
          } else {
            $this.append('<div class="layer_' + node.z + '" id="' + id + '"></div>');

            $('#' + id).css({
              zIndex: node.zindex,
              left: (node.left+defaults.tile_offset[0]) + 'px',
              top: (node.top) + 'px'
            }).data("xyz", [node.x,node.y,node.z]);

            if (node.walkable != true) {
              $('#' + id).addClass('dirt');
            }
          }
        };


      };
      
      function render_avatars() {
        for (var i=0; i < $this.avatars.length; i++) {
          $this.append('<span class="avatar" id="avatar_' + i + '" />');
          $this.append('<span class="shadow" id="shadow_' + i + '" />');

          var avatar_element = $('#avatar_' + i);
          var shadow_element = $('#shadow_' + i);

          avatar_element.css({
            'z-index': 999999,
            'left': defaults.avatar_offset[0] + defaults.tile_offset[0],
            'top': defaults.avatar_offset[1]
          });

          shadow_element.css({
            'z-index': 888888,
            'left': defaults.shadow_offset[0] + defaults.tile_offset[0],
            'top': defaults.shadow_offset[1]
          });

          place_avatar(i);
        };
      };
      
      function attach_handlers(avatar_index) {
        $this.children().click(function(e) {
          $this.children().removeClass('goal');
          var tile = $(e.target);
          tile.addClass('goal');
          var start_x = $this.avatar.position[0];
          var start_y = $this.avatar.position[1];
          var start_z = $this.avatar.position[2];
          var end_x = tile.data("xyz")[0];
          var end_y = tile.data("xyz")[1];
          var end_z = tile.data("xyz")[2];
		  
          $this.avatar.determine_path(start_x, start_y, start_z, end_x, end_y, end_z);
          if ($this.avatar.movement_queue.length > 0) {
            follow_path(avatar_index);
          };
        });
      }

      function place_avatar(avatar_index) {
        var avatar_element = $('#avatar_' + avatar_index);
        var shadow_element = $('#shadow_' + avatar_index);
        var node = $this.avatars[avatar_index].node();

        if (defaults.animate == true) {
          avatar_element.animate({
            left: node.left + defaults.avatar_offset[0] + defaults.tile_offset[0],
            top: (node.top + defaults.avatar_offset[1]) - 8
          }, (defaults.speed/1.99))
          .animate({
            left: node.left + defaults.avatar_offset[0] + defaults.tile_offset[0],
            top: (node.top + defaults.avatar_offset[1])
          }, (defaults.speed/1.99));

          shadow_element
          .animate({
            left: node.left + defaults.shadow_offset[0] + defaults.tile_offset[0],
            top: node.top + defaults.shadow_offset[1]
          }, defaults.speed);
        } else {
          avatar_element.css({
            left: node.left + defaults.avatar_offset[0] + defaults.tile_offset[0],
            top: node.top + defaults.avatar_offset[1]
          });

          shadow_element.css({
            left: node.left + defaults.shadow_offset[0] + defaults.tile_offset[0],
            top: node.top + defaults.shadow_offset[1]
          });
        }
      };
      
      function change_avatar(num,axis,avatar_index) {
        if (avatar_index == undefined) {
          var avatar_index = 0;
        }

        var i;
        var avatar = $this.avatars[avatar_index];

        if (axis == 'x') i = 0;
        if (axis == 'y') i = 1;

        avatar.position[i] += num;

        if (avatar.position[i] < 0) avatar.position[i] = 0;
        if (avatar.position[i] >= max_xy[i]) avatar.position[i] = max_xy[i]-1;

        place_avatar(avatar_index);
      };
      
      var a_queue = $('span').queue('movement');
      
      function follow_path(avatar_index) {
        var avatar = $this.avatars[avatar_index];
        var avatar_element = $('#avatar_' + avatar_index);
        var shadow_element = $('#shadow_' + avatar_index);
        var node = avatar.node();
        
        if (avatar.movement_queue && avatar.movement_queue.length > 0) {
          avatar.step();
          place_avatar(avatar_index);
          follow_path(avatar_index);
        } else {
          return true;
        }
      };
      
      render_tiles($this);
      render_avatars($this);
      for (var i=0; i < defaults.avatar_count; i++) {
        attach_handlers(i);
      };
      
    });
  };
  
  $.fn.iso.defaults = {
    max_x: 6,
    max_y: 6,
	startPosition: [0,0,0],
    avatar_offset: [36,4],
    shadow_offset: [36,4],
	avatar_count: 1,
    tile_width: 104,
    tile_height: 52,
    speed: 200,
    animate: true,
    labels: true,
    tile_offset: [262,0],
    layers: 1,
    iso_tile_height:  5,
    unwalkables: [],
	elevateds: [],
    render_all: true
  };
  
})(jQuery);