"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const formidable = require("formidable");
const util = require("util");
const uuid = require("uuid");
const mkdirp = require("mkdirp");
const config = require("config");
const database_1 = require("./database");
let derivedBase = config.get('derivedBase');
let u = util.inspect;
let db = new database_1.DBIO();
let server2 = http.createServer((req, res) => {
    console.log(`${os.hostname} : ${req.method}: ${req.connection.remoteAddress} : ${req.url}`);
    if (req.method === "POST") {
        let form = new formidable.IncomingForm();
        form.maxFileSize = 1024 * 1024 * 500 * 2;
        let fileName = uuid.v4();
        form.on('fileBegin', (name, file) => {
            let filePath = path.join(config.get("imageBase"), fileName.substr(0, 2), fileName.substr(2, 2));
            if (!fs.existsSync(filePath)) {
                mkdirp.sync(filePath);
            }
            file.path = path.join(filePath, fileName);
            console.log(`${os.hostname} : wrote: ${file.path}`);
        });
        form.parse(req, (err, fields, files) => {
            let frame = {
                experimentName: fields.experimentName,
                directory: fields.directory,
                channelNumber: parseInt(fields.channelNumber),
                channelName: fields.channelName,
                timepoint: parseInt(fields.sequenceNumber),
                width: parseInt(fields.width),
                height: parseInt(fields.height),
                depth: parseInt(fields.depth),
                xSize: parseFloat(fields.xScale),
                ySize: parseFloat(fields.yScale),
                zSize: parseFloat(fields.zScale),
                filename: fileName,
                msec: parseInt(fields.msec)
            };
            let filename = files['byte-buffer'].path;
            db.insertFrame(frame)
                .then(value => {
                let uploadState = 'uploaded';
                if (value === 'duplicate image') {
                    uploadState = 'skipped (duplicate)';
                    deleteFile(filename);
                }
                console.log(`${os.hostname} : ${uploadState} image: ${frame.experimentName} channel: ${frame.channelNumber} frame: ${frame.timepoint} file: ${filename}`);
            })
                .catch(err => {
                console.log(`${os.hostname} : database error inserting image: ${frame.experimentName} channel: ${frame.channelNumber} frame: ${frame.timepoint} file: ${filename}`);
                deleteFile(filename);
            });
            res.end(`POST from ${os.hostname}\n${util.inspect(fields)}`);
        });
    }
    else {
        let form = new formidable.IncomingForm();
        if (form) {
            form.parse(req, (err, fields, files) => {
                res.end(`**GET from ${os.hostname}\n${util.inspect(fields)}`);
            });
        }
        else {
            res.end(`**GET from ${os.hostname}\nNo form`);
        }
    }
});
let server = http.createServer((req, res) => {
    if (!allowAccess(req)) {
        console.log(`rejected connection`);
        res.end();
    }
    else {
        if (req.method === "POST") {
            let form = new formidable.IncomingForm();
            form.maxFileSize = 1024 * 1024 * 500 * 2;
            let fileName = uuid.v4();
            form.on('fileBegin', (name, file) => {
                let filePath = path.join(config.get("imageBase"), fileName.substr(0, 2), fileName.substr(2, 2));
                if (!fs.existsSync(filePath)) {
                    mkdirp.sync(filePath);
                }
                file.path = path.join(filePath, fileName);
            });
            form.parse(req, (err, fields, files) => {
                res.writeHead(200, { 'content-type': 'text/plain' });
                res.write('received upload:\n\n\n');
                let frame = {
                    experimentName: fields.experimentName,
                    directory: fields.directory,
                    channelNumber: parseInt(fields.channelNumber),
                    channelName: fields.channelName,
                    timepoint: parseInt(fields.timepoint),
                    width: parseInt(fields.width),
                    height: parseInt(fields.height),
                    depth: parseInt(fields.depth),
                    xSize: parseFloat(fields.xScale),
                    ySize: parseFloat(fields.yScale),
                    zSize: parseFloat(fields.zScale),
                    filename: fileName,
                    msec: parseInt(fields.msec)
                };
                let filename = files['byte-buffer'].path;
                db.insertFrame(frame)
                    .then(value => {
                    let uploadState = 'uploaded';
                    if (value === 'duplicate image') {
                        uploadState = 'skipped (duplicate)';
                        deleteFile(filename);
                    }
                    console.log(`${uploadState} image: ${frame.experimentName} channel: ${frame.channelNumber} frame: ${frame.timepoint} file: ${filename}`);
                })
                    .catch(err => {
                    console.log(`database error inserting image: ${frame.experimentName} channel: ${frame.channelNumber} frame: ${frame.timepoint} file: ${filename}`);
                    deleteFile(filename);
                });
                res.end();
            });
        }
        else {
            const fileInfo = getFile(req.url);
            if (fileInfo) {
                res.writeHead(200, { "Content-Type": fileInfo.mimeType });
                fileInfo.fileStream.pipe(res);
            }
            else {
                res.writeHead(404, { "Content-Type": "application/x-binary" });
                res.end();
            }
        }
    }
});
function deleteFile(filename) {
    fs.unlink(filename, (err) => {
        if (err) {
            console.log(`error deleting duplicate image file ${filename}`);
        }
    });
}
let port = config.get('port');
server2.listen(port);
console.log(`Phoebe server is listening on ${port}`);
console.log(`Host: ${os.hostname}\nPrime base: ${config.get("primeBase")}\nDerived base: ${derivedBase}`);
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
function allowAccess(req) {
    let remoteAddress = req.connection.remoteAddress;
    let realIP = req.headers['x-forwarded-for'];
    //console.log(`headers: ${jss(req,null,3)}`);
    if (remoteAddress.includes('127.0.0.1')) {
        return true;
    }
    let allowedIP = new Set([
        '127.0.0.1',
        '192.168.77.111',
        '192.168.10.4',
        '192.168.77.143'
    ]);
    if (allowedIP.has(remoteAddress)) {
        return true;
    }
    return true;
}
function allowAllAccess() {
    return true;
}
//# sourceMappingURL=server.js.map