const { logger } = require('../../../../core/util/logger');
const { NotifierService } = require('../../../../src/classes/notifier');
const { Server, server } = require('../../../../core/server/server');
const { responses } = require('../../../../src/functions/response');
const { vvMatcher, VVAccount, VVBots, VVMatch } = require('./Classes/Classes');
const { AccountServer } = require('../../../../src/classes/account');
const { FriendshipController } = require('../../../../src/Controllers/FriendshipController');
const { ResponseController } = require('../../../../src/Controllers/ResponseController');
const { ConfigController } = require('../../../../src/Controllers/ConfigController');
const serverUrl = server.getBackendUrl();
const serverIp = server.getIp();
const wsServerIp = server.getIp();
const wsServerPort = server.getPort() + 2;

const urlPrefixes = {
	"location": "/client/location/",
	"group": "/client/match/group/",
	"groupServer": "/client/match/group/server/",
	"groupInvite": "/client/match/group/invite/"
}

initResponseOverrides = function() {

	// Override Loot Generation. 
	// If Server: Generate as normal
	// If Client: Use the same as server
	ResponseController.overrideRoute("/client/location/getLocalloot", 
	(url, info, sessionID) => {
		let location_name = "";
		const params = new URL(serverUrl + url).searchParams;
		if (typeof info.locationId != "undefined") {
		  location_name = info.locationId;
		} else {
		  location_name = params.get("locationId");
		}

		const serverIAmIn = vvMatcher.getServerIAmIn(sessionID);
		console.log("serverIAmIn");
		console.log(serverIAmIn);

		const d = location_f.handler.get(location_name);
		if(sessionID != undefined) {
			let serverViaHost = vvMatcher.getServerByGroupId(sessionID);
			// let serverViaClient = vvMatcher.servers // vvMatcher.getServerByGroupId(info.groupId);
			if(serverViaHost !== undefined) {
				serverViaHost.Loot = d.Loot;
				logger.logSuccess("Successfully saved Loot to Game Server {" + sessionID + "}");
			} 
			else {
				for(let itemIdOfServer in vvMatcher.servers) {
					if(vvMatcher.servers[itemIdOfServer] !== undefined && vvMatcher.servers[itemIdOfServer].Loot !== undefined) {
						d.Loot = vvMatcher.servers[itemIdOfServer].Loot;
						logger.logSuccess("Successfully loaded Loot from Game Server {" + itemIdOfServer + "}");
						break;
					}
				}
			}

		}

		return response_f.getBody(d);
	  });

	 

	  ResponseController.overrideRoute("/client/match/group/leave", 
	  (url, sessionID, info) => { console.log("/client/match/group/leave"); });

	

	responses.staticResponses["/client/match/group/getInvites"] = 
	  (url, sessionID, info) => { 
		return vvMatcher.getInvites(info);
		};

	responses.staticResponses["/client/match/group/invite/accept"] = 
	  (url, sessionID, info) => { 
		return vvMatcher.groupInviteAccept(sessionID, info);
	};

	responses.staticResponses["/client/match/group/invite/cancel"] = 
	  (url, sessionID, info) => { 
		return vvMatcher.groupInviteDecline(sessionID, info);
	};

	responses.staticResponses["/client/match/group/invite/send"] = 
	  (url, sessionID, info) => { 
		return vvMatcher.sendInvite(sessionID, info);
	};

	responses.staticResponses["/client/match/group/looking/start"] = 
	  (url, sessionID, info) => { 
		return vvMatcher.groupSearchStart(sessionID, info);
	};

	responses.staticResponses["/client/match/group/looking/stop"] = 
	  (url, sessionID, info) => { 
		return vvMatcher.groupSearchStop(sessionID, info);
	};

	responses.staticResponses["/client/match/group/server/start"] = 
	  (url, info, sessionID) => { 

		if(vvMatcher.servers === undefined)
			vvMatcher.servers = {};

			// THIS LINE IS FOR TESTING!!!!
		// if(vvMatcher.servers[sessionID] === undefined) 
			vvMatcher.servers[sessionID] = {
				ip: info,
				status: "LOADING",
				loot: {},
				players: [],
				bots: [],
				playersSpawnPoint: {}
			};

		let myAccount = AccountServer.getAllAccounts().find(x=>x._id == sessionID);
		let thisServer = vvMatcher.getServerByGroupId(sessionID);

		// console.log("New Server Started for AID " + sessionID + " on IP " + info);
		console.log(`New Server Started for AID ${sessionID} on IP ${ResponseController.SessionIdToIpMap[sessionID]}`);

    	return JSON.stringify(vvMatcher.servers[sessionID]);
	};

	ResponseController.Routes.push(
	{
			url: "/client/match/group/server/join",
			action:
		(url, info, sessionID) => { 

			console.log(info);
			console.log(sessionID);

			let groupId = info;
			if(info.groupId !== undefined)
				groupId = info.groupId;

			const thisServer = vvMatcher.getServerByGroupId(groupId);
			vvMatcher.joinServerByGroupId(info, sessionID);
			return JSON.stringify(thisServer);

		}
	});

	ResponseController.Routes.push(
		{
			url: "/client/match/group/server/getGameServerIp",
			action:
	(url, sessionID, info) => { 
		for(let itemIdOfServer in vvMatcher.servers) {
			if(vvMatcher.servers[itemIdOfServer] !== undefined && vvMatcher.servers[itemIdOfServer].Loot !== undefined) {
				return JSON.stringify(vvMatcher.servers[itemIdOfServer].ip);
			}
		}
	  }
	});

	responses.staticResponses["/client/match/group/server/status"] = 
	  (url, info, sessionID) => { 
		// console.log(info);
		// console.log(sessionID);
		if(vvMatcher.servers !== undefined) {
			// get the server by sessionid of the server / group leader
			if(vvMatcher.servers[info] !== undefined) {
				console.log(vvMatcher.servers[info]);
				return JSON.stringify(vvMatcher.servers[info]);
			}
		}

		console.log(sessionID + ". No Server has been started for group " + info);
		return null;
	};

	responses.staticResponses["/client/match/group/server/changestatus"] = 
	  (url, info, sessionID) => { 

		let existingServer = vvMatcher.getServerByGroupId(info.groupId);
		if(existingServer == null) {
			return response_f.getBody("ERROR");
		}
		existingServer.status = info.status;

		return response_f.getBody(existingServer);
	};

	responses.staticResponses["/client/match/group/server/getPlayersSpawnPoint"] = 
	  (url, info, sessionID) => { 

		let existingServer = vvMatcher.getServerByGroupId(info.groupId);
		if(existingServer == null) {
			return response_f.getBody("ERROR");
		}


		return JSON.stringify(existingServer.playersSpawnPoint);
	};

	responses.staticResponses["/client/match/group/server/setPlayersSpawnPoint"] = 
	  (url, info, sessionID) => { 

		let existingServer = vvMatcher.getServerByGroupId(info.groupId);
		if(existingServer == null) {
			return response_f.getBody("ERROR");
		}

		existingServer.playersSpawnPoint = info.playersSpawnPoint;

		return JSON.stringify(existingServer.playersSpawnPoint);
	};

	ResponseController.RoutesToNotLog.push("/client/match/group/server/parity");
	ResponseController.RoutesToNotLog.push("/client/match/group/server/parity/players");
	ResponseController.RoutesToNotLog.push("/client/match/group/server/parity/bots");

	ResponseController.Routes.push(
		{ url: "/client/match/group/server/parity",
		action: 
	  (url, info, sessionID) => { 

		console.log(info);
		let existingServer = vvMatcher.getServerByGroupId(info.groupId);
		if(existingServer == null) {
			return JSON.stringify("ERROR");
		}

		let playerDifference = false;
		let botDifference = false;

		// handle server telling us the game time
		// if(info.gameTime !== undefined) {
		// 	existingServer.gameTime = info.gameTime;
		// }

		// // handle server telling us the players in it
		if(info.playerData !== undefined) {
			// if the server knows about more players (which is will to start with, update)
			if(info.playerData.length > existingServer.players.length) {
				for(const newPlayer of info.playerData) {
					if(existingServer.players.findIndex(x => x.accountId === newPlayer.accountId) === -1) 
						existingServer.players.push(newPlayer);
				}
			}

		// 	// if server doesn't know about a client that has joined, update server
		// 	if(info.playerData.length < existingServer.players.length) {
		// 		playerDifference = true;
		// 	}
		}

		// // handle server telling us the bots in it
		// if(info.botData !== undefined && info.botData.length != existingServer.bots.length) {
		// 	logger.logInfo("Received New Data from Server on Bots");
		// 	if(existingServer.bots.length > 0)
		// 	{
		// 		for(let itemIndex in info.botData) {
		// 			let b = info.botData[itemIndex];
		// 			console.log(b);
		// 			if(existingServer.bots.find(x=>x.accountId == b.accountId) === undefined) {
		// 				existingServer.bots.push(b);
		// 			}
		// 		}
		// 	}
		// 	// existingServer.bots = info.botData;
		// }

		// // client is checking they have the same number of bots
		// if(info.botKeys !== undefined) {
		// 	botDifference = (info.botKeys.length !== existingServer.bots.length);
		// }

		// client is checking they have the same number of players
		// if(info.playerKeys !== undefined) {
		// 	playerDifference = (info.playerKeys.length !== existingServer.players.length);
		// }

		// if(playerDifference || botDifference) {
			console.log(`sending: ${existingServer.players.length} players`);
			let responseJson = {
				players: existingServer.players,
				// bots: existingServer.bots,
				// gameTime: existingServer.gameTime
			};
			return JSON.stringify(responseJson);
		// }
		// // its just the server telling us the game time
		// else if(info.gameTime !== undefined) {
		// 	// return JSON.stringify("{}");
		// }
		// // its the client requiring the game time
		// else {
		// 	// let responseJson = {
		// 	// 	gameTime: existingServer.gameTime
		// 	// };
		// 	// return JSON.stringify(responseJson);
		// }

		// return JSON.stringify(null);
	}
});

ResponseController.Routes.push(
	{ url: "/client/match/group/server/parity/bots",
	action: 
  (url, info, sessionID) => { 
		return JSON.stringify(null);
  }
});

ResponseController.Routes.push(
	{ url: "/client/match/group/server/parity/players",
	action: 
  (url, info, sessionID) => { 


	let existingServer = vvMatcher.getServerByGroupId(info.groupId);
	if(existingServer == null) {
		return response_f.getBody("ERROR");
	}

	let playerDifference = false;

	// handle server telling us the players in it
	if(info.playerData !== undefined) {
		// if the server knows about more players (which is will to start with, update)
		if(info.playerData.length > existingServer.players.length) {
			existingServer.players = info.playerData;
		}

		// if server doesn't know about a client that has joined, update server
		if(info.playerData.length < existingServer.players.length) {
			playerDifference = true;
		}
	}

	// client is checking they have the same number of players
	if(info.playerKeys !== undefined) {
		playerDifference = (info.playerKeys.length !== existingServer.players.length);
	}

	if(playerDifference) {
		// console.log(`sending: ${existingServer.players.length} players`);
		let responseJson = {
			players: existingServer.players
		};
		return JSON.stringify(responseJson);
	}

	return JSON.stringify(null);
}
});

ResponseController.RoutesToNotLog.push("/client/match/group/server/parity/dead/post");

ResponseController.Routes.push(
	{ url: "/client/match/group/server/parity/dead/post",
	action: 
  (url, info, sessionID) => { 

	let groupId = info.groupId !== undefined ? info.groupId : undefined;
	if (groupId === undefined && info.length !== undefined && info.length > 0)
		groupId = info[0].groupId;

	let existingServer = {};
	for(let server in vvMatcher.servers) {
		existingServer = vvMatcher.servers[server];
	}

	// handle new dead data
	if(info !== undefined) {
		if(info.length !== undefined && info.length > 0) {
			// console.log(info);
			if(existingServer.dead === undefined)
				existingServer.dead = [];

			for(const index in info) {
				existingServer.dead.push(info[index]);
				console.log("Adding one more dead, totalling " + existingServer.dead.length);
				console.log(info);
			}
		}
		else {
			console.error("info is not array in /client/match/group/server/parity/dead/post")
			console.log(info);
		}
	}
	else {

	}

	return JSON.stringify("OK");
	// return null;
}
});

ResponseController.RoutesToNotLog.push("/client/match/group/server/parity/dead/get");

ResponseController.Routes.push(
	{ url: "/client/match/group/server/parity/dead/get",
	action: 
  (url, info, sessionID) => { 
	// console.log(info);

	let groupId = info.groupId !== undefined ? info.groupId : undefined;
	if (groupId === undefined && info.length !== undefined && info.length > 0)
		groupId = info[0].groupId;

		let existingServer = {};
	for(let server in vvMatcher.servers) {
		existingServer = vvMatcher.servers[server];
	}

	let responseJson = {
		dead: existingServer.dead
	};
	return JSON.stringify(responseJson);
	// return null;
}
});

	responses.staticResponses["/client/match/group/server/players/spawn"] = 
	  (url, info, sessionID) => { 

		console.log(info);
		
		let existingServer = vvMatcher.getServerByGroupId(info.groupId);
		if(existingServer == null) {
			return JSON.stringify("ERROR");
		}

		if(existingServer.players === undefined) {
			existingServer.players = [];
		}

		existingServer.players.push(info);

		return JSON.stringify("OK");
	};

	ResponseController.Routes.push(
		{
			url: "/client/match/group/server/bots/spawn",
			action:
	  (url, info, sessionID) => { 

		let existingServer = vvMatcher.getServerByGroupId(info.groupId);
		if(existingServer == null) {
			return JSON.stringify("ERROR");
		}

		if(existingServer.bots === undefined) {
			existingServer.bots = [];
		}

		// console.log(info);
		// if(existingServer.bots.find(x=>x.accountId == info.accountId) === undefined) {
			existingServer.bots.push(info);
			logger.logInfo("Added one more bot " + info.accountId + " server " + info.groupId + " totalling " + existingServer.bots.length);
		// }

		return JSON.stringify("OK");
		}});


	responses.staticResponses["/client/match/group/server/players/get"] = 
	  (url, info, sessionID) => { 

		let existingServer = vvMatcher.getServerByGroupId(info.groupId);
		if(existingServer == null) {
			return JSON.stringify("ERROR");
		}

		if(existingServer.inGamePlayers === undefined)
			existingServer.inGamePlayers = {};

		let playerCount = 0;
		for(let index in existingServer.inGamePlayers) {
			playerCount++;
		}
		
		if(playerCount != info.count)
			return JSON.stringify(existingServer.inGamePlayers);
		else
			return JSON.stringify({});
	};

	responses.staticResponses["/client/match/group/server/stop"] = 
	  (url, info, sessionID) => { 

    	return response_f.nullResponse();
	};

	responses.staticResponses["/client/match/group/server/player/add"] = 
	  (url, info, sessionID) => { 
		console.log(JSON.stringify(info));
		// console.log(JSON.stringify(sessionID));
		if(info === undefined) {
			console.log("No data provided");
		}

		if(vvMatcher.servers[info.groupId] !== undefined) {
			let acc = account_f.getAllAccounts().find(x=>x._id == info.accountId);
			console.log(acc);
			if(acc !== undefined) {
				acc.ServerStatus = "LOADING";
				vvMatcher.servers[info.groupId].players[info.accountId] = info;
			}
		}

		return response_f.nullResponse();
	};

	responses.staticResponses["/client/match/group/server/bot/add"] = 
	  (url, info, sessionID) => { 
		if(info === undefined) {
			console.error("No data provided");
			return response_f.nullResponse();
		}
		if(info["groupId"] === undefined) 
		{
			console.error("groupId not provided");
				return response_f.nullResponse();
		}

		if(vvMatcher.servers === undefined) {
			console.error("server list is empty");
			return response_f.nullResponse();
		}

		if(vvMatcher.servers[info["groupId"]] === undefined) {
			console.error("unable to server " + info["groupId"]);
			return response_f.nullResponse();
		}

		if(vvMatcher.servers[info["groupId"]].bots === undefined) {
			vvMatcher.servers[info["groupId"]].bots = {};
		}

		vvMatcher.servers[info["groupId"]].bots[info["botId"]] = info;
		console.log(vvMatcher.servers[info["groupId"]].bots[info["botId"]]);

		return response_f.nullResponse();
	};

	responses.staticResponses["/client/match/group/server/player/join"] = 
	  (url, info, sessionID) => { 
		// console.log(JSON.stringify(info));
		// console.log(JSON.stringify(sessionID));
		if(info !== undefined) {
			console.log("No data provided");
		}

		if(vvMatcher.servers[sessionID] !== undefined) {
			
		}

		return response_f.nullResponse();
	};


	// responses.staticResponses["/client/match/group/server/bots/serverUpdate"] = 
	//   (url, info, sessionID) => { 
	// 	// console.log("/client/match/group/server/bots/serverUpdate");

	// 	// console.log(JSON.stringify(info));
	// 	// console.log(JSON.stringify(sessionID));
	// 	if(info !== undefined && info.length == 0) {
	// 		console.log("No data provided");
	// 	}

	// 	if(vvMatcher.servers[sessionID] !== undefined) {
	// 		vvMatcher.servers[sessionID].bots = info;
	// 	}

	// 	return response_f.nullResponse();
	// };

	// responses.staticResponses["/client/match/group/server/player/applyDamage"] = 
	//   (url, info, sessionID) => { 
	// 	if(info === undefined) {
	// 		console.error("No data provided");
	// 	}

	// 	vvMatcher.sendDataAboutOccurance(info["groupId"], info["isBot"], info);

	// 	return response_f.nullResponse();
	// };

	// responses.staticResponses["/client/match/group/server/player/executeShotSkill"] = 
	//   (url, info, sessionID) => { 
	// 	if(info === undefined) {
	// 		console.error("No data provided");
	// 	}

	// 	vvMatcher.sendDataAboutOccurance(info["groupId"], info["isBot"], info);


	// 	return response_f.nullResponse();
	// };

	// responses.staticResponses["/client/match/group/server/player/toggleProne"] = 
	//   (url, info, sessionID) => { 
	// 	if(info === undefined) {
	// 		console.error("No data provided");
	// 	}

	// 	vvMatcher.sendDataAboutOccurance(info["groupId"], info["isBot"], info);

	// 	return response_f.nullResponse();
	// };

	// responses.staticResponses["/client/match/group/server/player/move"] = 
	//   (url, info, sessionID) => { 
	// 	if(info === undefined) {
	// 		console.error("No data provided");
	// 	}

	// 	if(vvMatcher.servers[sessionID] !== undefined) {
	// 		if(vvMatcher.servers[sessionID].bots !== undefined) {
	// 			console.log(info);
	// 		}
	// 	}

	// 	return response_f.nullResponse();
	// };

	// responses.staticResponses["/client/match/group/server/player/dead"] = 
	//   (url, info, sessionID) => { 
	// 	if(info === undefined) {
	// 		console.error("No data provided");
	// 	}

	// 	vvMatcher.sendDataAboutOccurance(info["groupId"], info["isBot"], info);

	// 	return response_f.nullResponse();
	// };

	

	// responses.staticResponses["/client/match/group/server/player/heal"] = 
	//   (url, info, sessionID) => { 
	// 	if(info === undefined) {
	// 		console.error("No data provided");
	// 	}

	// 	if(vvMatcher.servers[sessionID] !== undefined) {
	// 		if(vvMatcher.servers[sessionID].bots !== undefined) {
	// 			console.log(info);
	// 		}
	// 	}

	// 	return response_f.nullResponse();
	// };

	// responses.staticResponses["/client/match/group/server/player/door"] = 
	//   (url, info, sessionID) => { 
	// 	if(info === undefined) {
	// 		console.error("No data provided");
	// 	}
	// 	let server = vvMatcher.getServerByGroupId(info["groupId"]);
	// 	if(server !== undefined) {
    	
	// 		if(server.doors === undefined) {
	// 			server.doors = {};
	// 		}

	// 		server.doors[info["doorId"]] = info;

	// 	}

	// 	return response_f.nullResponse();
	// };

	// responses.staticResponses["/client/match/group/server/door/clientReceive"] = 
	//   (url, info, sessionID) => { 
		
	// 	let server = vvMatcher.getServerByGroupId(info);
	// 	if(server !== undefined && server.doors !== undefined) {
    	
	// 		return JSON.stringify(server.doors);

	// 	}
	// 	else
	// 		return response_f.nullResponse();
	// };

	// responses.staticResponses["/client/match/group/server/player/clientReceive"] = 
	//   (url, info, sessionID) => { 
		
	// 	if(vvMatcher.servers[info] !== undefined) {
			
	// 		return JSON.stringify(vvMatcher.servers[info].players);

	// 	}
	// 	else
	// 		return response_f.nullResponse();
	// };


	// responses.staticResponses["/client/match/group/server/bots/clientReceive"] = 
	//   (url, info, sessionID) => { 
		
	// 	if(vvMatcher.servers[info] !== undefined) {
    	
	// 		return JSON.stringify(vvMatcher.servers[info].bots);

	// 	}
	// 	else
	// 		return response_f.nullResponse();
	// };

	// responses.staticResponses["/client/match/group/server/bots/download"] = 
	//   (url, info, sessionID) => { 
	// 	console.log("/client/match/group/server/bots/download");

		
	// 	var d = { d: "" + info + "" }
    // 	return JSON.stringify(vvMatcher.servers[d.d].bots);
	// };

	// responses.staticResponses["/client/match/group/server/bots/upload"] = 
	//   (url, info, sessionID) => { 
	// 	console.log("/client/match/group/server/bots/upload");

		
	// 	var d = { d: "" + info + "" }
    // 	return JSON.stringify(vvMatcher.servers[d.d].bots);
	// };

	// responses.staticResponses["/client/match/group/server/players/update"] = 
	//   (url, info, sessionID) => { 
		

	// 	return response_f.nullResponse();
	// };

	// responses.staticResponses["/client/match/group/server/players/download"] = 
	//   (url, info, sessionID) => { 
		
	// 	var d = { d: "" + info + "" }
    // 	return JSON.stringify(vvMatcher.servers[d.d].players);
	// };

	// responses.staticResponses["/client/match/group/server/killSomeone"] = 
	//   (url, info, sessionID) => { 
		

	// 	return response_f.nullResponse();
	// };

	responses.staticResponses["/client/game/logout"] = 
	(url, info, sessionID) => { 
		
		// console.log(info);
		// console.log(sessionID);
		if(vvMatcher.servers !== undefined 
			&& vvMatcher.servers[sessionID] !== undefined) {
			delete vvMatcher.servers[sessionID];
		}

		if(vvMatcher.groups !== undefined 
			&& vvMatcher.groups[sessionID] !== undefined) {
			delete vvMatcher.groups[sessionID];
		}

		let myInvites = vvMatcher.invites.filter(
			x => x.from === sessionID || x.to === sessionID );
		if(myInvites !== undefined && myInvites.length > 0) {
			console.log(myInvites);
		}

		return response_f.nullResponse();
	};

	responses.staticResponses["/client/match/group/exit_from_menu"] = 
	(url, info, sessionID) => { 
		
		console.log(info);
		console.log(sessionID);
		if(vvMatcher.servers[sessionID] !== undefined) {
			delete vvMatcher.servers[sessionID];
		}

		if(vvMatcher.groups[sessionID] !== undefined) {
			delete vvMatcher.groups[sessionID];
		}


		let myInvites = vvMatcher.invites.filter(
			x => x.from === sessionID || x.to === sessionID );
		if(myInvites !== undefined && myInvites.length > 0) {
			console.log(myInvites);
		}



		return response_f.nullResponse();
	};

	responses.staticResponses["/client/game/profile/list"] =
	(url, info, sessionID) => {
		// the best place to update health because its where profile is updating in client also!!!
		if (!AccountServer.isWiped(sessionID) && profile_f.handler.profileAlreadyCreated(sessionID)) {
		  health_f.handler.healOverTime(profile_f.handler.getPmcProfile(sessionID), info, sessionID);
		}

		// let allAccounts = AccountServer.getAllAccounts();

		// Fix SalesSum issue (needs to be pushed to JET)
		let allProfiles = profile_f.handler.getCompleteProfile(sessionID);
		for(let pr in allProfiles) {
			for(let traderIndex in allProfiles[pr].TradersInfo) {
				let trader = allProfiles[pr].TradersInfo[traderIndex];
				let cleanedTrader = {
					"SalesSum": trader.SalesSum,
					"Standing": trader.Standing,
					"unlocked": trader.unlocked,
					"salesSum": trader.salesSum !== undefined 
						&& trader.salesSum != NaN && trader.salesSum != null ? trader.salesSum : 0, 
					"standing": trader.standing !== undefined 
						&& trader.standing != NaN && trader.standing != null ? trader.standing : 0 
				};
				allProfiles[pr].TradersInfo[traderIndex] = cleanedTrader;
			}
		}
		// for(let ind in allAccounts) {
		// 	let acc = allAccounts[ind];
		// 	// console.log(acc);
		// 	let cp = profile_f.handler.getCompleteProfile(acc._id);
		// 	// console.log(cp);
		// 	for(let cpInd in cp) {
		// 		allProfiles.push(cp[cpInd]);
		// 	}
		// }

		// console.log("Number of Profiles Returned :: " + allProfiles.length);

		// allProfiles = allProfiles.filter(x=>x.aid == sessionID);
		// for(let pr in allProfiles) {
		// 	console.log(allProfiles[pr].aid);
		// }
		//console.log(allProfiles);

		return response_f.getBody(allProfiles);
	}

	responses.staticResponses["/client/match/group/status"] =
	(url, info, sessionID) => {
		let status = vvMatcher.getGroupStatus(info, sessionID);
		return response_f.getBody(status);
	}
	
	responses.staticResponses["/client/match/group/create"] =
	(url, info, sessionID) => {
		let status = vvMatcher.groupCreate(info, sessionID);
		return response_f.getBody(status);
	}

	responses.staticResponses["/client/game/profile/singularProfile"] =
	(url, info, sessionID) => {
        console.log("loading singular Profile for " + info);

        // console.log(sessionID);
		let acc = AccountServer.getAllAccounts().find(x => x._id == info);
		if(acc == undefined || acc == null) {
			console.log("Singular Profile doesn't exist for " + info);
			return JSON.stringify(null);
		}
		let profile = profile_f.handler.getPmcProfile(info);
		// return response_f.getBody(profile_f.handler.getCompleteProfile(sessionID));
		// return response_f.getBody(profile);
		return JSON.stringify(profile);
	}

    const wsServerIp = server.getIp();
    const wsServerPort = server.getPort() + 2;
    // const notifyServerAddress = `ws://${wsServerIp}:${wsServerPort}`;
    const notifyServerAddressUrl = `ws://${server.getIp()}:${server.getPort()}`;

	responses.staticResponses["/testANotifier"] = 
	(url, info, sessionID) => {

       console.log("test a notifier");
       console.log(info);
       console.log(sessionID);
	}


    responses.staticResponses["/client/notifier/channel/create"] =
	(url, info, sessionID) => {

        return response_f.getBody({
            notifier: {
              server: `${notifyServerAddressUrl}`,
              channel_id: "testChannel",
              url: `${notifyServerAddressUrl}`,
            },
            notifierServer: `${notifyServerAddressUrl}/${sessionID}`,
          });
	}

    // responses.staticResponses["/client/game/profile/select"] =
	// (url, info, sessionID) => {

    //     return response_f.getBody({
    //         "status": "ok",
    //         "notifier": NotifierService.getChannel(sessionID),
    //         "notifierServer": NotifierService.getServer(sessionID)
    //     });
	// }

	// responses.staticResponses["/client/friend/list"] =
	//  (url, info, sessionID) => {

	// 	var result = { Friends: [], Ignore: [], InIgnoreList: [] };


	// 	result.Friends = FriendshipController.getFriends(sessionID);

	// 	console.log(result);
	// 	// let allOtherAccounts = AccountServer.getAllAccounts()
	// 	// .filter(x=>x._id != sessionID);
	// 	// result.Friends = allOtherAccounts;


	// 	return response_f.getBody(result);
       
	// } 

	// responses.staticResponses["/client/friend/delete"] =
	//  (url, info, sessionID) => {

	// 	console.log(info);
	// 	console.log(sessionID);
	// 	FriendshipController.deleteFriend(sessionID, info);
       
	// 	return response_f.nullResponse();
	// } 
   
   

    /// ----------------------------------------------------
    // Stop arseholes getting into the server configs

	responses.staticResponses["/server/config/accounts"] =
	(url, info, sessionID) => {
		return "GO FUCK YOURSELF";
	}

	
	responses.staticResponses["/server/config/gameplay"] =
	(url, info, sessionID) => {
		return response_f.getBody("GO FUCK YOURSELF");
	}

	responses.staticResponses["/server/config/mods"] =
	(url, info, sessionID) => {
		return response_f.getBody("GO FUCK YOURSELF");
	}

	responses.staticResponses["/server/config/profiles"] =
	(url, info, sessionID) => {
		return response_f.getBody("GO FUCK YOURSELF");
	}

	responses.staticResponses["/server/config/server"] =
	(url, info, sessionID) => {
		return response_f.getBody("GO FUCK YOURSELF");
	}

	responses.staticResponses["/server/"] =
	(url, info, sessionID) => {
		return response_f.getBody("GO FUCK YOURSELF");
	}

	responses.staticResponses["/"] =
	(url, info, sessionID) => {
		return response_f.getBody("GO FUCK YOURSELF");
	}

	logger.logSuccess("[MOD] TarkovCoop; Responses Override Successful");
}
