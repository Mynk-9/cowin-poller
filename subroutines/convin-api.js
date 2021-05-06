const axios = require('axios');

const errorLogger = require('./error-log');
const api = 'https://cdn-api.co-vin.in/api';

// get date in the format DD-MM-YYYY
const nowDate = () => new Date().toISOString().split('T')[0].split('-').reverse().join('-');

module.exports = {
    // metadata apis
    metadata: {

        // get states list
        getStates: async () => {
            let data = null;
            await axios.get(`${api}/v2/admin/location/states`)
                .then(resp => data = resp.data.states)
                .catch(err => {
                    errorLogger.log(err);
                });
            return data;
        },

        // get districts of state
        getDistricts: async (stateId) => {
            let data = null;
            await axios.get(`${api}/v2/admin/location/districts/${stateId}`)
                .then(resp => data = resp.data.districts)
                .catch(err => {
                    errorLogger.log(err);
                });
            return data;
        },

    },

    // appointments api
    appointments: {

        // by pin-code
        checkByPin: async (pin) => {
            if (String(pin).length !== 6)
                return null;

            const date = nowDate();
            let data = null;
            await axios.get(`${api}/v2/appointment/sessions/public/findByPin?pincode=${pin}&date=${date}`)
                .then(resp => data = resp.data.districts)
                .catch(err => {
                    errorLogger.log(err);
                });
            return data;
        },

        // check by district code
        checkByDistrict: async (districtCode) => {
            const date = nowDate();
            let data = null;
            await axios.get(`${api}/v2/appointment/sessions/public/findByDistrict?district_id=${districtCode}&date=${date}`)
                .then(resp => data = resp.data.sessions)
                .catch(err => {
                    errorLogger.log(err);
                });
            return data;
        },

        // calendar of 7 days - sessions/centers by pin code
        checkCalendarByPin: async (pin) => {
            if (String(pin).length !== 6)
                return null;

            const date = nowDate();
            let data = null;
            await axios.get(`${api}/v2/appointment/sessions/public/calendarByPin?pincode=${pin}&date=${date}`)
                .then(resp => data = resp.data.centers)
                .catch(err => {
                    errorLogger.log(err);
                });
            return data;
        },

        // calendar of 7 days - sessions/centers by district code
        checkCalendarByDistrict: async (districtCode) => {
            const date = nowDate();
            let data = null;
            await axios.get(`${api}/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtCode}&date=${date}`)
                .then(resp => {
                    data = resp.data.centers;
                })
                .catch(err => {
                    if (err.status !== 200) {
                        console.info('Error fetching data from server. Probable causes could be poor internet connection or heavy traffic on the covin servers.');
                    } else {
                        errorLogger.log(err);
                    }
                    data = [];
                });
            return data;
        },

    },
};