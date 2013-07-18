var express = require('express'),
	app = express(),
	http = require('http'),
	server = http.createServer(app).listen(80),
	io = require('socket.io').listen(server),
	game = require('./game.js');

io.set('log level', 2);

app.use(express.static(__dirname+'/client/html'));
app.use(express.static(__dirname+'/client/js'));
app.use(express.static(__dirname+'/client/blender'));
app.use(express.static(__dirname+'/client/img'));
app.use(express.static(__dirname+'/PathFinding.js-master/lib'));
app.use('/Ponies', express.static(__dirname+'/Ponies'));

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
		game.disconnected(socket, io);
	});
});
game.startSpawningZombies(io);