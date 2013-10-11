var cluster = require('cluster'),
	navData = require('../../client/js/navDataSmall.js'),
	PF = require('../../lib/pathfinding');

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
			console.log("Worker #" + cluster.worker.workerID + " got setupNavData!");
			setupNavData(data.params.object, 128, 128, data.params.id);
		} else if(data.cmd == 'runPathData') {
			runPathData(data.params.object);
		}
		process.send({cmd: 'finishedTask', workerID: cluster.worker.id, task: data.cmd}); // Tell the master we have finished the task that was sent
	});
}


// Start pathfinding functions //

function setupNavData(object, height, width, socketid) {
	grid = new PF.Grid(width,height,c=navData.level1NavData);
	finder = new PF.AStarFinder({
		allowDiagonal:true,
		dontCrossCorners:true
	});
	process.send({cmd: 'setupNavData', objectName: object.name, grid: grid, finder: finder, socketid: socketid});
}

function runPathData(object, targetPos, moveMult) {
	try {
		object.navData = {
			path: object.finder.findPath(object.pos.x,object.pos.z,targetPos.x,targetPos.z,object.grid.clone())
		};
		var grid = object.grid;
		var finder = object.finder;
		var steps = 4;
		steps = (object.navData[object.navName].path.length>steps) ? steps : object.navData[object.navName].path.length-1;
		object.pos.x=object.navData.path[steps][0]*moveMult;
		object.pos.z=object.navData.path[steps][1]*moveMult;
		//io.sockets.emit('movePlayer', {name: objects[socket.id].name, model: objects[socket.id].model, pos: objects[socket.id].pos})
		object.navData.path.shift();
		if(object.navData.path.length<1) {
			process.send({cmd: 'deleteNav', objectName: object.name});
			//delete object.navData[object.navName];
		} else if(object.navData != []) {
			//setTimeout(function() {runPathData(grid, finder, object, targetPos, moveMult, steps, socket, io, true);},100/object.speed);
			process.send({cmd: 'updateObject', objectName: object.name, objectPos: object.pos, navData: object.navData});
		}
	} catch (e) {
			console.warn("FATAL ERROR: "+e.toString());
			//if(object.navName != undefined) delete object.navData[object.navName];
			process.send({cmd: 'deleteNav', objectName: object.name});
	}
}

// End pathfinding functions //