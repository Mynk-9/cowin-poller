const fs = require('fs');

const errorFile = './errorLog.txt';

module.exports = {
    // logs errors
    log: (error) => {
        let data = `\n${new Date()}: ${error}\n--------`;
        fs.appendFile(errorFile, data, err => {
            if (err)
                console.log(err);
            throw err;
        });
    },
};