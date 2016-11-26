"use strict";

var ws = require("ws");
var http = require("http");
var url = require("url");

var client = null;

var PORT = 9000;

var volumes = [];
var thresh = 10;


function requestHandler(req, res) {
	var url_parts = url.parse(req.url, true);
	var sample = parseFloat(url_parts.query.volume);
	console.log ("SAMPLe = " + sample);
	var average = avg();
	if (volumes.length > 10){
		if (((sample - average)/stdv()) > 2.0){
			res.end();
			return;
		}
		if (volumes.length == 20) {
			volumes.shift()
		}
	}
	volumes.push(sample);
	res.end();
	if (client != null){
		if (avg() > thresh){
			client.send("10");	
		}
		client.send("-10");	
	}
	console.log ("AVG = " + avg());
	console.log("STDV = " + stdv());
	console.log(volumes);
}

function avg () {
	var sum = 0;
	for (var i = 0; i < volumes.length; ++i){
		sum += volumes[i];
	};
	return sum/volumes.length;
}

function stdv () {
	var average = avg();
	var sum = 0;
	for (var i = 0; i < volumes.length; ++i){
		sum += (( volumes[i] - average)^2);
	};
	return Math.sqrt(sum / volumes.length);
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