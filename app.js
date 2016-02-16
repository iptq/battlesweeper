var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var util = require("./util");
var mongodb = require("mongodb");
var Minsweeper = require("./public/Minsweeper");
var _ = require("lodash");
var moment = require("moment");

app.use(express.static("public"));

var users = [];
var games = [];
var db;

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
		"socket_id": socket.id
	});
	socket.on("lobby/message", function(data, callback) {
		var sender = username;
		var message = data["message"];
		var timestamp = ~~(moment().format("x"));
		io.emit("lobby/message", { sender: sender, message: message, timestamp: timestamp });
		callback();
	});
	socket.on("lobby/join", function(data, callback) {
		callback(null, { username: username, time: ~~(moment().format("X")) });
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
		var gid = util.token();
		var obj = {
			"gid": gid,
			"start_time": ~~(moment().add(5, "seconds").format("X")),
			"player1": username,
			"player2": data["sender"],
			"player1data": {},
			"player2data": {},
			"winner": -1
		};
		games.push(obj);
		users[index]["open_challenge"] = false;
		users[senderIndex]["open_challenge"] = false;
		users[index]["in_game"] = true;
		users[senderIndex]["in_game"] = true;
		users[index]["gid"] = gid;
		users[senderIndex]["gid"] = gid;
		io.sockets.connected[users[index]["socket_id"]].join(gid);
		io.sockets.connected[users[senderIndex]["socket_id"]].join(gid);
		io.emit("lobby/users", get_users());
		io.emit("lobby/challenges", get_challenges());
		io.to(gid).emit("game/init", obj);
		callback();
	});
	socket.on("game/update", function(data) {
		var from = data["from"];
		var query = {};
		query[data["player"]] = from;
		var gameIndex = _.findIndex(games, query);
		games[gameIndex][data["player"] + "data"] = { mines: data["mines"], time: data["time"] };
		var obj2 = {
			player1: {
				mines: games[gameIndex]["player1data"]["mines"] || 0,
				time: ~~(moment().format("X")) - games[gameIndex]["start_time"]
			},
			player2: {
				mines: games[gameIndex]["player2data"]["mines"] || 0,
				time: ~~(moment().format("X")) - games[gameIndex]["start_time"]
			}
		};
		io.to(data["gid"]).emit("game/update", obj2);
	});
	var cb = function(data) {
		var gid = data["gid"];
		var gameIndex = _.findIndex(games, { "gid": gid });
		var win = data["result"] == 1;
		games[gameIndex]["winner"] = parseInt(data["player"].replace("player", ""));
		var index = _.findIndex(users, { "username": games[gameIndex]["player1"] });
		var senderIndex = _.findIndex(users, { "username": games[gameIndex]["player2"] });
		users[index]["in_game"] = false;
		users[senderIndex]["in_game"] = false;
		io.to(gid).emit("game/over", {
			winner: win ? games[gameIndex][data["player"]] : games[gameIndex][data["player"] == "player1" ? "player2" : "player1"],
			duration: ~~(moment().format("X")) - games[gameIndex]["start_time"]
		});
		io.emit("lobby/users", get_users());
		io.emit("lobby/challenges", get_challenges());
	};
	socket.on("game/win", cb);
	socket.on("game/lose", cb);
	socket.on("disconnect", function() {
		_.pullAllBy(users, [{ "username": username }], "username");
		io.emit("lobby/users", get_users());
	});
});

mongodb.MongoClient.connect(process.env.MONGOLAB_URI, function(err, database) {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	db = database;
	console.log("Connected to MongoLab.");

	var host = process.env.HOST || "0.0.0.0";
	var port = ~~(process.env.PORT) || 80;
	server.listen(port, host, function() {
		console.log("Listening on port " + port + "...");
	});
});