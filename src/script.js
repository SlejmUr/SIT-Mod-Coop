// include the module whose functions are to be overridden
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws'); // requires npm install ws on the Server
const net = require('net'); // natural TCP Sockets
const { responses } = require('../../../../src/functions/response');
const responseOverrides = require("./responseOverrides")
const location = require('../../../../src/classes/location');
const { VVAccount, VVBots, VVMatch } = require('./Classes/Classes');
const { logger } = require('../../../../core/util/logger');
const serverUrl = server.getBackendUrl();
const serverIp = server.getIp();
// const wsServerIp = server.getIp();
// const wsServerPort = server.getPort() + 2;
// const netSocketServerPort = wsServerPort + 1;
const { customQuests } = require('./customQuests');
const { customItems } = require('./customItems');
const { AccountServer } = require('../../../../src/classes/account');

const wsServerUrl = `ws://${server.getIp()}:${server.getPort()}`;

// console.log(wsServerPort);
// console.log(netSocketServerPort);

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
// net.createServer(function(sock) {
//   // We have a connection - a socket object is assigned to the connection automatically
//   let ipaddrandport = sock.remoteAddress +':'+ sock.remotePort;
//   logger.logSuccess('[MOD] TarkovCoop; CONNECTED: ' + ipaddrandport);
 
//  // Add a 'data' event handler to this instance of socket
//   sock.on('data', function(data) {
//     // console.log('DATA ' + ipaddrandport + ': ' + data);
// try {
// 	var jsonData = JSON.parse(data);
// 	// if(jsonData.groupId != undefined) {
// 	// 	// grab the correct server to apply stuff to.
// 	// 	let server = vvMatcher.getServerByGroupId(jsonData.groupId);
// 	// 	if(server != undefined) {
// 	// 		if(server.connections === undefined) {
// 	// 			server.connections = [];
// 	// 		}
// 	// 		if(server.connections.find(x=> x == ipaddrandport) == undefined) {
// 	// 			server.connections.push(ipaddrandport);
// 	// 			console.log("Server " + jsonData.groupId + " now has " + server.connections.length + " connections");
// 	// 		}
// 	// 	}
// 	// }
// 	// console.log(jsonData);
// }
// catch (error) {
// 	console.error(error);
// }
//     // Write the data back to the socket, the client will receive it as data from the server
//     // sock.write('You said "' + data + '"');
//   });
//   // Add a 'close' event handler to this instance of socket
//  sock.on('close', function(data) {
// 	logger.logSuccess('[MOD] TarkovCoop; CLOSED: ' + ipaddrandport);
// //    for(let s in vvMatcher.servers) {
// // 		if(vvMatcher[s] !== undefined) {
// // 			console.log(vvMatcher[s]);
			
// // 		}
// //    }
//  });

// }).listen(netSocketServerPort, wsServerIp);

// let serverSockets = [];
// TODO: The port needs to be dynamic from a file
// const wss = new WebSocket.Server(
// 	{ 
// 		host: wsServerIp
// 		, port: wsServerPort
// 		, perMessageDeflate: false
// 	 },()=>{
//     logger.logSuccess('[MOD] TarkovCoop; Web Socket Server::Started')
// });

// wss.on('error', function connection(error) {
// 	console.error(error);
// });

// wss.on('connection', function connection(ws) {
// 	serverSockets.push(ws);
// 	logger.logSuccess("[MOD] TarkovCoop; New WebSocket Connection");

//    ws.on('message', (data, isBinary) => {
// 	// console.log("message");

// 	if(data !== undefined) {
// 		// console.log(data);

// 		var outputData = {};
// 		// convert it in to something usable!
// 		var str = JSON.stringify(data.toString());
// 		// console.log(str);
// 		try {
// 			outputData = JSON.parse(str);
// 			console.log(outputData);
// 		} catch (error) {
// 			console.error(error);
// 		}

// 		//serverSockets.forEach(s => s.send(JSON.stringify(outputData)));
// 		wss.clients.forEach(function each(client) {
// 			if (client !== ws && client.readyState === WebSocket.OPEN) {
// 			  client.send(JSON.stringify(outputData), { binary: isBinary });
// 			}
// 		  });
// 	}
//    });

//    ws.on('ping', (data) => {
// 	// console.log("~~~ ping ~~~");
// 	if(data !== undefined)
// 		// console.log(JSON.stringify(data));
// 		wss.clients.forEach(function each(client) {
// 			if (client !== ws && client.readyState === WebSocket.OPEN) {
// 			  client.ping();
// 			}
// 		  });

// 	});
// 	ws.on('pong', (data) => {
// 		// console.log("~~~ pong ~~~");
// 		// if(data !== undefined)
// 		// console.log(JSON.stringify(data));
// 	});

// })
// wss.on('listening',()=>{
//    logger.logSuccess('[MOD] TarkovCoop; Web Socket Server::Listening::ws:\\\\' + wsServerIp + ":" + wsServerPort)
// })

// wss.on('close',()=>{
// 	logger.logSuccess('[MOD] TarkovCoop; Web Socket Server::Close::ws:\\\\' + wsServerIp + ":" + wsServerPort)
//  })

function DeepCopy(obj) {
	return JSON.parse(JSON.stringify(obj));
}


exports.mod = (mod_info) => {

	// console.log(mod_info);
	// const parentDir = process.cwd() + "/" + "user/mods/VVCoop_1.0.0/"
	const modConfig = mod_info;
	const gameMode = modConfig.Mode; // Can be Coop, PvP or PvPvE
	const modFolder = __dirname + "\\..\\"; // modfolder/
	const parentDir = __dirname + "\\..\\"; // modfolder/
	const srcDir = __dirname + "\\" ; // modfolder/src/
	const dbDir = srcDir + "\\db\\"; // modfolder/src/db

    logger.logInfo(mod_info.name + ". Loading...");
	// logger.logInfo(JSON.stringify(mod_info));
	
	// New Match Handler Class
	// let vvMatcher = new VVMatch();
	//logger.logInfo(JSON.stringify(match_f.handler));
	// initLocationAndLootOverrides();

	initMatchOverrides();

	initResponseOverrides();

	// New Account Handler Class
	let vvAccounter = new VVAccount();
	// account_f.handler.getAllAccounts = vvAccounter.getAllAccounts;
	AccountServer.getAllAccounts = vvAccounter.getAllAccounts;
	// AccountServer.getFriends = vvAccounter.getFriends;
	// AccountServer.addFriendRequest = vvAccounter.addFriendRequest;
	// AccountServer.addFriend = vvAccounter.addFriend;
	// AccountServer.getFriendRequestOutbox = vvAccounter.getFriendRequestOutbox;
	// AccountServer.getFriendRequestInbox = vvAccounter.getFriendRequestInbox;
	if(AccountServer.getAllAccounts === vvAccounter.getAllAccounts)
		logger.logSuccess("[MOD] TarkovCoop; Account Override Successful");
	else {
		logger.logError("[MOD] TarkovCoop; Account Override FAILED!");
	}

	// 
	// Apply Bot Changes

	// const modConfig = JSON.parse(fs.readFileSync(parentDir + 'mod.config.json'));
	// if(modConfig.BotDifficultyMiniMod.enable === true) {

	// 	var data = fs.readFileSync(parentDir + 'src/db/bots/normal.json');
	// 	data = JSON.parse(data);
	// 	global._database.bots.assault.difficulty.easy = data;
	// 	global._database.bots.assault.difficulty.normal = data;
	// 	global._database.bots.assault.difficulty.hard = data;
	// 	global._database.bots.assault.difficulty.impossible = data;

	// 	global._database.bots.pmcbot.difficulty.easy = data;
	// 	global._database.bots.pmcbot.difficulty.normal = data;
	// 	global._database.bots.pmcbot.difficulty.hard = data;
	// 	global._database.bots.pmcbot.difficulty.impossible = data;

	// 	global._database.bots.followerbully.difficulty.easy = data;
	// 	global._database.bots.followerbully.difficulty.normal = data;
	// 	global._database.bots.followerbully.difficulty.hard = data;
	// 	global._database.bots.followerbully.difficulty.impossible = data;

	// 	logger.logSuccess("[MOD] TarkovCoop; Applied Bot Difficulty data");
	// }		

	for(let b in global._database.bots) {
		// if(global._database.bots[b].health.BodyParts.Head !== undefined) {
		// 	global._database.bots[b].health.BodyParts.Head.min = 1;
		// 	global._database.bots[b].health.BodyParts.Head.max = 1;

		// 	global._database.bots[b].health.BodyParts.Chest.min = 85;
		// 	global._database.bots[b].health.BodyParts.Chest.min = 85;
			let botExperienceFilePath = 'user/mods/VVCoop_1.0.0/src/db/bots/' + b + '/experience.json';
			fs.exists(botExperienceFilePath, (e) => {
				if(e) {
					fs.readFile(botExperienceFilePath, 'utf8' , (err, data) => {
						if (err) {
						console.error(err)
						return;
						}
						data = JSON.parse(data);
						// console.log(global._database.bots[b].experience);
						global._database.bots[b].experience = data;

						logger.logSuccess("[MOD] TarkovCoop; Applied " + b + " experience data");

					});
				}
			});

			// let botDifficultyFilePath = 'user/mods/VVCoop_1.0.0/src/db/bots/' + b + '/aiconfig.json';
			// fs.exists(botDifficultyFilePath, (e) => {
			// 	if(e) {
			// 		fs.readFile(botDifficultyFilePath, 'utf8' , (err, data) => {
			// 			if (err) {
			// 			console.error(err)
			// 			return;
			// 			}
			// 			data = JSON.parse(data);
					
			// 			global._database.bots[b].difficulty.easy = data;
			// 			global._database.bots[b].difficulty.normal = data;
			// 			global._database.bots[b].difficulty.hard = data;
			// 			global._database.bots[b].difficulty.impossible = data;
				
			// 			logger.logSuccess("[MOD] TarkovCoop; Applied " + b + " ai config data");

			// 		});
			// 	}
			// });
		// }
	}

	for(let b in global._database.locations) {
		let locationBaseFilePath = 'user/mods/VVCoop_1.0.0/src/db/locations/base/' + b + '.json';
		fs.exists(locationBaseFilePath, (exists) => {
			if(exists) {
				fs.readFile(locationBaseFilePath, 'utf8' , (err, data) => {
					if (err) {
					  console.error(err)
					  return;
					}
					data = JSON.parse(data);
					global._database.locations[b].base = data;
				});
				logger.logSuccess("[MOD] TarkovCoop; Applied " + b + ".json location data");

			}
		});

		let locationLootFilePath = 'user/mods/VVCoop_1.0.0/src/db/locations/loot/' + b + '.json';
		fs.exists(locationLootFilePath, (exists) => {
			if(exists) {
				fs.readFile(locationLootFilePath, 'utf8' , (err, data) => {
					if (err) {
					  console.error(err)
					  return;
					}
					data = JSON.parse(data);
					global._database.locations[b].base = data;
				});
				logger.logSuccess("[MOD] TarkovCoop; Applied " + b + ".json loot data");

			}
		});
	}

	for(let b in global._database.items) {
		let itemBaseFilePath = 'user/mods/VVCoop_1.0.0/src/db/items/' + b + '.json';
		fs.exists(itemBaseFilePath, (exists) => {
			if(exists) {
				fs.readFile(itemBaseFilePath, 'utf8' , (err, data) => {
					if (err) {
					  console.error(err)
					  return;
					}
					data = JSON.parse(data);
					//global._database.items[b].base = data;
				});
				// logger.logSuccess("[MOD] TarkovCoop; Applied " + b + ".json items data");

			}
		});
	}

	const weatherDirectory = __dirname + "\\db\\weather";
	// console.log(weatherDirectory);
	//for(const index in global._database.weather) {
	//	console.log(index);
	let weatherIndex = 0;
		for(const fileName of fs.readdirSync(weatherDirectory)) {
			const weatherFilePath = weatherDirectory + "\\" + fileName;
			fs.readFile(weatherFilePath, 'utf8' , (err, data) => {
				if (err) {
				console.error(err)
				return;
				}
				data = JSON.parse(data);
				global._database.weather[weatherIndex] = data;
				// logger.logSuccess("[MOD] TarkovCoop; Applied " + weatherFilePath + " weather data");

			});
			weatherIndex++;
		}
	//}


customItems.LoadItems(mod_info);
	
customQuests.LoadCustomQuests(mod_info);

	// Setting up websocket
	// const webSocketServer = new WebSocket.Server({
	// 	"server": httpServer
	// });

	// webSocketServer.addListener("listening", () =>
	// {
	// 	Logger.success(`Started websocket at ${HttpServer.getWebsocketUrl()}`);
	// 	Logger.success("Server is running. Happy playing!");
	// });

	// webSocketServer.addListener("connection", HttpServer.wsOnConnection.bind(this));

	// Used to chat between Central and Web Socket
	// let clients = [
	// 	new WebSocket('ws://' + wsServerIp + ':' + wsServerPort),
	// ];

	// const sendToMatcher = function(serverGroupId, isBot, data) {
	// 	let server = vvMatcher.getServerByGroupId(serverGroupId);
	// 	if(server !== undefined) {
	// 		let personToAffect = isBot ? server.bots[data.accountId] : server.players[data.accountId];
	// 		if(personToAffect !== undefined) {
	// 			if(personToAffect.occurances === undefined) {
	// 				personToAffect.occurances = [];
	// 			}

	// 			personToAffect.occurances.push(data);
	// 		}
	// 	}
	// }
	
	// clients.map(client => {
	// 	client.on('message', msg => { 
	// 		logger.logInfo("[VVCoop] ~~~ Central Server received WS Message ~~~ ");
	// 		var outputData = {};
	// 		var str = JSON.stringify(msg.toString());
	// 		try {
	// 			outputData = JSON.parse(str);
	// 				logger.logInfo(outputData["groupId"]);
	// 				logger.logInfo(outputData.groupId);
	// 				if(outputData["groupId"] !== undefined) {
	// 				logger.logInfo(outputData);
	// 				let isBot = outputData.isBot !== undefined ? outputData.isBot : false;
	// 				sendToMatcher(outputData["groupId"], isBot, outputData);
	// 			}
	// 		} catch (error) {
	// 			logger.logInfo(error);
	// 		}
	// 	});
	// });
	  
}

