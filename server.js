"use strict";

var ws = require("ws");
var http = require("http");
var url = require("url");

var client = null;

var PORT = 9000;

var volumes = [];
var peakCounter = 0;

function requestHandler(req, res) {
	var url_parts = url.parse(req.url, true);
	var sample = parseFloat(url_parts.query.volume);
	console.log("New Sample = " + sample);

	var average = avg();
	var deviation = stdv();

	console.log("Current average = " + average);
	console.log("Current deviation = " + deviation);

	var peak = false;

	if (volumes.length > 5) {
		if (sample > average && (Math.abs(sample - average) / deviation) > 1.2) {
			console.log("PEAK DETECTED.");
			peak = true;
		}

		if (volumes.length == 10) {
			volumes.shift()
		}
	}

	volumes.push(sample);

	if (peak) {
		peakCounter++;
	}

	res.end();

	if (client != null) {
		if (peakCounter >= 2) {
			console.log("Lowering music volume");
			client.send("-30");
		}	
	}
	
	if (!peak) {
		console.log("Reseting peak count.");
		peakCounter = 0;
	}

	console.log ("New AVG = " + avg());
	console.log("New STDV = " + stdv());
	console.log(volumes);
	console.log("------\n");
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
		sum += (volumes[i] - average) * (volumes[i] - average);
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
	console.log("WebSocket client connected.");

    wsocket.on("message", function(message) {

    });
});