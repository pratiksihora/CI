
var AdminLog = require('../models/AdminLog');
var nodeExcel = require('excel-export');
var http = require('http');

exports.exportexcel = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                var result = nodeExcel.execute(req.body.data);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats');
                res.setHeader("Content-Disposition", "attachment; filename=" + req.body.FileName + ".xlsx");
                res.end(result, 'binary');
            }
            else {
                res.redirect('/accountlogin');
            }
        }
        else {
            res.redirect('/accountlogin');
        }
    }
    catch (err) {
        res.status(500).json(err.message);
    }
}

exports.pdf = function (req, res) {
    var url = "public/help/help.pdf";
    res.download(url);
};
 

