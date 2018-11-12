"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const pg = require("pg");
const config = require("config");
class DBIO {
    constructor() {
        let dbparam = config.get("database");
        this.pool = new pg.Pool(dbparam);
        this.pool.query('select * from version();')
            .then(res => console.log(` *** connected to Postgres server: ${res.rows[0].version}`))
            .catch(e => console.log(util.inspect(e)));
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
    registerFile(fileLink) {
        this.pool.connect((e, client) => {
            client.query(`select register_file(
                $1::text, 
                $2::text,
                $3::text,
                $4::integer,
                $5::text,
                $6::integer,
                $7::text)`, [
                fileLink.owner,
                fileLink.folder,
                fileLink.experimentName,
                fileLink.channelNumber,
                fileLink.channelName,
                fileLink.seqNumber,
                fileLink.detail
            ], (err, res) => {
                if (err) {
                    client.release();
                }
                else {
                    client.release();
                }
            });
        });
    }
    insertFileLink(fileLink, detail = null) {
        let insertFileReference = {
            text: "select insert_file_link($1::text, $2::jsonb)",
            values: [fileLink, detail]
        };
        this.pool.query(insertFileReference)
            .then(r => { console.log(util.inspect(r)); })
            .catch(e => console.log(`${e}`));
    }
    insertTestRecord(record) {
        const query = `insert into test_log(host, client, filename, md5sum, bytes)
        values($1, $2, $3, $4, $5)
        returning (select coalesce(sum(bytes), 0) from test_log)::integer as total_bytes;`;
        return new Promise((resolve, reject) => {
            this.pool.query(query, record)
                .then(r => {
                let byteCount = r.rows[0]['total_bytes'];
                resolve(byteCount);
            })
                .catch(e => {
                console.log(`caught: ${util.inspect(e)}`);
                reject(`nope`);
            });
        });
    }
    nextJob() {
        return new Promise((resolve, reject) => {
            this.pool.connect((e, client) => {
                client.query(`select next_job($1::text)`, ['foo'], (e, res) => {
                    if (e) {
                        client.release();
                        reject(e);
                    }
                    else {
                        console.log(res.rows[0]);
                        resolve(res.rows[0]['next_job']);
                        client.release();
                    }
                });
            });
        });
    }
}
exports.DBIO = DBIO;
//# sourceMappingURL=database.js.map