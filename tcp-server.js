const path = require('path');
const net = require('net');
const fs = require('fs');
const port = 8124;
const child_process = require('child_process');
let seed = 0;

const separator = "|||||";
let workers = [];

const server = net.createServer((client) => {
    console.log('New client connected');

    client.on('data', handler);
    client.on('end', () => console.log(`Client ${client.id} disconnected`));

    async function handler(data, error) {
        if (!error) {
            switch (data.toString().split(separator)[0]) {
                case "getW" : {
                    let res = await getW();
                    client.write(`getW${separator}${JSON.stringify(res)}`);
                    break;
                }
                case "addW" : {
                    startWorker(data.toString().split(separator)[1]);
                    client.write(`addW${separator }${workers[workers.length - 1].pid}${separator}${workers[workers.length - 1].startedOn}`);
                    break;
                }
                case "removeW" : {
                    let index = workers.findIndex(worker => worker.pid == data.toString().split(separator)[1]);
                    let numbers = await getNumbers(workers[index]);
                    client.write(`removeW${separator}${workers[index].pid}${separator}${workers[index].startedOn}${separator}${numbers}`);
                    fs.appendFile(workers[index].filename,  "]");
                    process.kill(workers[index].pid);
                    workers.splice(index, 1);
                    break;
                }
            }
        }
        else console.error(error);
    }
});

server.listen(port, () => {
    console.log(`Server listening on localhost:${port}`);
});


function startWorker(interval) {
    let filename = `workers/${Date.now() + seed++}.json`;
    let worker = child_process.spawn('node', ['worker.js', filename, `${interval}`], {detached:true});
    let date = new Date;
    worker.startedOn = date.toISOString();
    worker.filename = filename;
    workers.push(worker);
}

function getNumbers(worker) {
    return new Promise((resolve, reject) => {
        fs.readFile(worker.filename, (error, data) => {
            if (!error) {
                resolve(data + "]");
            }
            else {
                reject(error);
            }
        })
    })
}

async function getW() {
    return new Promise(async (resolve) => {
        let res = [];
        for (i = 0; i < workers.length; i++) {
            let numbers = await getNumbers(workers[i]);
            res.push({
                "pid" : workers[i].pid,
                "startedOn" : workers[i].startedOn,
                "numbers" : numbers,
            });
        }
        resolve(res);
    })
}