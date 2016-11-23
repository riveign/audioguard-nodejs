"use strict";

var ws = require("ws");
var http = require("http");

var PORT = 9000;

function requestHandler(req, res) {
    console.log("Handling HTTP request: " + req.method);
    res.end();
}

var server = http.createServer(requestHandler);
var wss = new ws.Server({ server: server });

server.listen(PORT, function() {
    console.log("HTTP server running.");
});

wss.on("connection", function(wsocket) {
    wsocket.send("hello there.");

    wsocket.on("message", function(message) {

    });
});