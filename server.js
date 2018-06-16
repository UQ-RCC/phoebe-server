"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//import * as config from "./config.json";
const http = require("http");
//import * as jss from "json-stringify-safe";
const path = require("path");
const fs = require("fs");
const os = require("os");
const formidable = require("formidable");
const util = require("util");
const uuid = require("uuid");
const mkdirp = require("mkdirp");
let config = JSON.parse(fs.readFileSync("config.json", 'utf8'));
let meshBase = config.meshBase;
let u = util.inspect;
let server = http.createServer((req, res) => {
    if (!allowAccess(req)) {
        console.log(`rejected connection`);
        res.end();
    }
    else {
        console.log(`req method ${req.method}`);
        //console.log(u(req.headers));
        if (req.method === "POST") {
            console.log(`loading data...`);
            let form = new formidable.IncomingForm();
            form.maxFileSize = 1024 * 1024 * 500 * 2;
            form.on('fileBegin', (name, file) => {
                let fileName = uuid.v4();
                let filePath = path.join(config.imageBase, fileName.substr(0, 2), fileName.substr(2, 2));
                if (!fs.existsSync(filePath)) {
                    mkdirp.sync(filePath);
                    console.log(`created directory ${filePath}`);
                }
                file.path = path.join(filePath, fileName);
                console.log(util.inspect({ what: '_fileBegin_', name: name, filePath: filePath, file: file }));
            });
            form.parse(req, function (err, fields, files) {
                res.writeHead(200, { 'content-type': 'text/plain' });
                res.write('received upload:\n\n\n');
                //console.log(util.inspect({error: err, fields: fields, files: files}));
                res.end();
            });
            /*
            let dataBuffer: Buffer[] = [];
            req.on('data', (chunk: Buffer) => {
                dataBuffer.push(chunk)
            }).on('end', () => {
                let buf = Buffer.concat(dataBuffer);
                //console.log(`uploaded ${buf.length} bits of data md5: ${md5(buf)}`);
                fs.writeFileSync("d:\\data\\test.buf", buf);
                console.log(`wrote ${buf.length} bytes`);
            })
            res.writeHead(200, {"Content-Type": "application/x-binary"});
            res.end();
            */
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
server.listen(1337);
console.log("Phoebe server is listening");
console.log(`Host: ${os.hostname}\nMesh base: ${meshBase}\nImage base: ${config.imageBase}`);
function getFile(url) {
    let mimeType;
    let fileName = url.substr(1);
    console.log(`looking for ${fileName}`);
    fileName = path.join(meshBase, fileName.substr(0, 2), fileName.substr(2, 2), url);
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