import * as util from "util";
import * as pg from "pg";
import * as fs from "fs";
import * as config from "config";
import * as uuidv4 from "uuid/v4";

export interface ImageFrame{
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

export class DBIO
{
    private pool: pg.Pool;

    public constructor()
    {
        let dbparam = config.get<pg.PoolConfig>("database");
        console.log(util.inspect(dbparam));
        this.pool = new pg.Pool(dbparam);

        this.pool.connect((e, client, release) =>
        {
            if (e)
            {
                console.log(util.inspect(e));
            }
            else
            {
                client.query('select version();')
                    .then(res =>
                    {
                        console.log(util.inspect(res.rows[0]));
                        client.release();
                    })
                    .catch(e =>
                    {
                        console.log(util.inspect(e));
                    })
            }
        });
    }

    public insertFrame(frame: ImageFrame)
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
            ], (err, res) => {
                if (err)
                {
                    console.log(`database error\n ${util.inspect(err)}`);
                    throw(err);
                }
                else
                {
                    console.log(`image_prime id\n ${util.inspect(res.rows)}`);
                }
                client.release();
            })
        });
    }

}