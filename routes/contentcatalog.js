

var contentcatalog = require('../controller/contentcatalog.controller');
module.exports = function (app) {
    app.route('/getcontentcatalog')
      .post(contentcatalog.getcontentcatalog);
    app.route('/getcontentlisting')
      .post(contentcatalog.getcontentlisting);
    app.route('/updatestate')
      .post(contentcatalog.updatestate);
}