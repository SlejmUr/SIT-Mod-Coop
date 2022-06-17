const fs = require('fs');

class customItems
{
    static LoadItems(modConfig) {
	    const parentDir = __dirname + "\\";

        if(modConfig.Items.enable === true) {
            const numberOfItemsBeforeMod = global._database.items.length;
            let numberOfItemsOverwritten = 0;
            let numberOfItemsNew = 0;
            // logger.logInfo("[MOD] TarkovCoop; No. of Quests: " + numberOfQuestsBeforeMod);
    
            for(const folder of modConfig.Items.enableByFolder) {
                logger.logInfo("[MOD] TarkovCoop; ITEMS: Loading " + folder);
                if(fs.existsSync(`${parentDir}/db/items/${folder}/items.json`)) {
                    const itemsData = JSON.parse(fs.readFileSync(`${parentDir}/db/items/${folder}/items.json`, 'utf8'));
                    if(itemsData !== undefined) {
                        if(itemsData.length > 0) {
                            logger.logInfo("[MOD] TarkovCoop; ITEMS: Data found " + folder);
                            for(const item of itemsData) {
                                const existingIndex = global._database.items.findIndex(x=>x._id == quest._id);
                                if(existingIndex !== -1) {
                                    const existingQuest = global._database.items[existingIndex];
                                    if(existingQuest) {
                                        numberOfItemsOverwritten++;
                                    }
                                }
                                else {
                                    global._database.items.push(quest);
                                    numberOfItemsNew++;
                                }
                            }
                        }
                    }
                }
            }
            
            if(numberOfItemsNew > 0) {
                logger.logSuccess(`[MOD] TarkovCoop; ${numberOfQuestsNew} New Quests`);
            }
            if(numberOfItemsOverwritten > 0) {
                logger.logSuccess(`[MOD] TarkovCoop; ${numberOfQuestsOverwritten} Overwritten Quests`);
            }
        }
    }
}

module.exports.customItems = customItems;
