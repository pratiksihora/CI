/**
* Created by sujata.patne on 13-07-2015.
*/
var mysql = require('../config/db').pool;
var AdminLog = require('../models/AdminLog');
var async = require("async");
var _ = require("underscore");

exports.getmasterlist = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    async.parallel({
                        SubMasterList: function (callback) {
                            if (req.body.state == "masterlist") {
                                var query = connection_ikon_cms.query('select * from ( select * from catalogue_detail)cd inner join(select * from catalogue_master where cm_name IN ("Genres","Sub Genres","Mood","Languages","Celebrity","Festival","Religion","Raag Taal","Instruments","Celebrity Role") ) cm on (cd.cd_cm_id = cm.cm_id ) left outer join ( select * from multiselect_metadata_detail )mmd on (cd.cd_desc = mmd.cmd_group_id )', function (err, SubMasterList) {
                                    callback(err, SubMasterList);
                                });
                            }
                            else if (req.body.state == "editmasterlist") {
                                var query = connection_ikon_cms.query('select * from ( select * from catalogue_detail where cd_id = ?)cd inner join(select * from catalogue_master) cm on (cd.cd_cm_id = cm.cm_id ) left outer join ( select * from multiselect_metadata_detail )mmd on (cd.cd_desc = mmd.cmd_group_id )', [req.body.Id], function (err, SubMasterList) {
                                    callback(err, SubMasterList);
                                });
                            }
                            else {
                                callback(err, []);
                            }
                        },
                        MasterList: function (callback) {
                            var query = connection_ikon_cms.query('select * from catalogue_master where cm_name IN ("Genres","Sub Genres","Mood","Languages","Celebrity","Festival","Religion","Raag Taal","Instruments","Celebrity Role")', function (err, MasterList) {
                                callback(err, MasterList);
                            });
                        },
                        CelebrityRole: function (callback) {
                            var query = connection_ikon_cms.query('select * from ( select * from catalogue_master where cm_name in ("Celebrity Role"))cm inner join(select * from catalogue_detail) cd on (cd.cd_cm_id = cm.cm_id )', function (err, CelebrityRole) {
                                callback(err, CelebrityRole);
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

exports.addeditmasterlist = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var query = connection_ikon_cms.query('SELECT * FROM catalogue_detail Where cd_name =? and cd_cm_id = ?', [req.body.Title, req.body.MasterId], function (err, result) {
                        if (err) {
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        }
                        else {
                            var flag = result.length > 0 ? result[0].cd_id == req.body.cd_id && req.body.state == "editmasterlist" ? true : false : true;
                            if (flag) {
                                async.parallel({
                                    EditMasterList: function (callback) {
                                        if (req.body.state == "editmasterlist") {
                                            EditMasterList(callback);
                                        }
                                        else {
                                            AddMasterList(callback);
                                        }

                                    },
                                    DeleteCelebrityRole: function (callback) {
                                        if (req.body.state == "editmasterlist") {
                                            DeleteCelebrityRole(callback);
                                        }
                                        else {
                                            callback(null, []);
                                        }

                                    },
                                    AddCelebrityRole: function (callback) {
                                        if (req.body.state == "editmasterlist") {
                                            AddCelebrityRole(callback, req.body.cd_desc, req.body.cd_id);
                                        }
                                        else {
                                            callback(null, []);
                                        }
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
                                        res.send({ success: true, message: req.body.Title + ' ' + req.body.MasterName + ' ' + (req.body.state == "addmasterlist" ? "added" : "updated") + ' successfully.' });
                                    }
                                });
                            }
                            else {
                                connection_ikon_cms.release();
                                res.send({ success: false, message: 'Main Title Must be Unique.' });
                            }
                        }
                    });
                    function AddLanguage(cd_id, cd_name, flag, callback) {
                        var query = connection_ikon_cms.query('SELECT MAX(ct_id) AS id,MAX(ct_group_id) AS groupid FROM content_template', function (err, result) {
                            if (err) {
                                callback(err, null);
                            }
                            else {
                                var ct_id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                var groupid = result[0].groupid != null ? (parseInt(result[0].groupid) + 1) : 1;
                                var lang = {
                                    ct_id: ct_id,
                                    ct_group_id: groupid,
                                    ct_param: cd_id,
                                    ct_param_value: cd_name,
                                    ct_is_mandatory: 1,
                                    ct_crud_isactive: 1
                                }
                                var query = connection_ikon_cms.query('INSERT INTO content_template SET ?', lang, function (err, result) {
                                    if (err) {
                                        callback(err, null);
                                    }
                                    else {
                                        if (flag) {
                                            callback(null, []);
                                        }
                                        else {
                                            AddCelebrityRole(callback, groupid, cd_id);
                                        }
                                    }
                                });
                            }
                        });
                    }
                    function AddMasterList(callback) {
                        var query = connection_ikon_cms.query('SELECT MAX(cd_id) AS id ,MAX(cmd_group_id) AS groupid FROM catalogue_detail,multiselect_metadata_detail', function (err, result) {
                            if (err) {
                                callback(err, null);
                            }
                            else {
                                var cd_id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                var groupid = result[0].groupid != null ? (parseInt(result[0].groupid) + 1) : 1;
                                var master_list = {
                                    cd_id: cd_id,
                                    cd_cm_id: req.body.MasterId,
                                    cd_name: req.body.Title,
                                    cd_display_name: (req.body.DisplayTitle && req.body.DisplayTitle != "") ? req.body.DisplayTitle : req.body.Title,
                                    cd_desc: req.body.MasterName == "Celebrity" ? groupid : null,
                                    cd_desc1: req.body.MasterName == "Celebrity" ? req.body.Alias : null,
                                    cd_crud_isactive: 1
                                };
                                var query = connection_ikon_cms.query('INSERT INTO catalogue_detail SET ?', master_list, function (err, result) {
                                    if (err) {
                                        callback(err, null);
                                    }
                                    else {
                                        if (req.body.MasterName == "Languages") {
                                            AddLanguage(cd_id, req.body.Title, false, callback)
                                        }
                                        else {
                                            AddCelebrityRole(callback, groupid, cd_id);
                                        }
                                    }
                                });
                            }
                        });
                    }
                    function EditMasterList(callback) {
                        var query = connection_ikon_cms.query('UPDATE catalogue_detail SET cd_name =?,cd_display_name=?,cd_desc1=? WHERE cd_id = ?', [req.body.Title, (req.body.DisplayTitle && req.body.DisplayTitle != "") ? req.body.DisplayTitle : req.body.Title, req.body.Alias, req.body.cd_id], function (err, result) {
                            if (err) {
                                callback(err, null);
                            }
                            else {
                                if (req.body.MasterName == "Languages") {
                                    var query = connection_ikon_cms.query('select * From content_template WHERE ct_param_value =? and  ct_param =? ', [req.body.OldTitle, req.body.cd_id], function (err, result) {
                                        if (err) {
                                            callback(err, null);
                                        }
                                        else {
                                            if (result.length > 0) {
                                                var query = connection_ikon_cms.query('UPDATE content_template SET ct_param_value =?   WHERE ct_param =? ', [req.body.Title, req.body.cd_id], function (err, result) {
                                                    if (err) {
                                                        callback(err, null);
                                                    }
                                                    else {
                                                        callback(null, []);
                                                    }
                                                });
                                            }
                                            else {
                                                AddLanguage(req.body.cd_id, req.body.Title, true, callback)
                                            }
                                        }
                                    });

                                }
                                else {
                                    callback(null, []);
                                }
                            }
                        });
                    }
                    function DeleteCelebrityRole(callback) {
                        if (req.body.DeleteCelebrityRole.length > 0) {
                            var cmd_ids = _.pluck(req.body.DeleteCelebrityRole, "cmd_id");
                            var query = connection_ikon_cms.query('DELETE FROM multiselect_metadata_detail WHERE cmd_id in (' + cmd_ids.toString() + ')', function (err, result) {
                                if (err) {
                                    callback(err, null);
                                }
                                else {
                                    callback(null, []);
                                }
                            });
                        }
                        else {
                            callback(null, []);
                        }
                    }
                    function AddCelebrityRole(callback, groupid, cd_id) {
                        var rightslength = req.body.CelebrityRole.length;
                        if (rightslength > 0) {
                            loop(0);
                            function loop(cnt) {
                                var i = cnt;
                                var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id FROM multiselect_metadata_detail', function (err, result) {
                                    if (err) {
                                        callback(err, null);
                                    }
                                    else {
                                        var cmd_data = {
                                            cmd_id: result[0].id != null ? (parseInt(result[0].id) + 1) : 1,
                                            cmd_group_id: groupid,
                                            cmd_entity_type: req.body.master_content_type,
                                            cmd_entity_detail: req.body.CelebrityRole[i],
                                            cmd_crud_isactive: 1
                                        };
                                        var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', cmd_data, function (err, result) {
                                            if (err) {
                                                callback(err, null);
                                            }
                                            else {
                                                cnt = cnt + 1;
                                                if (cnt == rightslength) {
                                                    AdminLog.adminlog(connection_ikon_cms, req.body.Title + ' ' + req.body.MasterName + ' ' + (req.body.state == "addmasterlist" ? "added" : "updated") + ' successfully and ' + req.body.MasterName + ' Id is ' + cd_id + ".", req.body.state == "addmasterlist" ? "Add " : "Update " + req.body.MasterName, req.session.UserName, false);
                                                    callback(null, []);
                                                }
                                                else {
                                                    loop(cnt);
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                        }
                        else {
                            AdminLog.adminlog(connection_ikon_cms, req.body.Title + ' ' + req.body.MasterName + ' ' + (req.body.state == "addmasterlist" ? "added" : "updated") + ' successfully and ' + req.body.MasterName + ' Id is ' + cd_id + ".", req.body.state == "addmasterlist" ? "Add " : "Update " + req.body.MasterName, req.session.UserName, false);
                            callback(null, []);
                        }
                    }

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
        connection_ikon_cms_plan.release();
        res.status(500).json(err.message);
    }
}

exports.deletemasterlist = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    async.parallel({
                        message: function (callback) {
                            if (req.body.MasterName == "Celebrity Role") {
                                var query = connection_ikon_cms.query('select * from ( select * from catalogue_detail)cd inner join(select * from catalogue_master where cm_name IN ("Celebrity") ) cm on (cd.cd_cm_id = cm.cm_id ) inner join ( select * from multiselect_metadata_detail )mmd on (cd.cd_desc = mmd.cmd_group_id and mmd.cmd_entity_detail = ?  )', [req.body.cd_id], function (err, result) {
                                    if (err) {
                                        callback(err, []);
                                    }
                                    else {
                                        if (result.length > 0) {
                                            callback(null, "Celebrity Role can't delete. its added in Celebrity.");
                                        }
                                        else {
                                            var query = connection_ikon_cms.query('DELETE FROM catalogue_detail WHERE cd_id = ?', [req.body.cd_id], function (err, result) {
                                                if (err) {
                                                    callback(err, "");
                                                }
                                                else {
                                                    callback(null, "");
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                            else if (req.body.MasterName == "Celebrity") {
                                var query = connection_ikon_cms.query('DELETE FROM multiselect_metadata_detail WHERE cmd_group_id = ?', [req.body.cd_desc], function (err, result) {
                                    if (err) {
                                        callback(err, "");
                                    }
                                    else {
                                        var query = connection_ikon_cms.query('DELETE FROM catalogue_detail WHERE cd_id = ?', [req.body.cd_id], function (err, result) {
                                            if (err) {
                                                callback(err, []);
                                            }
                                            else {
                                                callback(null, "");
                                            }
                                        });
                                    }
                                });
                            }
                            else {
                                var query = connection_ikon_cms.query('DELETE FROM catalogue_detail WHERE cd_id = ?', [req.body.cd_id], function (err, result) {
                                    if (err) {
                                        callback(err, []);
                                    }
                                    else {
                                        callback(null, "");
                                    }
                                });
                            }
                        },
                        UserRole: function (callback) {
                            callback(null, req.session.UserRole);
                        }
                    }, function (err, results) {
                        if (err) {
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        } else {
                            if (results.message !== "") {
                                connection_ikon_cms.release();
                                res.send({ success: false, message: results.message });
                            }
                            else {
                                AdminLog.adminlog(connection_ikon_cms, req.body.Title + " " + req.body.MasterName + " deleted successfully. and " + req.body.MasterName + ' Id is ' + req.body.cd_id + ".", "Delete " + req.body.MasterName, req.session.UserName, true);
                                res.send({ success: true, message: req.body.Title + " " + req.body.MasterName + " deleted successfully." });
                            }
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