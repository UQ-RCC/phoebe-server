"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const pg = require("pg");
const config = require("config");
class DBIO {
    constructor() {
        let dbparam = config.get("database");
        this.pool = new pg.Pool(dbparam);
        this.pool.connect((e, client, release) => {
            if (e) {
                console.log(util.inspect(e));
            }
            else {
                client.query('select * from version();')
                    .then(res => {
                    console.log(`connected to Postgres server: ${res.rows[0].version}`);
                    client.release();
                })
                    .catch(e => {
                    console.log(util.inspect(e));
                });
            }
        });
    }
    insertFrame(frame) {
        return new Promise((resolve, reject) => {
            this.pool.connect((e, client) => {
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
                )`, [
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
                    if (err) {
                        client.release();
                        reject(err);
                    }
                    else {
                        client.release();
                        resolve(res.rows[0]['insert_image_prime']);
                    }
                });
            });
        });
    }
}
exports.DBIO = DBIO;
//# sourceMappingURL=database.js.map