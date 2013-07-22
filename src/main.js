var cmdArgs = process.argv.splice(2),
	express = require('express'),
	app = express(),
	http = require('http'),
	server = http.createServer(app).listen(/^\d+$/.test(cmdArgs[0]) ? cmdArgs[0] : 80),
	io = require('socket.io').listen(server),
	game = require('./server/game.js');

io.set('log level', 2);

app.use(express.static(__dirname+'/client/html'));
app.use(express.static(__dirname+'/client/js'));
app.use(express.static(__dirname+'/client/blender'));
app.use(express.static(__dirname+'/client/img'));
app.use(express.static(__dirname+'/lib/pathfinding/lib'));
app.use(express.static(__dirname+'/lib/qunit'));
app.use(express.static(__dirname+'/client/lib/threejs/build'));

io.sockets.on('connection', function(socket) {
	console.log("Got new connection "+socket.id+" from IP: "+socket.handshake.address.address);
	
	socket.on('newPlayer', function(data) {
		game.newPlayer(socket, io, data);
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
	socket.on('ping', function(data) {
		socket.emit('pong', data);
	});
});
game.startSpawningZombies(io);