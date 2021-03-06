var socket = io();
var username, player, gid;
var time, startTime, prevTime = 0, mines;
var game;
var mode = 1; // 1 = quick flagging
var timeOffset = 0;
var auth = {
	logged_in: false
};
var width = 15;
var height = 18;
var nummines = 48;
$.event.special.tap.tapholdThreshold = 200;
socket.emit("lobby/join", {}, function(error, message) {
	username = message["username"];
	timeOffset = message["time"] - ~~(new Date().getTime() / 1000);
	console.log(timeOffset);
	socket.on("lobby/users", function(users) {
		var userlist = document.getElementById("users");
		userlist.innerHTML = "";
		for(var i=0; i<users.length; i++) {
			var user = users[i];
			var userElement = document.createElement("li");
			userElement.innerHTML = user["username"];
			if (user["username"] == username) userElement.style.fontWeight = "bold";
			if (user["in_game"] == true) userElement.style.fontStyle = "italic";
			if (user["username"] == username && user["in_game"] == true) start_game();
			userlist.appendChild(userElement);
		}
		document.getElementById("usercount").innerHTML = users.length + " user" + ((users.length != 1) ? "s" : "") + " online";
	});
	socket.on("lobby/challenges", function(challenges) {
		var challengelist = document.getElementById("challenges");
		challengelist.innerHTML = "";
		for(var i=0; i<challenges.length; i++) {
			var challenge = challenges[i];
			var challengeElement = document.createElement("li");
			if (challenge["sender"] == username) {
				challengeElement.innerHTML = challenge["sender"];
			} else {
				var challengeLink = document.createElement("a");
				challengeLink.innerHTML = challenge["sender"];
				challengeLink.href = "javascript:accept_challenge('" + challenge["sender"] + "');";
				challengeElement.appendChild(challengeLink);
			}
			challengelist.appendChild(challengeElement);
		}
	});
	socket.on("game/over", function(data) {
		if (data["winner"] == username) {
			alert("You win!");
		} else {
			alert("You lose :(");
		}
		$("#lobby").show();
		$("#board").hide();
	});
	socket.on("lobby/message", function(data) {
		var row = document.createElement("tr");
		var col0 = document.createElement("td");
		col0.innerHTML = moment(data["timestamp"] + 2705000 /*hack*/, "x").add(moment().utcOffset(), "minutes").format("LT");
		col0.className = "timestamp";
		col0.style.minWidth = "90px";
		col0.style.textAlign = "right";
		var col1 = document.createElement("th");
		col1.innerHTML = data["sender"];
		var col2 = document.createElement("td");
		col2.innerHTML = data["message"];
		col2.style.overflowX = "hidden";
		col2.style.whiteSpace = "nowrap";
		row.appendChild(col0);
		row.appendChild(col1);
		row.appendChild(col2);
		document.getElementById("messagelist").appendChild(row);
		var objDiv = document.getElementById("chatmessages");
		objDiv.scrollTop = objDiv.scrollHeight;
	});
	window.create_challenge = function() {
		socket.emit("lobby/challenge", {}, function(error, message) {
			// console.log("Created challenge!");
		});
	};
	window.accept_challenge = function(sender) {
		socket.emit("lobby/accept", { "sender": sender }, function(error, message) {
			start_game();
		});
	};
	window.set_board = function(board) {
		var toHtml = function(n, k) {
		    var centerx = Math.floor(width/2);
		    var centery = Math.floor(height/2);
		    var cellClass = "cell";
		    if (k == centery * width + centerx) cellClass += " centercell";
			switch (n) {
				case -2:
					return [cellClass + " covered", "<span class='flag'>&#x2691;</span>"];
				case -1:
					return [cellClass + " covered", "<span></span>"];
				case 0:
					return [cellClass, "<span class='blank'></a>"];
				case 1: case 2: case 3: case 4: case 5: case 6: case 7: case 8:
					return [cellClass, "<span class='number num" + n + "'>" + n + "</span>"];
				default:
					break;
				/*case -2:
					return "<img src='img/flag-mine.png' />";
				case -1:
					return "<img src='img/covered.png' />";
				case 0:
					return "<img src='img/empty.png' />";
				case 1: case 2: case 3: case 4: case 5: case 6: case 7: case 8:
					return "<img src='img/number-" + n + ".png' />";
				default:
					break;*/
			}
		};
		var width = game["width"], height = game["height"];
		var html = "<table border=0 cellspacing=0 cellpadding=0>";
		for(var j=0; j<height; j++) {
			html += "<tr>";
			for(var i=0; i<width; i++) {
				var k = j * width + i;
				html += "<td>";
				var X = toHtml(board[k], k);
				html += "<a class='" + X[0] + "' id='cell" + k + "'>" + X[1] + "</a>";
				html += "</td>";
			}
			html += "</tr>";
		}
		html += "</table>";
		$("#actual_board").html(html);
		for(var j=0; j<height; j++) {
			for(var i=0; i<width; i++) {
				var k = j * width + i;
				(function(i, j, k) {
					var flag_func = function(e) {
						e.preventDefault();
						// console.log(i + ", " + j);
						if (time >= 0) {
							/* console.log(game.flag(j, i));
							set_board(game.getBoard()); */
							// $("#mines").html(mines);
							flag_square(k);
						}
						return false;
					};
					var tap_func = function(e) {
						click_square(k);
					};
					if (mode == 0) {
						document.getElementById("cell" + k).oncontextmenu = flag_func;
						$("#cell" + k).taphold(flag_func);
						$("#cell" + k).tap(tap_func);
						$("#cell" + k).click(tap_func);
					} else if (mode == 1) {
						document.getElementById("cell" + k).oncontextmenu = tap_func;
						$("#cell" + k).taphold(tap_func);
						$("#cell" + k).tap(flag_func);
						$("#cell" + k).click(flag_func);
					}
				})(i, j, k);
			}
		}
	};
	window.click_square = function(k) {
		var i = k % game["width"];
		var j = ~~(k / game["width"]);
		if (time >= 0) {
			if (game.getBoard()[k] == -1) {
				game.open(j, i);
			} else {
				game.chord(j, i);
			}
			set_board(game.getBoard());
			game_state = game.getState();
			if (game_state == 2 || game_state == 3) {
				game_over();
			}
		}
	};
	window.flag_square = function(k) {
		var i = k % game["width"];
		var j = ~~(k / game["width"]);
		if (time >= 0) {
			if (game.getBoard()[k] == -1 || game.getBoard() == -2) {
				game.flag(j, i);
			} else {
				game.chord(j, i);
			}
			mines = game.mines - game.board.flagged;
			$("#mines").html(mines);
			set_board(game.getBoard());
		}
		return false;
	};
	window.game_over = function() {
		var status = game.getState();
		var cb = function(error, message) {
			$("#overlay").hide();
		};
		var data = {
			gid: gid,
			result: game.getState() - 2,
			player: player
		};
		if (game.getState() == Minsweeper.DIED) {
			socket.emit("game/lose", data, cb);
		} else if (game.getState() == Minsweeper.COMPLETED) {
			socket.emit("game/win", data, cb);
		}
	};
	window.frame = function() {
		time = ~~(new Date().getTime() / 1000.0) - startTime;
		$("#time").html(time);
		if (time < 0) {
			$("#countdown").html(-1 * time);
		} else {
			$("#overlay").hide();
		}
		if (time != prevTime) {
			if (time == 0) {
				$("#overlay").hide();
				// click_square(~~(height/2) * width + ~~(width/2));
			}
			socket.emit("game/update", {
				gid: gid,
				from: username,
				player: player,
				mines: mines,
				time: time
			});
		}
		prevTime = time;
		requestAnimationFrame(frame);
	};
	window.start_game = function() {
		$("#lobby").hide();
		$("#board").show();
		$("#overlay").show();
		window.toggle_quickflag();
		window.toggle_quickflag();
		time = 0;
		socket.on("game/init", function(data) {
			// console.log(data);
			gid = data["gid"];
			if (data["player1"] == username) player = "player1";
			else if (data["player2"] == username) player = "player2";
			game = new Minsweeper(width, height, nummines, { }, parseInt(data["gid"].toLowerCase(), 36) % 15700);
			
			var mines = game["mines"];
			$("#mines, #opp_mines").html(mines);
			$("#time, #opp_time").html(0);
			startTime = data["start_time"] - timeOffset;
			set_board(game.getBoard());
			requestAnimationFrame(frame);
		});
		socket.on("game/update", function(data) {
			var opp = player == "player1" ? "player2" : "player1";
			$("#opp_mines").html(data[opp]["mines"]);
			$("#opp_time").html(data[opp]["time"]);
		});
	};
	window.send_message = function() {
		var message = $("#message").val();
		socket.emit("lobby/message", { message: message }, function() {
			$("#message").val("");
		});
	};
	window.toggle_quickflag = function() {
		if (mode == 0) {
			$(".quickflag_status").html("Turn Quickflag Off");
			$(".quickflag_status").css("color", "#090");
		} else {
			$(".quickflag_status").html("Turn Quickflag On");
			$(".quickflag_status").css("color", "#F00");
		}
		mode = mode == 0 ? 1 : 0;
		if (game) set_board(game.getBoard());
	};
	window.toggle_quickflag();
});