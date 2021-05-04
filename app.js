'use strict';

const fs = require('fs');
const axios = require('axios');
const readlineSync = require('readline-sync');

const configSubroutines = require('./subroutines/config');

///////////////// welcome message
console.info('Welcome to Covin Poller');

// async func wrap
const main = async () => {

    // if (!configSubroutines.checkConfigExists())
    //     await configSubroutines.inputConfig()
    let config = {
        'stateId': null,
        'districts': [],
        'pincodes': [],
        'pollingInterval': []
    };
    if (configSubroutines.checkConfigExists())
        config = configSubroutines.readConfig();
    else {
        while (true) {
            config = await configSubroutines.inputConfig();
            if (config) {
                console.log('The following are your preferences:');
                console.log('State ID:', config.stateId);
                console.log('Districts:', config.districts);
                console.log('Pincodes:', config.pincodes);
                console.log(
                    'Polling Interval:',
                    `${config.pollingInterval[0]}h ${config.pollingInterval[1]}m ${config.pollingInterval[2]}s`
                );
                if (readlineSync.keyInYNStrict('Save and continue?'))
                    break;
                else return;
            }
            else {
                if (readlineSync.keyInYNStrict('There was an error in preferences input, do you wish to retry?'))
                    config = await configSubroutines.inputConfig();
                else return;
            }
        }
        let res = configSubroutines.saveConfig(JSON.stringify(config));
        if (res) { console.log('Encountered error'); return; }
    }

};


main();