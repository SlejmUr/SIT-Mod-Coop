const fs = require('fs');
const path = require('path');

class VVMatch {
	constructor() {
		this.groups = [];
		this.invites = [];
		this.matching = {};
		this.servers = {};
	}

	getServerByGroupId(groupId) {

		return vvMatcher.servers[groupId];
	}

	joinServerByGroupId(groupId, accountId) { 

		let thisServer = vvMatcher.getServerByGroupId(groupId);
		
		// add me
		thisServer.players[groupId] = {
			isHost: false,
			accountId: accountId,
			profileId: "pmc" + accountId,
			isPlayer: true,
			isBot: false
		};

		console.log(accountId + " has joined the Server");

    	return thisServer;
	}

	getServerIAmIn(sessionID) {
		for(let iServer in this.servers) {
			let s = this.servers[iServer];
			for(let iPlayer in s.players) {
				let p = s.players[iPlayer];
				if(p.accountId == sessionID) {
					return this.servers[iServer];
				}
			}
		}
		return undefined;
	}

	sendDataAboutOccurance(serverGroupId, isBot, data) {
		let server = vvMatcher.getServerByGroupId(serverGroupId);
		if(server !== undefined) {
			let personToAffect = isBot ? server.bots[data.accountId] : server.players[data.accountId];
			if(personToAffect !== undefined) {
				if(personToAffect.occurances === undefined) {
					personToAffect.occurances = [];
				}

				personToAffect.occurances.push(data);
			}
		}
	}

	// Group Players Screen
	// Note the change here to include SessionID, make sure to add that to the response
	getGroupStatus(info, sessionID) {

    //      console.log("getGroupStatus");
    //    console.log(info);

		// get all players, filter out self and anyone not here
		let availablePlayers = 
			account_f.handler
			.getAllAccounts()
			.filter(x=>x._id != sessionID);
			// Turn these off when testing Server functionality
			// .filter(x=> vvMatcher.matching[x._id] !== undefined)
			// .filter(x=> vvMatcher.matching[x._id].status !== undefined)
			// .filter(x=> vvMatcher.matching[x._id].status.location == info.location)
			// .filter(x=> vvMatcher.matching[x._id].status.savage == info.savage);

			// a quick fudge for testing
		for(let p in availablePlayers) {
			//console.log(availablePlayers[p])
			availablePlayers[p].lookingGroup = true;

		}

		vvMatcher.matching[sessionID] = {};
		vvMatcher.matching[sessionID].status = info;
		vvMatcher.matching[sessionID].status.dateUpdated = Date.now();

		// console.log("My PMC Profile");
		// console.log(profile_f.handler.getPmcProfile(sessionID));
		//  console.log("Available Players");
		//  console.log(availablePlayers);
		//  console.log(vvMatcher.matching[sessionID]);
			
		// Callback only requires "players" list
        return {"players": availablePlayers};
    }

	sendInvite = function(info, sessionID) {
		// console.log("HAAALLLLLO");
		console.log(sessionID);
		console.log(JSON.stringify(info));
	
		if(vvMatcher.groups[sessionID] == undefined)
			return null;
	
		let fromAccount = account_f.handler.getAllAccounts()
		.find(x=>x._id == sessionID);

		vvMatcher.invites.push(
			{
				_id: sessionID,
				// Id: sessionID,
				groupId: sessionID,
				dt: 0,
				from: sessionID,
				to: info.uid,
				profile: fromAccount, // This is the wrong one
			}
		);
	
		// vvMatcher.groups[sessionID].players.push(
		// 	{"_id": "pmc" + info.uid, "region": "EUR", "ip": server.getIp(), "savageId": "scav" + + info.uid, "accessKeyId": ""}  
		// )
	
		return response_f.getUnclearedBody({});
	}

	groupInviteAccept(info, sessionID) {
		console.log(sessionID);
		console.log(info);

		return response_f.getBody(
			{
				Error : null,
				Value : vvMatcher.getLastInvite(sessionID)
			}
			 );
	}

	groupInviteDecline(sessionID, info) {
		console.log(sessionID);
		console.log(info);
	}

	deleteGroup(info) {
		for (let groupID in vvMatcher.groups) {
		   if (groupID === info.groupId) {
			   delete vvMatcher.groups[groupID];
			   return;
		   }
	   }
	}

	groupCreate(info, sessionID) {
		console.log("groupCreate");
		console.log(info);
		console.log(sessionID);
		vvMatcher.groups[sessionID] = {
			_id: sessionID,
			owner: sessionID,
			status: "MATCHING",
			players: []
		}

		let myAccounts = account_f.handler.getAllAccounts()
		.filter(x=>x.aid = sessionID);
		for(let index in myAccounts) {
			let acc = myAccounts[index];
			vvMatcher.groups[sessionID].players.push(acc);
		}

		return vvMatcher.groups[sessionID];
	}

	groupLeaderStartedMatch(sessionID) {
		if(vvMatcher.groups[sessionID] !== undefined) {
			vvMatcher.groups[sessionID].groupStatus = "START";
		}
	}

	groupSearchStart(sessionID, info) {
		let myAccount = account_f.handler.find(sessionID);
		if(myAccount.matching === undefined) myAccount.matching = {};
		myAccount.matching.lookingForGroup = true;
	}
	groupSearchStop(sessionID, info) {
		let myAccount = account_f.handler.find(sessionID);
		if(myAccount.matching === undefined) myAccount.matching = {};
		myAccount.matching.lookingForGroup = false;
	}

	getLastInvite(sessionID) {
		let myInvites = vvMatcher.invites.filter(x=> x.to == sessionID);
		// console.log("getLastInvite");
		// console.log(myInvites);
		if(myInvites.length > 0) {
			let lastInviteIndex = myInvites.length-1;
			// console.log("getLastInvite::lastIndex::" + lastInviteIndex);
			if(lastInviteIndex != -1) {
				let lastInvite = myInvites[lastInviteIndex];
				if(lastInvite !== undefined) {
					let fromAccount	= 
					account_f.handler.getAllAccounts().find(x=>x._id == lastInvite.from);

					let toAccount = 
					account_f.handler.getAllAccounts().find(x=>x._id == sessionID);

					return lastInvite;
				}
			}
		}
		return undefined;
	}

	getInvites(sessionID) {
		// console.log(sessionID);
		// console.log("invites");
		// console.log(vvMatcher.invites);

		let lastInvite = vvMatcher.getLastInvite(sessionID);
		if(lastInvite !== undefined) {
			let fromAccount	= 
			account_f.handler.getAllAccounts().find(x=>x._id == lastInvite.from);

			let toAccount = 
			account_f.handler.getAllAccounts().find(x=>x._id == sessionID);

			return response_f.noBody(lastInvite);
		}
		return response_f.nullResponse();

	}

}

const vvMatcher = new VVMatch();

class VVBots {
	constructor() {

	}
}

class VVAccount {
	constructor() {

	}

	static s_GetAllAccounts() {

	}


getAllAccounts() {
  let fullyLoadedAccounts = [];

    const profileFolders = fs.readdirSync(`user/profiles/`);
console.log(profileFolders);

	let ids = Object.keys(account_f.handler.accounts);
	for (let i in ids) {
		let id = ids[i];
		if (!fileIO.exist(`user/profiles/${id}/character.json`)) continue;
		let character = fileIO.readParsed(`user/profiles/${id}/character.json`);
		
		let obj = {
			Info: {}
		};

		let profile = profile_f.handler.getPmcProfile(character.aid);

		obj.Id = character.aid;
		obj._id = character.aid;
		obj.Level = character.Info.Level;
		obj.lookingGroup = false;
		if(character.matching !== undefined) {
			obj.lookingGroup = character.matching.lookingForGroup;
		}
		obj.Info.Nickname = character.Info.Nickname;
		obj.Info.Side = character.Info.Side;
		obj.Info.Level = character.Info.Level;
		obj.Info.MemberCategory = character.Info.MemberCategory;
		obj.Info.Ignored = false;
		obj.Info.Banned = false;
		// obj.PlayerVisualRepresentation = {
		// 	Info: character.Info,
		// 	Customization: character.Customization,
		// 	// Equipment: character.Inventory.Equipment
		// 	// Equipment: character.Inventory
		// };
		obj.PlayerVisualRepresentation = profile;
		fullyLoadedAccounts.push(obj);
	}

	console.log(fullyLoadedAccounts);
	return fullyLoadedAccounts;
}

getFriends(sessionID) {
	// console.log("getFriends");
	let friendAccounts = [];

	let allAccounts = this.getAllAccounts();
	let myAccount = this.find(sessionID);
	if(myAccount === undefined)
	  return null;

   
	for (let i in myAccount.friends) {

		let id = myAccount.friends[i];
		let acc = allAccounts.find(x => x._id == id);

		// let id = myAccount.friends[i];
		// if (!fileIO.exist(`user/profiles/${id}/character.json`)) continue;
		// let character = fileIO.readParsed(`user/profiles/${id}/character.json`);
		
		// let obj = {
		// 	Info: {}
		// };
		// obj._id = character.aid;
		// obj.Level = character.Info.Level;
		// obj.lookingGroup = true;
		// obj.Info.Nickname = character.Info.Nickname;
		// obj.Info.Side = character.Info.Side;
		// obj.Info.Level = character.Info.Level;
		// obj.Info.MemberCategory = character.Info.MemberCategory;
		// obj.Info.Ignored = false;
		// obj.Info.Banned = false;
		// obj.PlayerVisualRepresentation = {
		// 	Info: character.Info,
		// 	Customization: character.Customization,
		// 	// Equipment: character.Inventory
		// }
		// ;
		// // console.log("getFriends:" + JSON.stringify(obj));

		friendAccounts.push(acc);
	}

	return friendAccounts;
}

getFriendRequestInbox(sessionID) {
  var acc = account_f.handler.find(sessionID);
  if(acc.friendRequestInbox === undefined) {
	acc.friendRequestInbox = [];
  } 

  return acc.friendRequestInbox.filter(x => x.Date != null);
}

getFriendRequestOutbox(sessionID) {
  var acc = account_f.handler.find(sessionID);
  if(acc.friendRequestOutbox === undefined) {
	acc.friendRequestOutbox = [];
  } 

  return acc.friendRequestOutbox;
}

addFriendRequest(sessionID, toID) {
	var acc = account_f.handler.find(sessionID);
	var toAcc = account_f.handler.find(toID);

	console.log("from");
	console.log(acc);
	console.log("to");
	console.log(toAcc);

	if(acc.friends === undefined) {
	  acc.friends = [];
	}

	if(acc.friendRequestOutbox === undefined) {
	  acc.friendRequestOutbox = [];
	}

	if(toAcc.friends === undefined) {
	  toAcc.friends = [];
	}

	if(toAcc.friendRequestInbox === undefined) {
	  toAcc.friendRequestInbox = [];
	}

	// let nFriendRequest = new friendRequest();
	// // accFull = getAllAccounts().find(x => x._id == sessionID);
	// // toAccFull = getAllAccounts().find(x => x._id == toID);

	// acc.friendRequestOutbox.push(nFriendRequest);
	// toAcc.friendRequestInbox.push(nFriendRequest);

	acc.friends.push(toID);
	toAcc.friends.push(acc);
	}

	addFriend(sessionID, info) {

	}

}


initMatchOverrides = function() {
	match_f.handler.sendInvite = vvMatcher.sendInvite;
	match_f.handler.getGroupStatus = vvMatcher.getGroupStatus;
	match_f.handler.deleteGroup = vvMatcher.deleteGroup;
	match_f.handler.groupSearchStart = vvMatcher.groupSearchStart;
	match_f.handler.groupSearchStop = vvMatcher.groupSearchStop;
	match_f.handler.groupLeaderStartedMatch = vvMatcher.groupLeaderStartedMatch;
	match_f.handler.getInvites = vvMatcher.getInvites;
	match_f.handler.groupInviteAccept = vvMatcher.groupInviteAccept;
	match_f.handler.groupInviteDecline = vvMatcher.groupInviteDecline;


	logger.logSuccess("[MOD] TarkovCoop; Match Override Successful");

};

module.exports = {
	VVAccount, VVBots, VVMatch, vvMatcher
};