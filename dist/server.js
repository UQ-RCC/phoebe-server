"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env["NODE_CONFIG_DIR"] = __dirname + "/config/";
const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const formidable = require("formidable");
const util = require("util");
const config = require("config");
const database_1 = require("./database");
let fileBase = config.get('fileBase');
let u = util.inspect;
let db = new database_1.DBIO();
function getFile(url) {
    let mimeType;
    let fileName = url.substr(1);
    console.log(`looking for ${fileName}`);
    fileName = path.join(fileBase, fileName.substr(0, 2), fileName.substr(2, 2), url);
    mimeType = "application/x-binary";
    if (fs.existsSync(fileName)) {
        const fileStream = fs.createReadStream(fileName);
        console.log(`${new Date().toLocaleString()}: ${url} OK`);
        return { fileStream, mimeType, fileName };
    }
    else {
        console.log(`${new Date().toLocaleString()}: ${url} file not found`);
        return null;
    }
}
class PhoebeServer {
    constructor() {
        this.server = http.createServer((req, res) => {
            if (req.method === "GET") {
                this.get(req, res);
            }
            else if (req.method === "POST") {
                this.post(req, res);
            }
            else {
                this.other(req, res);
            }
        });
        let port = config.get('port');
        this.server.listen(port);
        console.log(`Neo Phoebe server is listening on ${port}`);
        this.server.on('connect', (req, cltSocket, head) => {
            console.log(`connection from ${cltSocket.remotePort}`);
        });
    }
    get(req, res) {
        //res.end(`got '${req.url}' from ${os.hostname}`);
        let form = new formidable.IncomingForm(); // hack
        form.maxFileSize = 1024 * 1024 * 500 * 2;
        form.parse(req, this.getParser(req, res));
    }
    post(req, res) {
        let form = new formidable.IncomingForm();
        form.maxFileSize = 1024 * 1024 * 500 * 2;
        form.parse(req, this.getParser(req, res));
    }
    other(req, res) {
        res.end(`sorry not handling this.`);
    }
    getParser(req, res) {
        let url = req.url;
        if (url.startsWith('/register-file')) {
            return (err, fields, files) => {
                let fileLink = fields.filePath;
                let detail = fields.detail;
                console.log(`register: ${fileLink}`);
                db.insertFileLink(fileLink, detail);
                res.writeHead(200, { 'content-type': 'text/plain' });
                res.end();
            };
        }
        else if (url.startsWith('/register-test')) {
            return (err, fields, files) => {
                let filename = fields.filePath;
                let detail = fields.detail;
                console.log(`register-test: ${os.hostname} ${Date.now()} ${req.headers.host} ${filename}`);
                res.writeHead(200, { 'content-type': 'text/plain' });
                res.end();
            };
        }
        else if (url.startsWith('/next-job')) {
            return (err, fields, files) => {
                db.nextJob()
                    .then(json => {
                    console.log(`resolved: ${JSON.stringify(json)}`);
                    res.end(`${JSON.stringify(json)}`);
                })
                    .catch(() => {
                    res.end();
                });
            };
        }
        else {
            return (err, fields, files) => {
                res.statusCode = 404;
                res.end();
            };
        }
    }
}
let server = new PhoebeServer();
//# sourceMappingURL=server.js.map