components.scoreLoaderView = function(){
	console.log('loading scoreLoader');
	window.ScoreLoaderView = Backbone.View.extend({
		el: $('#game'),
		events: {
			'change #caseSelector' : 'loadCaseLayerData'
		},
		initialize: function() {
			_.bindAll(this, 'render');
			this.render();
		},
		render: function() {
			$.get('/renders/scoreLoader.html', function(t){
				this.el.html('');
				view.scoreLoader = t;
				this.el.html(view.scoreLoader);
				console.log("Here")
				this.loadImageInfo();
			}.bind(this));
		},
		loadImageInfo: function() {
			remote.getImageInfo(this.processImages);
		},
		processImages: function(caseData) {
			var caseSelect = $('#caseSelector')[0];
			this.caseData = caseData;
			caseSelect.add( new Option("Select your case and layer to add", "default"));
			for(caseIndex in caseData){
				for(layer_ID in caseData[caseIndex].layerImageData){
					caseSelect.add( new Option("CaseNum: " + caseData[caseIndex].caseNum
					 + " Layer Index: " + layer_ID, [caseIndex, layer_ID]));
				}
			} 
		},
		loadCaseLayerData : function(e){
			if(e.target.value != "default"){
				remote.getImageInfo( function(caseData){
					var caseSelector = e.target.value.split(",");
					var caseIndex = caseSelector[0];
					var layer_ID = caseSelector[1];
					if(caseIndex < caseData.length){
						var layerData = caseData[caseIndex].layerImageData;
						var case_ID = caseData[caseIndex].caseNum;
						if(layer_ID < layerData.length){
							console.log("Load Data Run");
							var left = 0;
							var top = 0;
							var img = new Image();
							img.onload = function(){
								var goalCanvas = document.createElement('canvas');
								document.body.appendChild(goalCanvas);
								var goalContext = goalCanvas.getContext("2d");
								console.log(goalCanvas);
								goalCanvas.style.visibility = "hidden";
								goalCanvas.width = img.width;
								goalCanvas.height = img.height;
								var targetArr = new Array();
								var healthyArr = new Array();
							    goalContext.drawImage(img, 0, 0, img.width, img.height);
								var imageData = goalContext.getImageData(0, 0, img.width, img.height);
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
								remote.setGoalPointsForCaseAndLayer(case_ID, layer_ID, {"targetPoints": targetArr, "healthyPoints": healthyArr});
								console.log({"targetPoints": targetArr, "healthyPoints": healthyArr});
								console.log("Case " + case_ID + " at layer " + layer_ID + " has been set!");
							}
							img.src = "images/cases/goalData/"+ case_ID + "/" + layerData[layer_ID];
						}
					}
				});
			}
		}
	});
};
