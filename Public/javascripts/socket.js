let ws = null;
let tWs = null;

let pingWait = null;
const maxWait = 128000;
let currentWait = 1000;


let preventReconnect = false;
let messageCallback = [];

let nonce = "";

/**
 * @return {number}
 */
function Jitter() {
	return Math.floor(Math.random() * 10);
}

/**
 * @return {string}
 */
function NewNonce() {
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const length = Math.floor(Math.random() * 10) + 5;
	for (let i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function onDisconnect(url, url2, success, onTwitchSub, twitchName) {
	const teWs = ws;
	const tetWs = tWs;
	if (teWs != null) {
		teWs.close();
		ws = null;
	}
	if (tetWs != null) {
		tetWs.close();
		tWs = null;
	}
	connectTwo(url, url2, success, onTwitchSub, twitchName)
}

function connectTwo(url, url2, success, onTwitchSub, twitchName) {
	// Connect
	ws = new WebSocket(url);
	tWs = new WebSocket(url2);

	// Establish handlers
	ws.onopen = () => {
		success();
		setTimeout(function () {
			ws.send(JSON.stringify({type: "PING"}));
			pingWait = setTimeout(function () {
				ws.close();
			}, 10000);
		}, 180000 + Jitter());
	};

	tWs.onopen = () => {
		console.log("Connected to Twitch");
		tWs.send("NICK justinfan1234");
		tWs.send("JOIN #joshog")
	};

	ws.onerror = () => {
		setTimeout(function () {
			onDisconnect(url, url2, success, onTwitchSub, twitchName);
		}, currentWait);
		currentWait *= 2;
	};

	ws.onclose = () => {
		console.log("Closed connection.");
		if (!preventReconnect) {
			onDisconnect(url, url2, success, onTwitchSub, twitchName);
		}
	};

	ws.onmessage = InterpretMessage;

	tWs.onmessage = (msg) => {
		const data = msg.data.trim();
		if (data.indexOf("twitchnotify") != -1) {
			console.log(data);
		}
		if (data === "PING :tmi.twitch.tv") {
			tWs.send("PONG :tmi.twitch.tv");
			console.log(">>PONG :tmi.twitch.tv");
			console.log(data);
		}
		if (data.indexOf("twitchnotify!twitchnotify@twitchnotify.tmi.twitch.tv") != -1) {
			const sub = data.replace(/:.+?:/, '');
			const nameRegex = /(.+?) just subscribed/;
			const countRegex = /for ([0-9]+?) months in a row/;
			const name = nameRegex.exec(sub)[1];
			const tmpCount = countRegex.exec(sub);
			let count;
			if (tmpCount === null) {
				count = 0;
			} else {
				count = tmpCount[1]
			}
			console.log(name);
			console.log(count);
			onTwitchSub(name, count)
		} else if (data.indexOf("twitchnotify") != -1) {
			console.log("what?");
			const sub = data.replace(/:.+?:/, '');
			console.log(sub)
		}
	};
}

function Connect(url, success) {
	// Connect
	ws = new WebSocket(url);

	// Establish handlers
	ws.onopen = function () {
		success();
		setTimeout(function () {
			ws.send(JSON.stringify({type: "PING"}));
			pingWait = setTimeout(function () {
				ws.close();
			}, 10000);
		}, 180000 + Jitter());
	};

	ws.onerror = function () {
		setTimeout(function () {
			//Connect(url, success);
		}, currentWait);
		currentWait *= 2;
	};

	ws.onclose = function () {
		console.log("Closed connection.");
		if (!preventReconnect) {
			setTimeout(function () {
			//	Connect(url, success);
			}, 10000);
		}
	};

	ws.onmessage = InterpretMessage;
}

function Listen(topic, auth, msgCallback) {

	if (ws != null) {
		if (ws.readyState == ws.OPEN) {
			nonce = NewNonce();
			const command = {
				"type": "LISTEN",
				"nonce": nonce,
				"data": {
					topics: [topic],
					auth_token: auth
				}
			};

			console.log(command);
			ws.send(JSON.stringify(command));

			for (let i = 0; i < messageCallback.length; i++) {
				if (messageCallback[i].topic == topic) {
					return;
				}
			}

			messageCallback.push({topic: topic, callback: msgCallback});
		}
	}
}

//function Fake(topic, msgCallback) {
//    
//    messageCallback.push({ topic: topic, callback: msgCallback });
//}

function InterpretMessage(message) {
	if (message.data == "PING") {
		ws.send("PONG");
		return
	}

	console.log(message);

	const parsed = JSON.parse(message.data);

	if (parsed.type == "RESPONSE") {
		if (parsed.nonce != nonce) {
			preventReconnect = true;
			ws.close();
		}
		if (parsed.error != "") {
			console.log(parsed.error);
			preventReconnect = true;
			ws.close();
			messageCallback = [];
		}
		return;
	}

	if (parsed.type == "PONG") {
		if (pingWait != null) {
			clearTimeout(pingWait);
		}

		setTimeout(function () {

			ws.send(JSON.stringify({type: "PING"}));
			pingWait = setTimeout(function () {

				ws.close();
			}, 10000);
		}, 180000 + Jitter());

		return;
	}

	if (parsed.type == "MESSAGE") {
		for (let i = 0; i < messageCallback.length; i++) {
			if (messageCallback[i].topic == parsed.data.topic) {
				messageCallback[i].callback(JSON.parse(parsed.data.message));
				return;
			}
		}
		console.log("Found no use for previous message.");
	}
}