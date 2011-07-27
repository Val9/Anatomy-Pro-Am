function Grid(width,height,options) {
  var floor = Math.floor
  var random = Math.random;
  this.defaults = options;
  this.grid = new Array();
  this.width = width;
  this.height = height;
  
  var node_array = [];
 
/*
  for (var z=0; z < options.layers; z++) {
    for (var y=0; y < height; y++) {
      for (var x=0; x < width; x++) {
        var index = x + "_" + y + "_" + z;
        node_array[index] = new Node(x,y,z,this,options);
      };
    };
  };
*/

var z;
var node_array = [];
console.log(options);
for (var y=0; y < height; y++) {
	for (var x=0; x < width; x++) {
		z = 0;
		//console.log(""+x+"_"+y);
		if(options.elevateds[""+x+"_"+y])
			z = options.elevateds[""+x+"_"+y];
		var index = x + "_" + y + "_"+z;
		node_array[index] = new Node(x,y,z,this,options);
	};
};

  this.nodes = node_array;
  for (var i=0; i < this.nodes.length; i++) {
   this.grid.push([this.nodes[i].x, this.nodes[i].y, this.nodes[i].z]);
  };
  
  this.node = function(x,y,z) {
    var index = x + "_" + y + "_" + z;
    return this.nodes[index];
  }
  
  this.column = function(x,z) {
    var column = new Array();
    for (var y=0; y < this.height; y++) {
      var index = x + "_" + y + "_" + z;
      column.push(this.nodes[index]);
    }
    return column;
  }
  
  this.row = function(y,z) {
    var row = new Array();
    for (var x=0; x < this.width; x++) {
      var index = x + "_" + y + "_" + z;
      row.push(this.nodes[index]);
    }
    return row;
  }
}
