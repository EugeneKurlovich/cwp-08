const fs = require('fs');

let fp = process.argv[2];
let sec = process.argv[3];

setInterval(function () {
    fs.appendFile(fp, fs.existsSync(fp) ?
        "," + JSON.stringify(Math.round(Math.random() * 100), null, "\t") :
        "[" + JSON.stringify(Math.round(Math.random() * 100), null, "\t"),
        (err) => {
            if (err) {
                console.error(err);
            }
        });
}, sec);