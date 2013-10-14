var cluster = require('cluster'),
	navData = require('../../client/js/navDataSmall.js'),
	PF = require('../../lib/pathfinding'),
	grid = new PF.Grid(128, 128, navData.level1NavData),
	finder = new PF.AStarFinder({allowDiagonal: true, dontCrossCorners: true});

if(cluster.isWorker) { // Left in for saftey
	console.log("Cluster worker ID #" + cluster.worker.id + " has started");
	process.on('message', function(data) {
		if(!data.cmd)
			return;
		if(data.cmd == 'eval')
			eval(data.params);
		else if(data.cmd == 'globalVars') {
			for(var i in data.vars)
				global[i] = data.params.vars[i];
		} else if(data.cmd == 'setupNavData') {
			setupNavData(data.params.object, 128, 128, data.params.objectType);
		} else if(data.cmd == 'runPathData') {
			runPathData(data.params.object, data.params.objType);
		} else if(data.cmd == 'runZombiePathData') {
			setupZombieNavData(data.params.object, 128, 128);
		}
		process.send({cmd: 'finishedTask', workerID: cluster.worker.id, task: data.cmd}); // Tell the master we have finished the task that was sent
	});
}


// Start pathfinding functions //

function setupNavData(object, height, width, objectType) {
	//grid = new PF.Grid(width,height,c=navData.level1NavData);
	//finder = new PF.AStarFinder({
	//	allowDiagonal:true,
	//	dontCrossCorners:true
	//});
	try {
		var navData = {
			path: finder.findPath(object.pos.x,object.pos.z,object.targetPos.x,object.targetPos.z,grid.clone())
		};
		process.send({cmd: 'setupNavData', objectName: object.name, socketid: object.owner, objectType: objectType, navData: navData});
	} catch(e) {
		//console.warn("FATAL ERROR: "+e.toString());
	}
}

function setupZombieNavData(object, height, width) {
	//grid = new PF.Grid(width,height,c=navData.level1NavData);
	//finder = new PF.AStarFinder({
	//	allowDiagonal:true,
	//	dontCrossCorners:true
	//});
	try {
		object.navData = {
			path: finder.findPath(object.pos.x,object.pos.z,object.targetPos.x,object.targetPos.z,grid.clone())
		};
		//process.send({cmd: 'setupZombieNavData', objectName: object.name, navData: navData});
		runZombiePathData(object);
	} catch(e) {
		//console.warn("FATAL ERROR: "+e.toString());
	}
}

function runPathData(object, objectType) {
	try {
		//object.navData = {
		//	path: finder.findPath(object.pos.x,object.pos.z,object.targetPos.x,object.targetPos.z,grid.clone())
		//};
		//var grid = object.grid;
		//var finder = object.finder;
		var steps = 1;
		steps = (object.navData.path.length>steps) ? steps : object.navData.path.length-1;
		object.pos.x=object.navData.path[steps][0];
		object.pos.z=object.navData.path[steps][1];
		//io.sockets.emit('movePlayer', {name: objects[socket.id].name, model: objects[socket.id].model, pos: objects[socket.id].pos})
		for(var i=0; i<steps; i++)
			object.navData.path.shift();
		if(object.navData.path.length<1) {
			//process.send({cmd: 'deleteNav', objectName: object.name, objectType: objectType, socketid: object.owner});
			//delete object.navData[object.navName];
		} else if(object.navData != []) {
			//setTimeout(function() {runPathData(grid, finder, object, targetPos, moveMult, steps, socket, io, true);},100/object.speed);
			process.send({cmd: 'updateObject', objectName: object.name, objectType: objectType, socketid: object.owner, objectPos: object.pos, navData: object.navData, timerID: object.moveTimer});
		}
	} catch (e) {
			//console.warn("FATAL ERROR: "+e.toString());
			//if(object.navName != undefined) delete object.navData[object.navName];
			//process.send({cmd: 'stopMoveTimer', timerID: object.moveTimer});
			//process.send({cmd: 'deleteNav', objectName: object.name, objectType: objectType, socketid: object.owner});
	}
}

function runZombiePathData(object) {
	try {
		//object.navData = {
		//	path: finder.findPath(object.pos.x,object.pos.z,object.targetPos.x,object.targetPos.z,grid.clone())
		//};
		//var grid = object.grid;
		//var finder = object.finder;
		var steps = 1;
		steps = (object.navData.path.length>steps) ? steps : object.navData.path.length-1;
		object.pos.x=object.navData.path[steps][0];
		object.pos.z=object.navData.path[steps][1];
		//io.sockets.emit('movePlayer', {name: objects[socket.id].name, model: objects[socket.id].model, pos: objects[socket.id].pos})
		for(var i=0; i<steps; i++)
			object.navData.path.shift();
		if(object.navData.path.length<1) {
			//process.send({cmd: 'deleteZombieNav', objectName: object.name});
			//delete object.navData[object.navName];
		} else if(object.navData != []) {
			//setTimeout(function() {runPathData(grid, finder, object, targetPos, moveMult, steps, socket, io, true);},100/object.speed);
			process.send({cmd: 'updateZombieObject', objectName: object.name, objectPos: object.pos, navData: object.navData, timerID: object.moveTimer});
		}
	} catch (e) {
			//console.warn("FATAL ERROR: "+e.toString());
			//if(object.navName != undefined) delete object.navData[object.navName];
			//process.send({cmd: 'stopMoveTimer', timerID: object.moveTimer});
			//process.send({cmd: 'deleteNav', objectName: object.name, objectType: objectType, socketid: object.owner});
	}
}

// End pathfinding functions //

// Start utility functions //

Object.prototype.clone = function() {
	if (this == null) return this;
	var clonedObj = new Object();
	for (var attr in this) {
		if (this.hasOwnProperty(attr)) clonedObj[attr] = this[attr];
	}
	return clonedObj;
};

Object.prototype.randProp = function() {
	if (this == null) return this;
	return this[Object.keys(this)[Math.floor(Math.random() * Object.keys(this).length)]];
};

Object.prototype.length = function() {
	if (this == null) return this;
	var thisLength = 0;
	for(key in this) {
		if(this.hasOwnProperty(key)) thisLength++;
	}
	return thisLength;
};

// End utility functions //