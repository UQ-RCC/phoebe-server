import * as http from "http";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import * as formidable from "formidable"
import * as util from "util"
import * as uuid from "uuid"
import * as mkdirp from "mkdirp"
import * as config from "config"

import {DBIO, ImageFrame} from "./database";

let meshBase = config.get<string>('meshBase');
let u = util.inspect;
let db = new DBIO();

let server2 = http.createServer((req, res) =>
{
    console.log(`${req.method}: ${req.url}`);
    if (req.method === "POST")
    {
        let form = new formidable.IncomingForm();
        form.maxFileSize = 1024 * 1024 * 500 * 2;
        let fileName = uuid.v4();
        
        form.on('fileBegin', (name, file: formidable.File) =>
        {
            let filePath = path.join(config.get("imageBase"), fileName.substr(0,2), fileName.substr(2,2));
            if(!fs.existsSync(filePath))
            {
                mkdirp.sync(filePath);                    
            }
            file.path = path.join(filePath, fileName);
            console.log(`wrote: ${file.path}`);
        })

        form.parse(req, (err, fields: formidable.Fields, files: formidable.Files) =>
        {            
            let frame: ImageFrame =                
            {
                experimentName: <string>fields.experimentName,
                directory: <string>fields.directory,
                channelNumber: parseInt(<string>fields.channelNumber),
                channelName: <string>fields.channelName,
                timepoint: parseInt(<string>fields.sequenceNumber),
                width: parseInt(<string>fields.width),
                height: parseInt(<string>fields.height),
                depth: parseInt(<string>fields.depth),
                xSize: parseFloat(<string>fields.xScale),
                ySize: parseFloat(<string>fields.yScale),
                zSize: parseFloat(<string>fields.zScale),
                filename: fileName,
                msec: parseInt(<string>fields.msec)
            };

            let filename: string = files['byte-buffer'].path;
            db.insertFrame(frame)
                .then(value => {
                    let uploadState: string = 'uploaded';
                    if (value === 'duplicate image')
                    {
                        uploadState = 'skipped (duplicate)'            
                        deleteFile(filename);
                    }
                    console.log(`${uploadState} image: ${frame.experimentName} channel: ${frame.channelNumber} frame: ${frame.timepoint} file: ${filename}`);
                })
                .catch(err => {                        
                    console.log(`database error inserting image: ${frame.experimentName} channel: ${frame.channelNumber} frame: ${frame.timepoint} file: ${filename}`);
                    deleteFile(filename);
                });
            res.end();
        })
    }
    else
    {
        res.end();
    }
    
});

let server = http.createServer((req, res) =>
{
    if (!allowAccess(req))
    {
        console.log(`rejected connection`);
        res.end();
    }
    else
    {   
        if (req.method === "POST")
        {
            let form = new formidable.IncomingForm();
            form.maxFileSize = 1024 * 1024 * 500 * 2;
            let fileName = uuid.v4();
            
            form.on('fileBegin', (name, file: formidable.File) => {
                let filePath = path.join(config.get("imageBase"), fileName.substr(0,2), fileName.substr(2,2));
                if(!fs.existsSync(filePath))
                {
                    mkdirp.sync(filePath);                    
                }
                file.path = path.join(filePath, fileName);                
            })

            form.parse(req, (err, fields: formidable.Fields, files: formidable.Files) => {
                res.writeHead(200, {'content-type': 'text/plain'});
                res.write('received upload:\n\n\n');                
                let frame: ImageFrame =                
                {
                    experimentName: <string>fields.experimentName,
                    directory: <string>fields.directory,
                    channelNumber: parseInt(<string>fields.channelNumber),
                    channelName: <string>fields.channelName,
                    timepoint: parseInt(<string>fields.timepoint),
                    width: parseInt(<string>fields.width),
                    height: parseInt(<string>fields.height),
                    depth: parseInt(<string>fields.depth),
                    xSize: parseFloat(<string>fields.xScale),
                    ySize: parseFloat(<string>fields.yScale),
                    zSize: parseFloat(<string>fields.zScale),
                    filename: fileName,
                    msec: parseInt(<string>fields.msec)
                };
                let filename: string = files['byte-buffer'].path;
                db.insertFrame(frame)
                    .then(value => {
                        let uploadState: string = 'uploaded';
                        if (value === 'duplicate image')
                        {
                            uploadState = 'skipped (duplicate)'                            
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
        else
        {
            const fileInfo = getFile(req.url as string);
            if (fileInfo)
            {
                res.writeHead(200, {"Content-Type": fileInfo.mimeType});            
                fileInfo.fileStream.pipe(res);
            }
            else
            {
                res.writeHead(404, {"Content-Type": "application/x-binary"});
                res.end();
            }
        }        
    }
});

function deleteFile(filename: string): void
{
    fs.unlink(filename, (err) => {
        if (err)
        {
            console.log(`error deleting duplicate image file ${filename}`);
        }
    });
}

let port = config.get<number>('port');
server2.listen(port);
console.log(`Phoebe server is listening on ${port}`);
console.log(`Host: ${os.hostname}\nMesh base: ${meshBase}\nImage base: ${config.get("imageBase")}`);

function getFile(url: string): { fileStream: fs.ReadStream, mimeType: string, fileName: string } | null
{
    let mimeType: string;
    let fileName: string = url.substr(1);
    console.log(`looking for ${fileName}`);
    fileName = path.join(meshBase, fileName.substr(0,2), fileName.substr(2,2), url);    
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

function allowAccess(req: http.IncomingMessage): boolean
{

    let remoteAddress: string = req.connection.remoteAddress as string;
    let realIP = req.headers['x-forwarded-for'];
    
    
    //console.log(`headers: ${jss(req,null,3)}`);

    if (remoteAddress.includes('127.0.0.1'))
    {
        return true
    }

    let allowedIP: Set<string> = new Set([
        '127.0.0.1',
        '192.168.77.111',
        '192.168.10.4',
        '192.168.77.143'
    ]);

    if (allowedIP.has(remoteAddress))
    {
        return true;
    }

    return true;

}

function allowAllAccess(): boolean
{
    return true
}