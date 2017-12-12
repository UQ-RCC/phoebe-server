//import * as config from "./config.json";
import * as http from "http";
//import * as jss from "json-stringify-safe";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

let config = JSON.parse(fs.readFileSync("config.json", 'utf8'));
let meshBase = config.meshBase;

let server = http.createServer((req, res) =>
{
    if (!allowAccess(req))
    {
        console.log(`rejected connection`);
        res.end();
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
});

server.listen(1337);
console.log("Phoebe server is listening");
console.log(`Host: ${os.hostname}\nMesh base: ${meshBase}`);

function getFile(url: string): { fileStream: fs.ReadStream, mimeType: string, fileName: string } | null
{
    let mimeType: string;
    let fileName: string = url.substr(1);
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