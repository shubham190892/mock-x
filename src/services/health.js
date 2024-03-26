const {mysql} = require('../../mysql/pool.js')
const getHealth = async () => {
    return await mysql.query('select * from test');
}
module.exports = {
    getHealth: getHealth
}