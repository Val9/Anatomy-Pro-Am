_ = require('underscore@1.1.5')._
redis = require 'redis@0.6.0'
config = require '../../config'
fs = require 'fs'

###
#	Score Manager
###
exports.getImageInfo = (callback) ->
	loadLayersCallback = (caseList, caseIndex, totalImageData) ->
		if(caseIndex < caseList.length)
			if caseList[caseIndex]? and caseList[caseIndex].toString().charAt(0) isnt '.'
				caseNum = caseList[caseIndex]
				fs.readdir(('public/images/cases/goalData/'+caseNum), (err, filenames) ->
					if err 
						console.log "err"
						console.log err
					else
						layerImageData = []
						for filename in filenames
							if filename.toString().charAt(0) isnt '.'
								layerImageData[filename.toString().charAt(filename.toString().length-5)] = filename
						totalImageData.push {caseNum : caseNum, layerImageData : layerImageData}
					loadLayersCallback caseList, caseIndex+1, totalImageData
				)
			else loadLayersCallback caseList, caseIndex+1, totalImageData
		else
			console.log "Here's the results"
			console.log totalImageData
			callback totalImageData
	fs.readdir('public/images/cases/goalData', (err, caseList) ->
		if err 
			console.log "err"
			console.log err
		console.log caseList
		loadLayersCallback caseList, 0, []
	)


exports.setGoalPointsForCaseAndLayer = (case_ID, layer_ID, goalPoints) ->
	@redisClient = redis.createClient config.redis.port, config.redis.server
	@redisClient.select config.redis.db
	@redisClient.set 'Case:'+case_ID+':layer:'+layer_ID+':GoalPoints', JSON.stringify(goalPoints), (err, added) ->
		if err then console.log 'SET error: ', err
		console.log "Case " + case_ID + " at layer " + layer_ID + " is set!";

#Gets the goalPoints which is object {targetPoints, healthyPoints}
exports.getGoalPointsForCase = (self, case_ID, layer_ID, callback) ->
	self.redisClient.get 'Case:'+case_ID+':layer:'+layer_ID+':GoalPoints', (err, goalPoints) ->
		if err then console.log 'GET error: ', err
		goalPoints = JSON.parse goalPoints
		callback goalPoints

# Takes width*height sized Array with only 0's and 1's and floods the exterior region
# With value 2, leaving all regions encircled by 1's as 0's
# After function to check if region is circled all is needed is to check that it's value != 2
floodToolNonselectedRegion = (myPointArray, width, height) ->
	pixelStack = [[0, 0]]
	totalCount = 0
	while pixelStack.length > 0
		newPos = x = y = pixelPos = reachLeft = reachRight = null
		newPos = pixelStack.pop()
		x = newPos[0]
		y = newPos[1]
		pixelPos = (y*width + x)
		while (y-=1) >= 0 and myPointArray[pixelPos] == 0
			pixelPos -= width
		pixelPos += width
		y += 1
		reachLeft = false
		reachRight = false
		while(((y+=1) < height-1) && (myPointArray[pixelPos] == 0))
			myPointArray[pixelPos] = 2
			totalCount += 1
			if(x > 0)
				if(myPointArray[(pixelPos - 1)] == 0)
					if(!reachLeft)
						pixelStack.push [x - 1, y]
						reachLeft = true
				else if reachLeft
					reachLeft = false
			if(x < (width-1))
				if(myPointArray[(pixelPos + 1)] == 0)
					if(!reachRight)
						pixelStack.push [x + 1, y]
						reachRight = true
				else if reachRight
					reachRight = false
			pixelPos += width
	console.log "totalCount"
	console.log totalCount
	myPointArray

exports.getScoreForCaseAndLayer = (self, player_id, width, height, case_ID, layer_ID, myPoints, goalPoints, callback) ->
	console.log "case/layer"
	console.log (case_ID + "/" + layer_ID)
	self.score = {'tumorHit': 0, 'healthyHit': 0}
	#X = Even values (2n+0) Y = Odd values (2n+1)
	targetPointsXY = goalPoints['targetPoints'] 
	healthyPointsXY = goalPoints['healthyPoints']
	#Load all of myPoints into a width*height array so flood tool function of blobify can be used
	myPointArray = _.map [0...(width*height)], (num) ->
		return 0	
	_.each myPoints, (point) ->
		myPointArray[point.point.x+point.point.y*width] = 1
	#Flood tool time
	myPointArray = floodToolNonselectedRegion myPointArray, width, height 
	#Compare Against goalData (0's are selected regions, 1's are border regions, 2's are nonselected regions) 
	
	console.log "mypointArrl/goalpointstl"
	console.log myPoints.length
	console.log (myPointArray.length + "/" + goalPoints['targetPoints'].length)
	
	
	
	
	
	
	
	targetHit = 0
	healthyHit = 0
	_.each( _.range(targetPointsXY.length/2), (n) -> 
		if myPointArray[ ( ( targetPointsXY[ 2*n + 1] * (width) ) + ( targetPointsXY[2*n] ) ) ] isnt 2 
			targetHit += 1
		else
			#console.log "didn't hit" + ( targetPointsXY[ 2*n] ) + "/" + ( targetPointsXY[2*n+1] ) + " value was " + myPointArray[ ( ( targetPointsXY[ 2*n + 1] * (width) ) + ( targetPointsXY[2*n] ) ) ]
	)	
	_.each( _.range(healthyPointsXY.length/2), (n) -> 
		if myPointArray[ ( ( healthyPointsXY[ 2*n + 1] * (width) ) + ( healthyPointsXY[2*n] ) ) ] isnt 2 
			healthyHit += 1
			#console.log "missed at " + ( healthyPointsXY[ 2*n] ) + "/" +( healthyPointsXY[2*n+1] )
	)
	console.log width
	console.log height
	
	if targetPointsXY.length > 0
		self.score.tumorHit += targetHit * 200 / targetPointsXY.length
	if healthyPointsXY.length > 0
		self.score.healthyHit += healthyHit * 200 / healthyPointsXY.length
	console.log self.score
	callback self.score