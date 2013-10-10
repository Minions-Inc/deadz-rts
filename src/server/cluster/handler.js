var cluster = require('cluster');
var currTasks = 0, currWorkers = 0;

if(cluster.isMaster) {
	for(var i=1; i<require('os').cpus().length; i++) { // Leave 1 thread free for the master and whatever else is going on in the computer
		setupWorker();
	}

	cluster.on('exit', function(worker, code, signal) { // When a worker crashes or exits
		console.log('Worker ' + worker.workerID + ' has died. Restarting...');
		currJobs -= worker.currTasks;
		currWorkers--;
		setupWorker();
	});
} else if(cluster.isWorker) {
	console.log("Cluster worker ID #" + cluster.worker.id + " has started");
	process.on('message', function(data) {
		if(!data.cmd)
			return;
		if(data.cmd == 'eval')
			eval(data.params);
		else if(data.cmd == 'globalVars') {
			for(var i in data.vars)
				global[i] = data.vars[i];
		}

		process.send({cmd: 'finishedTask', workerID: cluster.worker.id, task: data.cmd}); // Tell the master we have finished the task that was sent
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
			console.log('Worker #' + worker.workerID + ' has finished running ' + data.task);
		} else if(data.cmd == 'notifyMaster') { // To log a message on the master
			console.log('Worker #' + data.workerID + ' sent a message: ' + data.msg);
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
			console.log('Worker #' + id + ' has started running ' + cmd);
			return true;
		}
	}
	return false;
}