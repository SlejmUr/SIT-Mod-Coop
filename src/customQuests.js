const fs = require('fs');

class customQuests
{
    static LoadCustomQuests() {

	    const modConfig = JSON.parse(fs.readFileSync('user/mods/VVCoop_1.0.0/mod.config.json'));

        if(modConfig.Quests.enable === true) {
            const numberOfQuestsBeforeMod = global._database.quests.length;
            let numberOfQuestsOverwritten = 0;
            let numberOfQuestsNew = 0;
            // logger.logInfo("[MOD] TarkovCoop; No. of Quests: " + numberOfQuestsBeforeMod);
    
            for(const folder of modConfig.Quests.enableByFolder) {
                logger.logInfo("[MOD] TarkovCoop; QUEST: Loading " + folder);
                const questData = JSON.parse(fs.readFileSync(`user/mods/VVCoop_1.0.0/src/db/quests/${folder}/quests.json`, 'utf8'));
                if(questData !== undefined) {
                    if(questData.length > 0) {
                        logger.logInfo("[MOD] TarkovCoop; QUEST: Data found " + folder);
                        for(const quest of questData) {
                            const existingQuestIndex = global._database.quests.findIndex(x=>x._id == quest._id);
                            if(existingQuestIndex !== -1) {
                                const existingQuest = global._database.quests[existingQuestIndex];
                                if(existingQuest) {
                                    numberOfQuestsOverwritten++;
                                }
                            }
                            else {
                                global._database.quests.push(quest);
                                numberOfQuestsNew++;
                            }
                        }
                    }
                }
            }
            
            if(numberOfQuestsNew > 0) {
                logger.logSuccess(`[MOD] TarkovCoop; ${numberOfQuestsNew} New Quests`);
            }
            if(numberOfQuestsOverwritten > 0) {
                logger.logSuccess(`[MOD] TarkovCoop; ${numberOfQuestsOverwritten} Overwritten Quests`);
            }
        }
    }
}

module.exports.customQuests = customQuests;