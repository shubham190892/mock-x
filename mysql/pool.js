const mysql = require('mysql');
const util = require('util');
const config = require('config');

const mySqlPool = mysql.createPool({
    connectionLimit: 5,
    host: config.mysql.host,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: config.mysql.db
});

mySqlPool.query = util.promisify(mySqlPool.query);

module.exports = {
    mysql: mySqlPool
}
