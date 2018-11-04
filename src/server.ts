process.env["NODE_CONFIG_DIR"] = __dirname + "/config/";

import * as http from "http";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import * as formidable from "formidable"
import * as util from "util"
import * as uuid from "uuid"
import * as mkdirp from "mkdirp"
import * as config from "config"


import {DBIO, FileLink} from "./database";
import { Duplex } from "stream";

let fileBase = config.get<string>('fileBase');
let u = util.inspect;
let db = new DBIO();

function getFile(url: string): { fileStream: fs.ReadStream, mimeType: string, fileName: string } | null
{
    let mimeType: string;
    let fileName: string = url.substr(1);
    console.log(`looking for ${fileName}`);
    fileName = path.join(fileBase, fileName.substr(0,2), fileName.substr(2,2), url);    
    mimeType = "application/x-binary";
    if (fs.existsSync(fileName))
    {
        const fileStream: fs.ReadStream = fs.createReadStream(fileName);
        console.log(`${new Date().toLocaleString()}: ${url} OK`);
        return {fileStream, mimeType, fileName};
    }
    else
    {
        console.log(`${new Date().toLocaleString()}: ${url} file not found`);
        return null;
    }
}

class PhoebeServer
{
    private readonly server: http.Server;

    constructor()
    {
        this.server = http.createServer((req, res) =>
        {            
            if (req.method === "GET")
            {
                this.get(req, res)
            }
            else if (req.method === "POST")
            {
                this.post(req, res);
            }
            else
            {
                this.other(req, res);
            }
        });
        let port = config.get<number>('port');
        this.server.listen(port);
        console.log(`Neo Phoebe server is listening on ${port}`);
    }

    private get(req: http.IncomingMessage, res: http.ServerResponse): void
    {
        //res.end(`got '${req.url}' from ${os.hostname}`);
        let form = new formidable.IncomingForm(); // hack
        form.maxFileSize = 1024 * 1024 * 500 * 2;
        form.parse(req, this.getParser(req, res));
    }

    private post(req: http.IncomingMessage, res: http.ServerResponse): void
    {
        let form = new formidable.IncomingForm();
        form.maxFileSize = 1024 * 1024 * 500 * 2;
        form.parse(req, this.getParser(req, res));
    }

    private other(req: http.IncomingMessage, res: http.ServerResponse): void
    {
        res.end(`sorry not handling this.`);
    }

    private getParser(req: http.IncomingMessage, res: http.ServerResponse): (err: any, fields: formidable.Fields, files: formidable.Files) => void
    {
        let url = req.url as string;
        if (url.startsWith('/register-file'))
        {
            return (err, fields: formidable.Fields, files: formidable.Files) =>
            {
                let fileLink = <string>fields.filePath;
                let detail = <string>fields.detail;         
                console.log(`register: ${fileLink}`);
                db.insertFileLink(fileLink, detail);                
                res.writeHead(200, {'content-type': 'text/plain'});
                res.end();
            };
        }        
        else if (url.startsWith('/next-job'))
        {            
            return (err, fields: formidable.Fields, files: formidable.Files) =>
            {
                db.nextJob()
                .then(json => {
                    console.log(`resolved: ${JSON.stringify(json)}`);
                    res.end(`${JSON.stringify(json)}`);
                })
                .catch(() =>{
                    res.end();
                });
            }
        }
        else
        {
            return (err, fields: formidable.Fields, files: formidable.Files) =>
            {                
                res.statusCode = 404;
                res.end();
            };
        }
    }

}

let server = new PhoebeServer();
