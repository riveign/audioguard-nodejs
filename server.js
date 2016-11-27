"use strict";

var ws = require("ws");
var http = require("http");
var url = require("url");
var dgram = require('dgram');

var udpServer = dgram.createSocket('udp4');

var client = null;

var PORT = 9000;

var volumes = [];
var peakCounter = 0;

const MAX_SAMPLES = 20;
const MAX_DEVIATIONS = 1.5;

udpServer.on('error', (err) => {
	console.log(`server error:\n${err.stack}`);
	udpServer.close();
});

udpServer.on('message', (msg, rinfo) => {
	var sample = msg.readDoubleLE(0);
	onSampleReceived(sample);
});

udpServer.on('listening', () => {
	var address = udpServer.address();
	console.log(`server listening ${address.address}:${address.port}`);
});

udpServer.bind(9001);

function onSampleReceived(sample) {
	console.log("New Sample = " + sample);

	var average = avg();
	var deviation = stdv();

	console.log("Current average = " + average);
	console.log("Current deviation = " + deviation);

	var peak = false;

	if (volumes.length > 5) {
		if (sample > average && (Math.abs(sample - average) / deviation) > MAX_DEVIATIONS) {
			console.log("PEAK DETECTED.");
			peak = true;
		}

		if (volumes.length == MAX_SAMPLES) {
			volumes.shift()
		}
	}

	volumes.push(sample);

	if (peak) {
		peakCounter++;
	}

	if (client != null) {
		if (peakCounter > 1) {
			console.log("Lowering music volume");
			var amount = peakCounter * 5;
			client.send("-" + amount.toString());
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

var server = http.createServer(function(req, res) {
	 console.log("Got a HTTP request.");
	 res.end();
});

var wss = new ws.Server({ server: server });

server.listen(PORT, function() {
    console.log("HTTP server running.");
});

wss.on("connection", function(wsocket) {
    client = wsocket;
	console.log("WebSocket client connected.");

    wsocket.on("message", function(message) {

    });

	wsocket.on("close", function() {
		client = null;
	})
});