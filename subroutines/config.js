'use strict';

const fs = require('fs');
const readlineSync = require('readline-sync');

const covinAPI = require('./convin-api');
const errorLogger = require('./error-log');
const configFile = './config.json';

module.exports = {
    // checks existence of config file
    checkConfigExists: () => fs.existsSync(configFile),

    // read config
    readConfig: () => {
        let data = fs.readFileSync(configFile);
        let config = JSON.parse(data);
        return config;
    },

    // save config
    saveConfig: (config) => {
        let error = null;
        fs.writeFile(configFile, config, err => error = err);
        return error;
    },

    // asks the user for config inputs
    inputConfig: async () => {
        let config = {
            'stateId': null,
            'districts': new Set(),
            'pincodes': new Set(),
            'pollingInterval': []
        };
        console.info('No configuration was found.');

        // select state ///////////////////////////////////
        {
            console.log('Please select your state:');
            let states = await covinAPI.metadata.getStates();
            let statesTable = {};
            states.forEach(
                stateData => statesTable[stateData.state_id] = stateData.state_name
            );
            statesTable[-1] = 'CANCEL';
            console.table(statesTable);
            let stateId = 0;
            while (true) {
                stateId = readlineSync.questionInt('Enter the state code: ');
                if (stateId === -1)
                    return false;
                else if (stateId > states.length || stateId < 1)
                    console.log('Please enter correct value.');
                else
                    break;
            }
            config.stateId = stateId;
        }

        // select district or pincode? ///////////////////
        {
            let districts = await covinAPI.metadata.getDistricts(config.stateId);
            let districtsTable = {};
            districts.forEach(
                districtData => districtsTable[districtData.district_id]
                    = districtData.district_name
            );
            const inputDistrict = async () => {
                console.table(districtsTable);
                let districtId = readlineSync.questionInt('Enter the district code: ');
                config.districts.add(districtId);
            };
            const inputPincode = async () => {
                let pincode = 0;
                while (true) {
                    pincode = readlineSync.questionInt('Enter the pincode: ');
                    if (String(pincode).length === 6) break;
                    console.log('Please enter valid pincode.');
                }
                config.pincodes.add(pincode);
            };
            console.log('Search by district or pincode?');
            while (true) {
                let dpOption = readlineSync.keyInSelect(['District', 'Pincode'], 'Select: ');
                switch (dpOption) {
                    case 0:
                        await inputDistrict();
                        break;
                    case 1:
                        await inputPincode();
                        break;
                    default:
                        break;
                }

                if (!readlineSync.keyInYN('Select more district(s)/pincode(s)? '))
                    break;
            }
            if (config.districts.size === 0 && config.pincodes.size === 0)
                return false;
        }

        // set polling interval ///////////////////////////
        {
            console.log('Polling Interval: regular time intervals after which cowin portal is checked for updates.');
            let metrics = [0, 0, 0];
            while (true) {
                let inp = readlineSync.question('Please enter polling interval (HH:MM:SS) (default=00:30:00): ');
                if (!inp) inp = '00:30:00';

                let _metrics = inp.split(':');
                for (let i = 0; i < 3; ++i) metrics[i] = parseInt(_metrics[i]);
                if (
                    (metrics[0] > 0 && metrics[0] < 24)
                    && (metrics[1] > 0 && metrics[1] < 60)
                    && (metrics[2] > 0 && metrics[2] < 60)
                    && (metrics[0] || metrics[1] || metrics[2]) // at least one non-zero
                )
                    break;
                console.log('Please enter valid time.');
            }
            config.pollingInterval = metrics;
        }

        // done
        return config;
    },
};