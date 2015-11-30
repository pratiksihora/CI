
var mysql = require('../config/db').pool;
var async = require("async");
var _ = require("underscore");

exports.getadminlog = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    async.parallel({
                        AdminLogs: function (callback) {
                            var query = connection_ikon_cms.query('SELECT * FROM icn_admin_log_detail Order By ald_id desc', function (err, AdminLogs) {
                                callback(err, AdminLogs);
                            });
                        },
                        UserRole: function (callback) {
                            callback(null, req.session.UserRole);
                        }
                    }, function (err, results) {
                        if (err) {
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        } else {
                            connection_ikon_cms.release();
                            res.send(results);
                        }
                    });
                });
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

        connection_ikon_cms.release();
        res.status(500).json(err.message);
    }
}
