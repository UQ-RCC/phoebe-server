import * as util from "util";
import * as pg from "pg";
import * as config from "config";

export interface ImageFrame
{
    experimentName: string,
    directory: string,
    channelNumber: number,
    channelName: string,
    timepoint: number,
    msec: number,
    width: number,
    height: number,
    depth: number,
    xSize: number,
    ySize: number,
    zSize: number,
    filename: string
}

export interface FileLink
{
    owner: string,
    folder: string,
    experimentName: string,
    channelNumber: number,
    channelName: string,
    seqNumber: number,
    detail: string
}

export class DBIO
{
    private pool: pg.Pool;
    
    

    public constructor()
    {
        let dbparam = config.get<pg.PoolConfig>("database");        
        
        
        this.pool = new pg.Pool(dbparam);
        this.pool.connect((e, client, release) =>
        {
            if (e)
            {
                console.log(util.inspect(e));
            }
            else
            {
                client.query('select * from version();')
                    .then(res =>
                    {                        
                        console.log(`connected to Postgres server: ${res.rows[0].version}`);
                        client.release();
                    })
                    .catch(e =>
                    {
                        console.log(util.inspect(e));
                    })
            }
        });
    }

    public insertFrame(frame: ImageFrame): Promise<string>
    {
        return new Promise<string>((resolve, reject) =>
        {
            this.pool.connect((e, client) =>
            {
                client.query(`select insert_image_prime(
                    $1::text, 
                    $2::text,
                    $3::integer,
                    $4::integer,
                    $5::integer,
                    $6::double precision,
                    $7::double precision,
                    $8::double precision,
                    $9::integer,
                    $10::text,
                    $11::integer,
                    $12::text,
                    $13::integer
                )`,
                [
                    frame.experimentName,
                    frame.directory,
                    frame.width,
                    frame.height,
                    frame.depth,
                    frame.xSize,
                    frame.ySize,
                    frame.zSize,
                    frame.channelNumber,
                    frame.channelName,
                    frame.timepoint,
                    frame.filename,
                    frame.msec
                ],
                (err: Error, res) =>
                {                    
                    if (err)
                    {                        
                        client.release();
                        reject(err);
                    }
                    else
                    {                        
                        client.release();
                        resolve(res.rows[0]['insert_image_prime']);
                    }
                })
            });
        })
    }

    public registerFile(fileLink: FileLink)
    {
        this.pool.connect((e, client) =>
        {
            client.query(`select register_file(
                $1::text, 
                $2::text,
                $3::text,
                $4::integer,
                $5::text,
                $6::integer,
                $7::text)`,
            [
                fileLink.owner,
                fileLink.folder,
                fileLink.experimentName,
                fileLink.channelNumber,
                fileLink.channelName,
                fileLink.seqNumber,
                fileLink.detail
            ],
            (err: Error, res) =>
            {                    
                if (err)
                {                        
                    client.release();                    
                }
                else
                {                        
                    client.release();                    
                }
            })
        });
    }

    public insertFileLink(fileLink: string, detail: string | null = null)
    {
        let insertFileReference: pg.QueryConfig = {
            text: "select insert_file_link($1::text, $2::jsonb)",
            values: [fileLink, detail]
        }
        
        this.pool.query(insertFileReference)
            .then(r => {console.log(util.inspect(r))})
            .catch(e => console.log(`${e}`)
        );
       
    }

    public nextJob(): Promise<string>
    {
        return new Promise<string>((resolve, reject) =>
        {
            this.pool.connect((e, client) =>
            {
                client.query(`select next_job($1::text)`, ['foo'],
                (e: Error, res: pg.QueryResult) =>
                {
                    if (e)      
                    {
                        client.release();
                        reject(e);
                    }
                    else
                    {
                        console.log(res.rows[0]);
                        resolve(res.rows[0]['next_job']);
                        client.release();
                    } 
                });
            });

        });
        
    }

}