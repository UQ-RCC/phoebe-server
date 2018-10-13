"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const formidable = require("formidable");
const util = require("util");
const config = require("config");
const database_1 = require("./database");
let derivedBase = config.get('derivedBase');
let u = util.inspect;
let db = new database_1.DBIO();
function getFile(url) {
    let mimeType;
    let fileName = url.substr(1);
    console.log(`looking for ${fileName}`);
    fileName = path.join(derivedBase, fileName.substr(0, 2), fileName.substr(2, 2), url);
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
            console.log(`incoming ${req.method} ${req.connection.remoteAddress} ${req.url}`);
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
    }
    get(req, res) {
        res.end(`got '${req.url}' from ${os.hostname}`);
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
            console.log(`going into formidable`);
            return (err, fields, files) => {
                let fileLink = {
                    owner: fields.owner,
                    folder: fields.folder,
                    experimentName: fields.experimentName,
                    channelNumber: parseInt(fields.channelNumber),
                    channelName: fields.channelName,
                    seqNumber: parseInt(fields.seqNumber),
                    filename: fields.filename
                };
                console.log(`sending ${util.inspect(fields)}`);
                db.registerFile(fileLink);
                res.writeHead(200, { 'content-type': 'text/plain' });
                res.end();
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
// let f: FileLink = 
// {
//     runUUI: uuid.v4(),
//     root: 'd:/data/light-sheet',
//     target: 'blah/file.bz2',
//     size: 90210
// }
// db.registerFile(f);
let server = new PhoebeServer();
//# sourceMappingURL=server.js.map