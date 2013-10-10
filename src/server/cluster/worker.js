var cluster = require('cluster');

if(cluster.isWorker) { // Left in for saftey
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