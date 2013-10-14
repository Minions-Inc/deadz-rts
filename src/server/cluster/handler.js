var cluster = require('cluster'),
	EventEmitter = require('events').EventEmitter,
	events = new EventEmitter();
var currTasks = 0, currWorkers = 0;

if(cluster.isMaster) { // Left in for saftey
	cluster.setupMaster({
		exec: __dirname+'/worker.js',
		silent: false
	});

	for(var i=1; i<require('os').cpus().length; i++) { // Leave 1 thread free for the master and whatever else is going on in the computer
		setupWorker();
	}

	cluster.on('exit', function(worker, code, signal) { // When a worker crashes or exits
		console.log('Worker ' + worker.workerID + ' has died. Restarting...');
		currJobs -= worker.currTasks;
		currWorkers--;
		setupWorker();
	});
}


// Called when a worker is to be spawned (Master)
function setupWorker() {
	var worker = cluster.fork();
	worker.currJobs = 0;
	worker.on('message', function(data) {
		if(!data.cmd)
			return;
		if(data.cmd == 'finishedTask') { // When the load-balanced task has finished
			worker.currJobs--;
			currTasks--;
			//console.log('Worker #' + worker.workerID + ' has finished running ' + data.task);
		} else if(data.cmd == 'notifyMaster') { // To log a message on the master
			console.log('Worker #' + worker.workerID + ' sent a message: ' + data.msg);
		} else if(data.cmd == 'setVars') { // To send variables to the master
			for(var i in data.vars) {
				global[i] = data.vars[i];
			}
		} else if(data.cmd == 'getVars') { // To send variables to the worker
			var varsToSend = {};
			for(var i=0; i<data.vars.length; i++) {
				varsToSend[data.vars[i]] = global[data.vars[i]];
			}
			worker.send({cmd: 'globalVars', vars: varsToSend});
		} else if(data.cmd == 'emitEvent') {
			events.emit(data.eventName, data.eventData);
		} else if(data.cmd == 'deleteNav') {
			events.emit('deleteNav', {objectName: data.objectName, objectType: data.objectType, socketid: data.socketid});
		} else if(data.cmd == 'setupNavData') {
			events.emit('setupNavData', {objectName: data.objectName, socketid: data.socketid, objectType: data.objectType, navData: data.navData});
		} else if(data.cmd == 'updateObject') {
			events.emit('updateObject', {objectName: data.objectName, objectType: data.objectType, socketid: data.socketid, objectPos: data.objectPos, navData: data.navData, timerID: data.timerID});
		} else if(data.cmd == 'stopMoveTimer') {
			events.emit('stopMoveTimer', {timerID: data.timerID});
		} else if(data.cmd == 'updateZombieObject') {
			events.emit('updateZombieObject', {objectName: data.objectName, objectPos: data.objectPos, navData: data.navData, timerID: data.timerID});
		} else if(data.cmd == 'deleteZombieNav') {
			events.emit('deleteNav', {objectName: data.objectName});
		}
	});
	currWorkers++;
}

// Run a function for each worker (Master)
function eachWorker(callback) {
	for (var id in cluster.workers) {
		callback(cluster.workers[id]);
	}
}

// Load balancing function (Master)
function taskWorker(cmd, params) {
	var minTasks = Math.floor(currTasks/currWorkers);
	for(var id in cluster.workers) {
		if(cluster.workers[id].currJobs <= minTasks) {
			currTasks++;
			cluster.workers[id].currJobs++;
			cluster.workers[id].send({cmd: cmd, params: params});
			//console.log('Worker #' + id + ' has started running ' + cmd);
			return true;
		}
	}
	return false;
}

module.exports = {
	events: events,
	taskWorker: taskWorker,
	eachWorker: eachWorker
};