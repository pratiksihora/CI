
var excel = require('../controller/excel.controller');
module.exports = function (app) {
    app.route('/pdf')
     .get(excel.pdf)
    app.route('/exportexcel')
     .post(excel.exportexcel)
}
