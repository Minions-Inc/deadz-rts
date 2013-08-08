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
	
	socket.on('newPlayer', function(data) {
		game.newPlayer(socket, io, data);
	});

	socket.on('loadedModels', function(data) {
		game.sendPlayers(socket, io, data);
	});

	socket.on('movePlayer', function(data) {
		game.movePlayer(socket, io, data);
	});

	socket.on('clickPos', function(data) {
		game.clickPos(socket, io, data);
	});
	
	socket.on('eval', function(data) {
		io.sockets.emit('eval', data);
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
});
game.startSpawningZombies(io);
updateSceneObjects();



function updateSceneObjects() {
	var objsToSend = [];
	for(var i in game.objects) {
		if(game.objects.hasOwnProperty(i)) {
			objsToSend[objsToSend.length] = game.objects[i];
		}
	}
	for(var i in game.zombies) {
		if(game.zombies.hasOwnProperty(i)) {
			objsToSend[objsToSend.length] = game.zombies[i];
		}
	}
	io.sockets.emit('updateObjects', objsToSend)
		//io.sockets.emit('movePlayer', {name: objects[socket.id].name, model: objects[socket.id].model, pos: objects[socket.id].pos})
	setTimeout(updateSceneObjects, 500);
}