var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var util = require("./util");
var _ = require("lodash");

app.use(express.static("public"));

var users = [];

var get_users = function() {
	return users;
};

var get_challenges = function() {
	var challengers = _.filter(users, { "open_challenge": true });
	var challenges = [];
	for(var i=0; i<challengers.length; i++) {
		var challenger = challengers[i];
		challenges.push({
			"sender": challenger["username"]
		});
	}
	return challenges;
};

io.on("connection", function(socket) {
	var username = util.token(6);
	users.push({
		"username": username,
		"in_game": false,
		"open_challenge": false,
	});
	socket.on("lobby/join", function(data, callback) {
		callback(null, username);
		io.emit("lobby/users", get_users());
		io.emit("lobby/challenges", get_challenges());
	});
	socket.on("lobby/challenge", function(data, callback) {
		var index = _.findIndex(users, { "username": username });
		users[index]["open_challenge"] = true;
		io.emit("lobby/challenges", get_challenges());
		callback();
	});
	socket.on("lobby/accept", function(data, callback) {
		var index = _.findIndex(users, { "username": username });
		var senderIndex = _.findIndex(users, { "username": data["sender"] });
		users[index]["open_challenge"] = false;
		users[senderIndex]["open_challenge"] = false;
		users[index]["in_game"] = true;
		users[senderIndex]["in_game"] = true;
		io.emit("lobby/users", get_users());
		io.emit("lobby/challenges", get_challenges());
		callback();
	});
	socket.on("disconnect", function() {
		_.pullAllBy(users, [{ "username": username }], "username");
		io.emit("lobby/users", get_users());
	});
});

var host = "127.0.0.1";
var port = 80;
server.listen(port, host, function() {
	console.log("Listening on port " + port + "...");
});