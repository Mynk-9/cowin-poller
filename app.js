'use strict';

const readlineSync = require('readline-sync');
const sound = require("sound-play");
const path = require('path');

const covinSubroutines = require('./subroutines/convin-api');
const configSubroutines = require('./subroutines/config');

///////////////// welcome message
console.info('Welcome to Covin Poller');

const poller = async (config) => {

    const getAvailableSessions = (centerList, age) => {
        let availableSessions = {};
        centerList.forEach(center => {
            center.sessions.forEach(session => {
                if (session.available_capacity > 0 && age > session.min_age_limit) {
                    availableSessions[center.center_id] = [
                        center.name,
                        center.address,
                        center.state_name,
                        center.district_name,
                        center.block_name,
                        session.vaccine,
                        session.min_age_limit,
                        center.fee_type === 'Free' ? 'Free' : (
                            (center.vaccine_fees.map(vaccineFees => {
                                return vaccineFees.vaccine + ': Rs.' + vaccineFees.fee;
                            })).join(', ')
                        ),
                    ];
                }
            });
        });
        return availableSessions;
    };

    let timeInMS = ((config.pollingInterval[0] * 60 * 60) + (config.pollingInterval[1] * 60) + config.pollingInterval[2]) * 1000;
    while (true) {
        let allCenters = [];
        for (let i = 0; i < config.districts.length; ++i)
            allCenters = [...allCenters, ...(await covinSubroutines.appointments.checkCalendarByDistrict(config.districts[i]))];
        let availableSessions = getAvailableSessions(allCenters, config.age);
        if (Object.keys(availableSessions).length === 0) {
            console.log('No updates.');
        } else {
            // for (let i = 0; i < 10; ++i)
            // console.log('\u0007'); // bell sound
            sound.play(path.join(__dirname, 'alert_sound.mp3'), 1);


            console.clear();
            // process.stdout.write('\033c');
            // process.stdout.write("\u001b[2J\u001b[0;0H");
            console.log('Current updates:');
            console.table(availableSessions);
            console.log('To exit, press Ctrl+C');
        }

        // wait for next 
        await new Promise(r => setTimeout(r, timeInMS));
    }
};

const printConfig = (config) => {
    console.log('State ID:', config.stateId);
    console.log('Districts:', config.districts);
    console.log('Pincodes:', config.pincodes);
    console.log(
        'Polling Interval:',
        `${config.pollingInterval[0]}h ${config.pollingInterval[1]}m ${config.pollingInterval[2]}s`
    );
};

const takeConfInput = async () => {
    let config = {};
    while (true) {
        config = await configSubroutines.inputConfig();
        if (config) {
            console.log('The following are your preferences:');
            printConfig(config);
            if (readlineSync.keyInYNStrict('Save and continue?')) {
                let res = configSubroutines.saveConfig(JSON.stringify(config));
                // if (!res) { console.log('Encountered error'); return; }
                return config;
            }
            else return null;
        }
        else {
            if (readlineSync.keyInYNStrict('There was an error in preferences input, do you wish to retry?') === false)
                return null;
        }
    }
};

// async func wrap
const main = async () => {

    let config = {
        'stateId': null,
        'districts': [],
        'pincodes': [],
        'age': 0,
        'pollingInterval': []
    };
    if (configSubroutines.checkConfigExists()) {
        config = configSubroutines.readConfig();
        console.log('The following are your preferences:');
        printConfig(config);
        if (!readlineSync.keyInYNStrict('Do you wish to continue with these preferences?'))
            if (readlineSync.keyInYNStrict('Do you wish to exit?'))
                return;
            else {
                config = await takeConfInput();
                if (!config) return;
            }
    } else {
        config = await takeConfInput();
        if (!config) return;
    }

    poller(config);
};


main();