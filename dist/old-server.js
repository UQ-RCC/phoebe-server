"use strict";
/*
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
*/
/*
let server2 = http.createServer((req, res) =>
{
    console.log(`${os.hostname} : ${req.method}: ${req.connection.remoteAddress} : ${req.url}`);
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
            console.log(`${os.hostname} : wrote: ${file.path}`);
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
                    console.log(`${os.hostname} : ${uploadState} image: ${frame.experimentName} channel: ${frame.channelNumber} frame: ${frame.timepoint} file: ${filename}`);
                })
                .catch(err => {
                    console.log(`${os.hostname} : database error inserting image: ${frame.experimentName} channel: ${frame.channelNumber} frame: ${frame.timepoint} file: ${filename}`);
                    deleteFile(filename);
                });
            res.end(`POST from ${os.hostname}\n${util.inspect(fields)}`);
        })
    }
    else
    {
        let form = new formidable.IncomingForm();
        if (form)
        {

            form.parse(req, (err, fields: formidable.Fields, files: formidable.Files) =>
            {
                res.end(`**GET from ${os.hostname}\n${util.inspect(fields)}`);
            });
        }
        else
        {
            res.end(`**GET from ${os.hostname}\nNo form`);
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
console.log(`Host: ${os.hostname}\nPrime base: ${config.get("primeBase")}\nDerived base: ${derivedBase}`);

*/
//# sourceMappingURL=old-server.js.map