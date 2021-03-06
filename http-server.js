const http = require('http');
const net = require('net');
const hostname = '127.0.0.1';
const port = 3000;
const tcp_port = 8124;
const separator = "|||||";
const connection = new net.Socket();

function getW (req, res, payload, cb) {
    connection.write("getW");
    connection.on('data', (data, error) => {
        if (!error) {
            if (data.toString().split(separator)[0] === "getW") {
                cb(null, JSON.parse(data.toString().split(separator)[1]));

            }
        }
        else console.error(error);
    });
}

function addW (req, res, payload, cb) {
    if (payload.x !== undefined) {
        connection.write(`addW${separator}${payload.x}`);
        connection.on('data', (data, error) => {
            if (!error) {
                if (data.toString().split(separator)[0] === "addW") {

                    cb(null, {
                        pid: data.toString().split(separator)[1],
                        startedOn: data.toString().split(separator)[2],
                    });
                }
            }
            else console.error(error);
        });
    }
    else cb({code: 405, message: 'Worker not found'});
}

function removeW (req, res, payload, cb) {
    if (payload.id !== undefined) {
        connection.write(`removeW${separator}${payload.id}`);
        connection.on('data', (data, error) => {
            if (!error) {
                if (data.toString().split(separator)[0] === "removeW") {
                    cb(null, {
                        pid: data.toString().split(separator)[1],
                        startedOn: data.toString().split(separator)[2],
                        numbers: data.toString().split(separator)[3],
                    });
                }
            }
            else console.error(error);
        });
    }
    else cb({code: 405, message: 'Worker not found'});
}

connection.connect(tcp_port, function () {
    console.log('Connected to the TCP server');
});

const handlers = {
    '/workers': getW,
    '/workers/add': addW,
    '/workers/remove': removeW
};

const server = http.createServer((req, res) => {
    parseBodyJson(req, (err, payload) => {
        const handler = getHandler(req.url);
        handler(req, res, payload, (err, result) => {
            if (err) {
                res.writeHead(err.code, {'Content-Type' : 'application/json'});
                res.end( JSON.stringify(err) );
                return;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(result, null, "\t"));
        });
    });
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

function getHandler(url) {
    return handlers[url] || notFound;
}

function notFound(req, res, payload, cb) {
    cb({code: 404, message: 'Not found'});
}

function parseBodyJson(req, cb) {
    let body = [];
    req.on('data', function (chunk) {
        body.push(chunk);
    }).on('end', function () {
        body = Buffer.concat(body).toString();
        if (body !== "") {
            params = JSON.parse(body);
            cb(null, params);
        }
        else 
        {
            cb(null, null);
        }
    });
}
