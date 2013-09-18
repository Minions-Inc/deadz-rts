var cmdArgs = process.argv.splice(2),
	express = require('express'),
	app = express(),
	http = require('http'),
	server = http.createServer(app).listen(/^\d+$/.test(cmdArgs[0]) ? cmdArgs[0] : 80),
	io = require('socket.io').listen(server),
	game = require('./server/game.js');

io.set('log level', 2);
io.set('close timeout', 30);
io.set('heartbeat timeout', 30);
io.set('heartbeat interval', 15);

app.use(express.static(__dirname+'/client/html'));
app.use(express.static(__dirname+'/client/js'));
app.use(express.static(__dirname+'/client/blender'));
app.use(express.static(__dirname+'/client/img'));
app.use(express.static(__dirname+'/lib/pathfinding/lib'));
app.use(express.static(__dirname+'/lib/MicroCache'));
app.use(express.static(__dirname+'/lib/qunit'));
app.use(express.static(__dirname+'/client/lib/threejs/build'));

io.sockets.on('connection', function(socket) {
	console.log("Got new connection "+socket.id+" from IP: "+socket.handshake.address.address);
	
	socket.on('newPlayer', function() {
		//game.newPlayer(socket, io);
		socket.emit("loadModels", game.requiredModels);
	});

	socket.on('loadedModels', function() {
		game.newPlayer(socket, io);
	});

	socket.on('clickPos', function(data) {
		game.clickPos(socket, io, data);
	});

	socket.on('selectedObj', function(data) {
		game.selectedObj(socket, io, data);
	});
	
	socket.on('eval', function(data) {
		io.sockets.emit('eval', data);
	});

	socket.on('createBuilding', function(data) {
		game.createBuilding(socket, data);
	});
	
	socket.on('disconnect', function() {
		console.log(socket.id+" has disconnected.");
		try {
			game.disconnected(socket, io);
		} catch (e) {
			console.warn("FATAL ERROR: "+e);
		}
	});
	socket.on('ping1', function() {
		socket.emit('pong1');
	});
	socket.on('ping2', function(data) {
		socket.emit('pong2', data);
	});
	socket.on('rep', function() {
		game.reproduce();
	});
});
game.startSpawningZombies(io);
setInterval(function(){game.attackCheck(io);}, 500);
setInterval(game.reproduce, 30000);
setInterval(game.minionGatherTeam, 15000)
updateSceneObjects();



function updateSceneObjects() {
	var objsToSend = [];
	for(var i in game.objects) {
		if(game.objects.hasOwnProperty(i)) {
			for(var j in game.objects[i].Characters.Minions) {
				if(game.objects[i].Characters.Minions.hasOwnProperty(j)) {
					objsToSend.push(game.objects[i].Characters.Minions[j]);
				}
			}
			for(var j in game.objects[i].Characters.Commanders) {
				if(game.objects[i].Characters.Commanders.hasOwnProperty(j)) {
					objsToSend.push(game.objects[i].Characters.Commanders[j]);
				}
			}
			for(var j in game.objects[i].Characters.Hero) {
				if(game.objects[i].Characters.Hero.hasOwnProperty(j)) {
					objsToSend.push(game.objects[i].Characters.Hero[j]);
				}
			}
			for(var j in game.objects[i].buildings) {
				if(game.objects[i].buildings.hasOwnProperty(j)) {
					objsToSend.push(game.objects[i].buildings[j]);
				}
			}
		}
	}
	for(var i in game.zombies) {
		if(game.zombies.hasOwnProperty(i)) {
			objsToSend.push(game.zombies[i]);
		}
	}
	io.sockets.emit('updateObjects', objsToSend)
		//io.sockets.emit('movePlayer', {name: objects[socket.id].name, model: objects[socket.id].model, pos: objects[socket.id].pos})
	setTimeout(updateSceneObjects, 100);
}