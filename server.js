"use strict";

var ws = require("ws");
var http = require("http");
var url = require("url");
var dgram = require('dgram');
var path = require("path");

var udpServer = dgram.createSocket('udp4');

var client = null;

var PORT = 9000;

var volumes = [];

const MAX_SAMPLES = 30;
const MAX_DEVIATIONS = 1.2;
const VOL_DIFFERENCE = 2.0;

var targetVolume = 1;

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

	if (volumes.length >= MAX_SAMPLES) {
		volumes.shift()
	}

	volumes.push(sample);

	console.log("Target volume = " + targetVolume);
	console.log("Difference in std deviations = " + Math.abs(average - targetVolume) / deviation);

	if (client != null) {
		if (Math.abs(average - targetVolume) > VOL_DIFFERENCE) {
			// do correction
			console.log("correcting volume");
			if (targetVolume > average) {
				client.send("5");
			} else {
				client.send("-5");
			}
		}
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

var nstatic = require("node-static");
var fileServe = new nstatic.Server(path.join(__dirname, "public"));

var server = http.createServer(function(req, res) {
	console.log("got an HTTP request. " + req.method + " " + req.url);

	if (req.method === "POST") {
		if (req.url === "/dec") {
			targetVolume -= 0.5;
			if (targetVolume <= 0) {
				targetVolume = 1;
			}
		} else if (req.url === "/inc") {
			targetVolume += 0.5;
		}
		res.end(targetVolume.toString());
		return;
	}

	req.addListener("end", function() {
		fileServe.serve(req, res, function(err, result) {
			if (err) {
				res.writeHead(err.status, err.headers);
				res.end();
			}
		});
	}).resume();
});

var wss = new ws.Server({ server: server });

server.listen(PORT, function() {
    console.log("HTTP server running.");
});

wss.on("connection", function(wsocket) {
    client = wsocket;
	console.log("WebSocket client connected.");
	wsocket.on("close", function() {
		client = null;
	})
});