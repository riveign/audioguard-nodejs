"use strict";

var ws = require("ws");
var http = require("http");
var url = require("url");

var client = null;

var PORT = 9000;

var volumes = null;

function requestHandler(req, res) {
    console.log("Handling HTTP request: " + req.method);
	var url_parts = url.parse(req.url, true);
	volumes = url_parts.query.volume;
	res.end();
	if (client != null){
		client.send(volumes);
	}
}

var server = http.createServer(requestHandler);
var wss = new ws.Server({ server: server });

server.listen(PORT, function() {
    console.log("HTTP server running.");
});

wss.on("connection", function(wsocket) {
    client = wsocket;
    wsocket.send("50");

    wsocket.on("message", function(message) {

    });
});