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

let derivedBase = config.get<string>('derivedBase');
let u = util.inspect;
let db = new DBIO();

function getFile(url: string): { fileStream: fs.ReadStream, mimeType: string, fileName: string } | null
{
    let mimeType: string;
    let fileName: string = url.substr(1);
    console.log(`looking for ${fileName}`);
    fileName = path.join(derivedBase, fileName.substr(0,2), fileName.substr(2,2), url);    
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
            console.log(`incoming ${req.method} ${req.connection.remoteAddress} ${req.url}`);
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
        res.end(`got '${req.url}' from ${os.hostname}`);
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
            console.log(`going into formidable`);
            return (err, fields: formidable.Fields, files: formidable.Files) =>
            {
                let fileLink: FileLink =
                {             
                    owner: <string>fields.owner,
                    folder: <string>fields.folder,
                    experimentName: <string>fields.experimentName,
                    channelNumber: parseInt(<string>fields.channelNumber),
                    channelName: <string>fields.channelName,
                    seqNumber: parseInt(<string>fields.seqNumber),
                    filename: <string>fields.filename
                };
                console.log(`sending ${util.inspect(fields)}`);
                db.registerFile(fileLink);                
                res.writeHead(200, {'content-type': 'text/plain'});
                res.end();                
            };
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

// let f: FileLink = 
// {
//     runUUI: uuid.v4(),
//     root: 'd:/data/light-sheet',
//     target: 'blah/file.bz2',
//     size: 90210
// }

// db.registerFile(f);

let server = new PhoebeServer();
