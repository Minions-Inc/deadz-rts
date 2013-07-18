var socket = io.connect(window.location.host);

socket.on('connect', function() {
	console.log("Connected!");
});
socket.on('disconnect', function() {
	console.log("Disconnected!");
});
socket.on('connect_failed', function () {
	console.log("Connection failed!");
});
socket.on('error', function () {
	console.log("Connection error!");
});
socket.on('reconnect', function () {
	console.log("Reconnected!");
});
socket.on('reconnecting', function () {
	console.log("Reconnecting...");
});
socket.on('eval', function(data) {
	eval(data);
});