
var mysql = require('../config/db').pool;
var nodemailer = require('nodemailer');
var AdminLog = require('../models/AdminLog');
var async = require("async");
var _ = require("underscore");
exports.getuserdata = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var userquery = req.body.state == "edituser" ? ' and ld_id = ' + req.body.Id : "";
                    var uservendorquery = req.body.state == "edituser" ? 'where vu_ld_id = ' + req.body.Id : "";
                    async.parallel({
                        UserRole: function (callback) {
                            var query = connection_ikon_cms.query('select * from (SELECT * FROM catalogue_detail)cd inner join(select * from catalogue_master where cm_name in("User Role") )cm on(cm.cm_id = cd.cd_cm_id)', function (err, UserRole) {
                                callback(err, UserRole);
                            });
                        },
                        VendorList: function (callback) {
                            var query = connection_ikon_cms.query('SELECT vd_id, vd_name, vd_display_name FROM icn_vendor_detail order by vd_name', function (err, VendorList) {
                                callback(err, VendorList);
                            });
                        },
                        Users: function (callback) {
                            var query = connection_ikon_cms.query('SELECT * FROM  icn_login_detail where ld_role in("Super Admin","Content Manager","Moderator")' + userquery, function (err, Users) {
                                callback(err, Users);
                            });
                        },
                        UserVendors: function (callback) {
                            var query = connection_ikon_cms.query('select * from(select * from icn_vendor_user ' + uservendorquery + ')lv inner join (select vd_id,vd_name from icn_vendor_detail)v on(v.vd_id = lv.vu_vd_id) inner join (select ld_id from icn_login_detail )l on(l.ld_id = lv.vu_ld_id) ', function (err, UserVendors) {
                                callback(err, UserVendors);
                            });
                        },
                        RoleUser: function (callback) {
                            callback(null, req.session.UserRole);
                        }
                    },
                    function (err, results) {
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
        connection_ikon_cms_cms.release();
        res.status(500).json(err.message);
    }
}

exports.addedituser = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var flag = true;
                    var query = connection_ikon_cms.query('SELECT * FROM icn_login_detail where LOWER(ld_user_id) = ?', [req.body.UserName.toString().toLowerCase()], function (err, result) {
                        if (err) {
                            connection_ikon_cms.release();;
                            res.status(500).json(err.message);
                        }
                        else {
                            if (result.length > 0) {
                                if (result[0].ld_id != req.body.ld_Id) {
                                    flag = false;
                                }
                            }
                            if (flag) {
                                var query = connection_ikon_cms.query('SELECT *  FROM icn_login_detail where LOWER(ld_email_id) = ?', [req.body.EmailId.toString().toLowerCase()], function (err, result) {
                                    if (err) {
                                        connection_ikon_cms.release();;
                                        res.status(500).json(err.message);
                                    }
                                    else {
                                        if (result.length > 0) {
                                            if (result[0].ld_id != req.body.ld_Id) {
                                                flag = false;
                                            }
                                        }
                                        if (flag) {
                                            var query = connection_ikon_cms.query('SELECT *  FROM icn_login_detail where ld_mobile_no= ?', [req.body.MobileNo], function (err, result) {
                                                if (err) {
                                                    connection_ikon_cms.release();;
                                                    res.status(500).json(err.message);
                                                }
                                                else {
                                                    if (result.length > 0) {
                                                        if (result[0].ld_id != req.body.ld_Id) {
                                                            flag = false;
                                                        }
                                                    }
                                                    if (flag) {
                                                        if (req.body.UserId) {
                                                            if (req.body.DeleteVendor.length > 0) {
                                                                DeletevendorFromuser();
                                                            }
                                                            else {
                                                                EditUser();
                                                            }
                                                        }
                                                        else {
                                                            AddUser();
                                                        }
                                                    }
                                                    else {
                                                        connection_ikon_cms.release();;
                                                        res.send({ success: false, message: 'Mobile No. must be Unique.' });
                                                    }
                                                }
                                            });
                                        }
                                        else {
                                            connection_ikon_cms.release();;
                                            res.send({ success: false, message: 'Email must be Unique.' });
                                        }
                                    }
                                });
                            }
                            else {
                                connection_ikon_cms.release();;
                                res.send({ success: false, message: 'UserName must be Unique.' });
                            }
                        }
                    });

                    function AddUser() {
                        var query = connection_ikon_cms.query('SELECT MAX(ld_id) AS id FROM icn_login_detail', function (err, userdata) {
                            if (err) {
                                connection_ikon_cms.release();;
                                res.status(500).json(err.message);
                            }
                            else {
                                var Ld_id = userdata[0].id != null ? (parseInt(userdata[0].id) + 1) : 1;
                                var datas = {
                                    ld_id: Ld_id,
                                    ld_active: 1,
                                    ld_user_id: req.body.UserName,
                                    ld_user_pwd: 'wakau',
                                    ld_user_name: req.body.UserName,
                                    ld_display_name: req.body.FullName,
                                    ld_email_id: req.body.EmailId,
                                    ld_mobile_no: req.body.MobileNo,
                                    ld_role: req.body.Role,
                                    ld_created_on: new Date(),
                                    ld_created_by: req.session.UserName,
                                    ld_modified_on: new Date(),
                                    ld_modified_by: req.session.UserName,
                                    ld_last_login: new Date(),
                                    ld_crud_isactive: 1
                                };
                                var query = connection_ikon_cms.query('INSERT INTO icn_login_detail SET ?', datas, function (err, rightresult) {
                                    if (err) {
                                        connection_ikon_cms.release();;
                                        res.status(500).json(err.message);
                                    }
                                    else {
                                        var vendorlength = req.body.AddVendor.length;
                                        var UserVendors = [];
                                        if (vendorlength > 0) {
                                            loop(0);
                                            function loop(cnt) {
                                                var i = cnt;
                                                var vendor = {
                                                    vu_ld_id: Ld_id,
                                                    vu_vd_id: req.body.AddVendor[i],
                                                    vu_created_on: new Date(),
                                                    vu_created_by: req.session.UserName,
                                                    vu_modified_on: new Date(),
                                                    vu_modified_by: req.session.UserName,
                                                    vu_crud_isactive: 1
                                                }
                                                var query = connection_ikon_cms.query('INSERT INTO icn_vendor_user SET ?', vendor, function (err, rightresult) {
                                                    if (err) {
                                                        connection_ikon_cms.release();;
                                                        res.status(500).json(err.message);
                                                    }
                                                    else {
                                                        UserVendors.push(vendor);
                                                        cnt = cnt + 1;
                                                        if (cnt == vendorlength) {
                                                            var query = connection_ikon_cms.query('SELECT icn_vendor_user.vu_ld_id,icn_vendor_user.vu_vd_id,icn_vendor_detail.vd_display_name	,icn_vendor_detail.vd_name FROM icn_vendor_user,icn_vendor_detail where icn_vendor_detail.vd_id =icn_vendor_user.vu_vd_id and icn_vendor_user.vu_ld_id = ?', [Ld_id], function (err, UserVendors) {
                                                                if (err) {
                                                                    connection_ikon_cms.release();;
                                                                    res.status(500).json(err.message);
                                                                }
                                                                else {
                                                                    var smtpTransport = nodemailer.createTransport({
                                                                        service: "Gmail",
                                                                        auth: {
                                                                            user: "jetsynthesis@gmail.com",
                                                                            pass: "j3tsynthes1s"
                                                                        }
                                                                    });
                                                                    var Message = "";
                                                                    Message += "<table style=\"border-collapse:collapse\" width=\"510\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tbody><tr><td style=\"border-collapse:collapse;font-size:1px;line-height:1px\" width=\"100%\" height=\"15\">&nbsp;</td></tr>";
                                                                    Message += " <tr><td style=\"border-collapse:collapse;color:#2d2a26;font-family:helvetica,arial,sans-serif;font-size:22px;font-weight: bold;line-height:24px;text-align:left\">You have requested a New User from Icon";
                                                                    Message += " </td></tr><tr><td></td></tr><tr><td style=\"border-collapse:collapse;color:#2d2a26;font-family:helvetica,arial,sans-serif;font-size:15px;font-weight: bold;line-height:24px;text-align:left\">Your Username : " + req.body.UserName;
                                                                    Message += " </td></tr><tr><td style=\"border-collapse:collapse;color:#2d2a26;font-family:helvetica,arial,sans-serif;font-size:15px;font-weight: bold;line-height:24px;text-align:left\">Your Password : " + "wakau";
                                                                    Message += " </td></tr>";
                                                                    Message += " <tr><td style=\"border-collapse:collapse;font-size:1px;line-height:1px\" width=\"100%\" height=\"15\">&nbsp;</td></tr> <tr><td style=\"border-collapse:collapse;color:#5c5551;font-family:helvetica,arial,sans-serif;font-size:15px;line-height:24px;text-align:left\">";
                                                                    Message += "<a style=\"color:#3d849b;font-weight:bold;text-decoration:none\" href=\"http://192.168.1.21:3040/accountlogin \" target=\"_blank\"><span style=\"color:#3d849b;text-decoration:none\">Click here to login</span></a> and start using Icon. If you have not made any request then you may ignore this email.";
                                                                    Message += "  </td></tr><tr><td style=\"border-collapse:collapse;font-size:1px;line-height:1px\" width=\"100%\" height=\"25\">&nbsp;</td></tr><tr><td style=\"border-collapse:collapse;color:#5c5551;font-family:helvetica,arial,sans-serif;font-size:15px;line-height:24px;text-align:left\">If you have any concerns please contact us.</td></tr><tr><td style=\"border-collapse:collapse;font-size:1px;line-height:1px\" width=\"100%\" height=\"25\">&nbsp;</td></tr><tr><td style=\"border-collapse:collapse;color:#5c5551;font-family:helvetica,arial,sans-serif;font-size:15px;line-height:24px;text-align:left\">Thanks,</td></tr><tr><td style=\"border-collapse:collapse;color:#5c5551;font-family:helvetica,arial,sans-serif;font-size:15px;line-height:24px;text-align:left\">Icon Team</td></tr></tbody></table>";
                                                                    var mailOptions = {
                                                                        to: req.body.EmailId,
                                                                        subject: 'New User',
                                                                        html: Message
                                                                    }
                                                                    smtpTransport.sendMail(mailOptions, function (error, response) {
                                                                        if (err) {
                                                                            connection_ikon_cms.release();
                                                                            res.status(500).json(err.message);
                                                                        } else {
                                                                            AdminLog.adminlog(connection_ikon_cms, req.body.UserName + " as " + req.body.Role + " created successfully, UserId is " + Ld_id + " and Temporary password sent to " + req.body.EmailId, "New " + req.body.Role + " Creation", req.session.UserName, true);

                                                                            res.send({ success: true, message: 'User added successfully. Temporary Password sent to register email.', user: datas, UserVendors: UserVendors });

                                                                        }
                                                                    });

                                                                }
                                                            });
                                                        }
                                                        else {
                                                            loop(cnt);
                                                        }
                                                    }
                                                });

                                            }
                                        }
                                        else {
                                            var smtpTransport = nodemailer.createTransport({
                                                service: "Gmail",
                                                auth: {
                                                    user: "jetsynthesis@gmail.com",
                                                    pass: "j3tsynthes1s"
                                                }
                                            });
                                            var Message = "";
                                            Message += "<table style=\"border-collapse:collapse\" width=\"510\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tbody><tr><td style=\"border-collapse:collapse;font-size:1px;line-height:1px\" width=\"100%\" height=\"15\">&nbsp;</td></tr>";
                                            Message += " <tr><td style=\"border-collapse:collapse;color:#2d2a26;font-family:helvetica,arial,sans-serif;font-size:22px;font-weight: bold;line-height:24px;text-align:left\">You have requested a New User from Icon";
                                            Message += " </td></tr><tr><td></td></tr><tr><td style=\"border-collapse:collapse;color:#2d2a26;font-family:helvetica,arial,sans-serif;font-size:15px;font-weight: bold;line-height:24px;text-align:left\">Your Username : " + req.body.UserName;
                                            Message += " </td></tr><tr><td style=\"border-collapse:collapse;color:#2d2a26;font-family:helvetica,arial,sans-serif;font-size:15px;font-weight: bold;line-height:24px;text-align:left\">Your Password : " + "wakau";
                                            Message += " </td></tr>";
                                            Message += " <tr><td style=\"border-collapse:collapse;font-size:1px;line-height:1px\" width=\"100%\" height=\"15\">&nbsp;</td></tr> <tr><td style=\"border-collapse:collapse;color:#5c5551;font-family:helvetica,arial,sans-serif;font-size:15px;line-height:24px;text-align:left\">";
                                            Message += "<a style=\"color:#3d849b;font-weight:bold;text-decoration:none\" href=\"http://192.168.1.21:3040/accountlogin\" target=\"_blank\"><span style=\"color:#3d849b;text-decoration:none\">Click here to login</span></a> and start using Icon. If you have not made any request then you may ignore this email.";
                                            Message += "  </td></tr><tr><td style=\"border-collapse:collapse;font-size:1px;line-height:1px\" width=\"100%\" height=\"25\">&nbsp;</td></tr><tr><td style=\"border-collapse:collapse;color:#5c5551;font-family:helvetica,arial,sans-serif;font-size:15px;line-height:24px;text-align:left\">If you have any concerns please contact us.</td></tr><tr><td style=\"border-collapse:collapse;font-size:1px;line-height:1px\" width=\"100%\" height=\"25\">&nbsp;</td></tr><tr><td style=\"border-collapse:collapse;color:#5c5551;font-family:helvetica,arial,sans-serif;font-size:15px;line-height:24px;text-align:left\">Thanks,</td></tr><tr><td style=\"border-collapse:collapse;color:#5c5551;font-family:helvetica,arial,sans-serif;font-size:15px;line-height:24px;text-align:left\">Icon Team</td></tr></tbody></table>";
                                            var mailOptions = {
                                                to: req.body.EmailId,
                                                subject: 'New User',
                                                html: Message
                                            }
                                            smtpTransport.sendMail(mailOptions, function (error, response) {
                                                if (error) {
                                                    connection_ikon_cms.release();;
                                                    res.status(500).json(error.message);
                                                } else {
                                                    AdminLog.adminlog(connection_ikon_cms, req.body.UserName + " as " + req.body.Role + " created successfully, UserId is " + Ld_id + " and Temporary password sent to " + req.body.EmailId, "New " + req.body.Role + " Creation", req.session.UserName, true);
                                                    res.send({ success: true, message: 'User added successfully. Temporary Password sent to register email.', user: datas, UserVendors: UserVendors });
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }

                    function DeletevendorFromuser() {
                        var query = connection_ikon_cms.query('DELETE FROM icn_vendor_user WHERE vu_ld_id= ' + req.body.ld_Id + ' and  vu_vd_id in (' + req.body.DeleteVendor.toString() + ')', function (err, row, fields) {
                            if (err) {
                                connection_ikon_cms.release();;
                                res.status(500).json(err.message);
                            }
                            else {
                                EditUser();
                            }
                        });
                    }

                    function EditUser() {

                        var query = connection_ikon_cms.query('UPDATE icn_login_detail SET ld_user_id=?, ld_user_name=?,ld_display_name=?,ld_email_id=?,ld_mobile_no= ? ,ld_role = ?,ld_modified_on= ?,ld_modified_by=? where ld_id= ?', [req.body.UserName, req.body.UserName, req.body.FullName, req.body.EmailId, req.body.MobileNo, req.body.Role, new Date(), req.session.UserName, req.body.ld_Id], function (err, result) {
                            if (err) {
                                connection_ikon_cms.release();
                                res.status(500).json(err.message);
                            }
                            else {
                                if (req.body.AddVendor.length > 0) {
                                    var vendorlength = req.body.AddVendor.length;
                                    var count = 0;
                                    loop(count);
                                    function loop(count) {
                                        var query = connection_ikon_cms.query('SELECT * FROM icn_vendor_user where vu_ld_id = ? and vu_vd_id =?', [req.body.ld_Id, req.body.AddVendor[count]], function (err, row) {
                                            if (err) {
                                                connection_ikon_cms.release();
                                                res.status(500).json(err.message);
                                            }
                                            else {
                                                if (!row.length > 0) {
                                                    var vendor = {
                                                        vu_ld_id: req.body.ld_Id,
                                                        vu_vd_id: req.body.AddVendor[count],
                                                        vu_created_on: new Date(),
                                                        vu_created_by: req.session.UserName,
                                                        vu_modified_on: new Date(),
                                                        vu_modified_by: req.session.UserName,
                                                        vu_crud_isactive: 1
                                                    }
                                                    var query = connection_ikon_cms.query('INSERT INTO icn_vendor_user SET ?', vendor, function (err, rightresult) {
                                                        if (err) {
                                                            connection_ikon_cms.release();;
                                                            res.status(500).json(err.message);
                                                        }
                                                        else {
                                                            count++;
                                                            if (count == vendorlength) {
                                                                AdminLog.adminlog(connection_ikon_cms, req.body.UserName + " user updated successfully and UserId is " + req.body.ld_Id + ".", "Update User", req.session.UserName, true);
                                                                res.send({ success: true, message: 'User updated successfully.' });
                                                            }
                                                            else {
                                                                loop(count);
                                                            }
                                                        }
                                                    });

                                                }
                                                else {
                                                    count++;
                                                    if (count == vendorlength) {
                                                        AdminLog.adminlog(connection_ikon_cms, req.body.UserName + " user updated successfully and UserId is " + req.body.ld_Id + ".", "Update User", req.session.UserName, true);
                                                        res.send({ success: true, message: 'User updated successfully.' });

                                                    }
                                                    else {
                                                        loop(count);
                                                    }
                                                }
                                            }
                                        });
                                    };
                                }
                                else {
                                    AdminLog.adminlog(connection_ikon_cms, req.body.UserName + " user updated successfully and UserId is " + req.body.ld_Id + ".", "Update User", req.session.UserName, true);
                                    res.send({ success: true, message: 'User updated successfully.' });
                                }
                            }
                        });
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
        connection_ikon_cms.release();
        res.status(500).json(err.message);
    }
}

exports.blockunblockuser = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var query = connection_ikon_cms.query('SELECT * FROM icn_login_detail where ld_id = ?', [req.body.ld_Id], function (err, Userdata) {
                        if (err) {
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        }
                        else {
                            var query = connection_ikon_cms.query('UPDATE icn_login_detail SET ld_active= ? where ld_id= ?', [req.body.active, req.body.ld_Id], function (err, result) {
                                if (err) {
                                    connection_ikon_cms.release();
                                    res.status(500).json(err.message);
                                }
                                else {
                                    AdminLog.adminlog(connection_ikon_cms, Userdata[0].ld_user_id + (req.body.active == 1 ? " unblocked" : " blocked") + " successfully and UserId is " + req.body.ld_Id + ".", (req.body.active == 1 ? "UnBlock" : "Block") + " User", req.session.UserName, true);
                                    res.send({ success: true, message: 'User ' + (req.body.active == 1 ? 'unblocked' : 'blocked') + ' successfully.' });
                                }
                            });
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




