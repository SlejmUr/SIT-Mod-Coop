const fs = require('fs');
const path = require('path');
const { AccountServer } = require('../../../../../src/classes/account');

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

		const thisServer = vvMatcher.getServerByGroupId(groupId);
		if(thisServer === undefined)
			return undefined;

		// add me
		thisServer.players[accountId] = {
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
				console.log(p);
				if(p.accountId == sessionID) {
					return this.servers[iServer];
				}
			}
		}
		return undefined;
	}


	// Group Players Screen
	// Note the change here to include SessionID, make sure to add that to the response
	getGroupStatus(info, sessionID) {

    //      console.log("getGroupStatus");
    //    console.log(info);

		// get all players, filter out self and anyone not here
		let availablePlayers = 
			AccountServer
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

		// Callback only requires "players" list
        return {"players": availablePlayers};
    }

	sendInvite = function(info, sessionID) {
		// console.log(sessionID);
		// console.log(JSON.stringify(info));
	
		if(vvMatcher.groups[sessionID] == undefined)
			return null;
	
		let fromAccount = AccountServer.getAllAccounts()
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

		let myAccounts = AccountServer.getAllAccounts()
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
		let myAccount = AccountServer.find(info);
		if(myAccount.matching === undefined) myAccount.matching = {};
		myAccount.matching.lookingForGroup = true;
		return response_f.nullResponse();
	}
	groupSearchStop(sessionID, info) {
		let myAccount = AccountServer.find(info);
		if(myAccount.matching === undefined) myAccount.matching = {};
		myAccount.matching.lookingForGroup = false;
		return response_f.nullResponse();
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
					AccountServer.getAllAccounts().find(x=>x._id == lastInvite.from);

					let toAccount = 
					AccountServer.getAllAccounts().find(x=>x._id == sessionID);

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
			AccountServer.getAllAccounts().find(x=>x._id == lastInvite.from);

			let toAccount = 
			AccountServer.getAllAccounts().find(x=>x._id == sessionID);

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
// console.log(profileFolders);

	// let ids = Object.keys(AccountServer.accounts);
	// for (let i in ids) {
	for (const id of profileFolders) {
		// let id = ids[i];
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
		obj.PlayerVisualRepresentation = {
			Info: obj.Info,
			Customization: character.Customization,
			// Equipment: character.Inventory.Equipment
			// Equipment: character.Inventory
		};
		// obj.PlayerVisualRepresentation = profile;
		fullyLoadedAccounts.push(obj);
	}

	// console.log(fullyLoadedAccounts);
	return fullyLoadedAccounts;
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
