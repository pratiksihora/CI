/**
* Created by sujata.patne on 13-07-2015.
*/
var mysql = require('../config/db').pool;
var AdminLog = require('../models/AdminLog');
var fs = require('fs');


var async = require("async");
var _ = require("underscore");

exports.getvendor = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var ModCMquery = " inner join (select * from icn_vendor_user)vu on (vd.vd_id =vu.vu_vd_id and vu_ld_id =" + req.session.UserId + ")";
                    var vendorquery = (req.session.UserRole == "Content Manager" || req.session.UserRole == "Moderator") ? ModCMquery : "";
                    async.parallel({
                        VendorList: function (callback) {
                            if (req.body.state == "vendor") {
                                var query = connection_ikon_cms.query('select vd_id,vd_name,vd_display_name,vd_created_on,vd_starts_on,vd_end_on,vd_is_active,vd_desc as title,vd_desc as buttoncolor,vd_desc as status from (select * from icn_vendor_detail ) vd ' + vendorquery + ' order by vd_name', function (err, VendorList) {
                                    callback(err, VendorList);
                                });
                            }
                            else if (req.body.state == "editvendor") {
                                var query = connection_ikon_cms.query('SELECT * FROM  (SELECT * FROM icn_vendor_detail where vd_id =? ) vd inner join (select * from vendor_profile)vp on(vd.vd_id =vp.vp_vendor_id)' + vendorquery, [req.body.Id], function (err, VendorList) {
                                    callback(err, VendorList);
                                });
                            }
                            else {
                                callback(err, []);
                            }
                        },
                        SelectedRightsData: function (callback) {
                            if (req.body.state == "editvendor") {
                                var str = "select * from (select * from (select * from vendor_profile where vp_vendor_id= ? )  vp inner join (select * from multiselect_metadata_detail ) mmd on (vp.vp_r_group_id=mmd.cmd_group_id) inner join (select * from rights )  r on (mmd.cmd_entity_detail = r.r_group_id)) cm";
                                var query = connection_ikon_cms.query(str, [req.body.Id], function (err, AllSelectedRights) {
                                    callback(err, AllSelectedRights);
                                });
                            }
                            else {
                                callback(err, []);
                            }
                        },
                        MasterRights: function (callback) {
                            var query = connection_ikon_cms.query('select * from (SELECT * FROM catalogue_detail)cd inner join(select * from catalogue_master where cm_name in("Content Type","Channel Distribution","Vendor") )cm on(cm.cm_id = cd.cd_cm_id)', function (err, MasterRights) {
                                callback(err, MasterRights);
                            });
                        },
                        IconCountry: function (callback) {
                            var query = connection_ikon_cms.query('select cd_name,case when groupname is null  then  cd_id ELSE icn_country_id  END AS cd_id ,case when groupname is null  then  null ELSE "group"  END AS group_status   from(select cm_id,cd_id as icn_country_id,cd_name,cd_cm_id from catalogue_master as a , catalogue_detail as b where a.cm_name in("icon_geo_location") and a.cm_id = b.cd_cm_id)cm left join(select cd_id,cd_name as country_name from catalogue_master as a , catalogue_detail as b where a.cm_name in("global_country_list") and a.cm_id = b.cd_cm_id)cd on(cm.cd_name = cd.country_name)left join(select cm_name as groupname from catalogue_master)cm_group on(cm_group.groupname=  cm.cd_name)', function (err, IconCountry) {
                                callback(err, IconCountry);
                            });
                        },
                        IconGroupCountry: function (callback) {
                            var query = connection_ikon_cms.query('select cm_id,cm_name,cd_id,cd_name from (select cd_name as group_name from catalogue_master as a , catalogue_detail as b where a.cm_name in("country_group") and a.cm_id = b.cd_cm_id )cm inner join(select cm_id,cm_name,cd_id  as icn_country_id,cd_name from catalogue_master as a,catalogue_detail as b where a.cm_id = b.cd_cm_id)cd on(cm.group_name = cd.cm_name) inner join(select cd_id,cd_name as country_name from catalogue_master as a , catalogue_detail as b where a.cm_name in("global_country_list") and a.cm_id = b.cd_cm_id)globalcountry on(cd.cd_name = globalcountry.country_name)', function (err, IconGroupCountry) {
                                callback(err, IconGroupCountry);
                            });
                        },
                        CountryRights: function (callback) {
                            var query = connection_ikon_cms.query('select distinct cd_id,cd_name from (select CASE  WHEN groupid is null THEN icn_cnt_name ELSE country_name  END AS country_name, CASE  WHEN groupid is null THEN icn_cnt ELSE countryid  END AS country_id,groupid from (SELECT cd_id as icn_cnt,cd_name as icn_cnt_name ,cd_cm_id as icn_cd_cm_id FROM catalogue_detail)cd inner join(select cm_id as icn_cm_id,cm_name as icn_cm_name from catalogue_master where cm_name in("icon_geo_location") )cm on(cm.icn_cm_id = cd.icn_cd_cm_id) left outer join (select cm_id as groupid,cm_name as groupname from catalogue_master )master on(master.groupname = cd.icn_cnt_name) left outer join (select cd_id as countryid,cd_name as country_name,cd_cm_id as m_groupid from catalogue_detail)mastercnt on(master.groupid =mastercnt.m_groupid))country inner join (select cd_id ,cd_name ,cd_cm_id,cm_id,cm_name  from catalogue_detail,catalogue_master where cm_id =cd_cm_id and cm_name in("global_country_list"))g_cd on(g_cd.cd_name =country.country_name)', function (err, CountryRights) {
                                callback(err, CountryRights);
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

exports.addeditvendor = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var query = connection_ikon_cms.query('SELECT * FROM icn_vendor_detail Where vd_name =?', [req.body.Title], function (err, result) {
                        if (err) {
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        }
                        else {
                            if (result.length > 0) {
                                if (result[0].vd_id == req.body.vd_id && req.body.state == "editvendor") {
                                    async.parallel({
                                        EditVendor: function (callback) {
                                            EditVendor(callback);
                                        },
                                        DeleteVendorRights: function (callback) {
                                            DeleteVendorRights(callback);
                                        },
                                        AddVendorRights: function (callback) {
                                            AddVendorRights(callback, req.body.vp_r_group_id, req.body.vd_id);
                                        },
                                        UserRole: function (callback) {
                                            callback(null, req.session.UserRole);
                                        }
                                    }, function (err, results) {
                                        if (err) {
                                            connection_ikon_cms.release();
                                            res.status(500).json(err.message);
                                        } else {
                                            if (fs.existsSync('public/Vendors/' + req.body.OldTitle)) {
                                                // Do something
                                                if (req.body.OldTitle != req.body.Title) {
                                                    fs.rename('public/Vendors/' + req.body.OldTitle, 'public/Vendors/' + req.body.Title, function (err) {
                                                        if (err) throw err;
                                                        fs.stat('public/Vendors/' + req.body.Title, function (err, stats) {
                                                            if (err) throw err;
                                                        });
                                                    });
                                                }
                                            }
                                            else {
                                                fs.mkdirSync('public/Vendors/' + req.body.Title);
                                            }
                                            connection_ikon_cms.release();
                                            res.send({ success: true, message: "Vendor updated successfully." });
                                        }
                                    });
                                }
                                else {
                                    connection_ikon_cms.release();
                                    res.send({ success: false, message: 'Vendor Name must be unique.' });
                                }
                            }
                            else {
                                if (req.body.state == "editvendor") {
                                    async.parallel({
                                        EditVendor: function (callback) {
                                            EditVendor(callback);
                                        },
                                        DeleteVendorRights: function (callback) {
                                            DeleteVendorRights(callback);
                                        },
                                        AddVendorRights: function (callback) {
                                            AddVendorRights(callback, req.body.vp_r_group_id, req.body.vd_id);
                                        },
                                        UserRole: function (callback) {
                                            callback(null, req.session.UserRole);
                                        }
                                    }, function (err, results) {
                                        if (err) {
                                            connection_ikon_cms.release();
                                            res.status(500).json(err.message);
                                        } else {
                                            //"OldTitle": 
                                            //  "Title"
                                            if (fs.existsSync('public/Vendors/' + req.body.OldTitle)) {
                                                // Do something
                                                if (req.body.OldTitle != req.body.Title) {
                                                    fs.rename('public/Vendors/' + req.body.OldTitle, 'public/Vendors/' + req.body.Title, function (err) {
                                                        if (err) throw err;
                                                        fs.stat('public/Vendors/' + req.body.Title, function (err, stats) {
                                                            if (err) throw err;
                                                        });
                                                    });
                                                }
                                            }
                                            else {
                                                fs.mkdirSync('public/Vendors/' + req.body.Title);
                                            }
                                            connection_ikon_cms.release();
                                            res.send({ success: true, message: "Vendor updated successfully." });
                                        }
                                    });
                                }
                                else {
                                    async.parallel({
                                        AddVendor: function (callback) {
                                            AddVendor(callback);
                                        },
                                        UserRole: function (callback) {
                                            callback(null, req.session.UserRole);
                                        }
                                    }, function (err, results) {
                                        if (err) {
                                            connection_ikon_cms.release();
                                            res.status(500).json(err.message);
                                        } else {
                                            if (!fs.existsSync('public/Vendors/' + req.body.OldTitle)) {
                                                fs.mkdirSync('public/Vendors/' + req.body.Title);
                                            }
                                            connection_ikon_cms.release();
                                            res.send({ success: true, message: "Vendor added successfully." });
                                        }
                                    });
                                }
                            }
                        }
                    });

                    function AddVendor(callback) {
                        var query = connection_ikon_cms.query('SELECT MAX(vd_id) AS id FROM icn_vendor_detail', function (err, result) {
                            if (err) {
                                callback(err, null);
                            }
                            else {
                                var vd_id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                var vd_datas = {
                                    vd_id: vd_id,
                                    vd_name: req.body.Title,
                                    vd_display_name: req.body.PersonName,
                                    vd_email_id: req.body.PersonEmail,
                                    vd_mobile_no: req.body.PersonMobileNo,
                                    vd_desc: req.body.Description,
                                    vd_is_active: 1,
                                    vd_starts_on: new Date(req.body.StartDate),
                                    vd_end_on: new Date(req.body.ExpiryDate),
                                    vd_vendor_of: "",
                                    vd_created_on: new Date(),
                                    vd_created_by: req.session.UserName,
                                    vd_modified_on: new Date(),
                                    vd_modified_by: req.session.UserName,
                                    vd_crud_isactive: 1
                                };
                                var query = connection_ikon_cms.query('INSERT INTO icn_vendor_detail SET ?', vd_datas, function (err, result) {
                                    if (err) {
                                        callback(err, null);
                                    }
                                    else {
                                        var vendor = {
                                            vu_ld_id: req.session.UserId,
                                            vu_vd_id: vd_id,
                                            vu_created_on: new Date(),
                                            vu_created_by: req.session.UserName,
                                            vu_modified_on: new Date(),
                                            vu_modified_by: req.session.UserName,
                                            vu_crud_isactive: 1
                                        }
                                        var query = connection_ikon_cms.query('INSERT INTO icn_vendor_user SET ?', vendor, function (err, rightresult) {
                                            if (err) {
                                                callback(err, null);
                                            }
                                            else {
                                                var query = connection_ikon_cms.query('SELECT MAX(cmd_group_id) AS id FROM multiselect_metadata_detail', function (err, result) {
                                                    if (err) {
                                                        callback(err, null);
                                                    }
                                                    else {
                                                        var vp_r_GroupId = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                                        var VP_datas = {
                                                            vp_vendor_id: vd_id,
                                                            vp_r_group_id: vp_r_GroupId,
                                                            vp_rights_at_property_level: req.body.AllowChange,
                                                            vp_crud_isactive: 1
                                                        };
                                                        var query = connection_ikon_cms.query('INSERT INTO vendor_profile SET ?', VP_datas, function (err, result) {
                                                            if (err) {
                                                                callback(err, null);
                                                            }
                                                            else {
                                                                AddVendorRights(callback, vp_r_GroupId, vd_id);
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });

                    }
                    function EditVendor(callback) {
                        var query = connection_ikon_cms.query('UPDATE icn_vendor_detail SET vd_name =?,vd_display_name=?,vd_email_id=?,vd_mobile_no=?,vd_desc=?,vd_starts_on=?,vd_end_on=?,vd_vendor_of=?,  vd_modified_on= ?, vd_modified_by = ? WHERE vd_id = ?', [req.body.Title, req.body.PersonName, req.body.PersonEmail, req.body.PersonMobileNo, req.body.Description, new Date(req.body.StartDate), new Date(req.body.ExpiryDate), "", new Date(), req.session.UserName, req.body.vd_id], function (err, result) {
                            if (err) {
                                callback(err, null);
                            }
                            else {
                                var query = connection_ikon_cms.query('UPDATE vendor_profile SET vp_rights_at_property_level= ? WHERE vp_vendor_id = ?', [parseInt(req.body.AllowChange), req.body.vd_id], function (err, result) {
                                    if (err) {
                                        callback(err, null);
                                    }
                                    else {
                                        callback(null, [])
                                    }
                                });
                            }
                        });
                    }
                    function DeleteVendorRights(callback) {
                        if (req.body.DeleteRightsData.length > 0) {
                            var r_ids = _.pluck(req.body.DeleteRightsData, "r_id");
                            var cmd_ids = _.pluck(req.body.DeleteRightsData, "cmd_id");
                            var query = connection_ikon_cms.query('DELETE FROM rights WHERE r_id  in (' + r_ids.toString() + ')', function (err, result) {
                                if (err) {
                                    callback(err, null);
                                }
                                else {
                                    var query = connection_ikon_cms.query('DELETE FROM multiselect_metadata_detail WHERE cmd_id in (' + cmd_ids.toString() + ')', function (err, result) {
                                        if (err) {
                                            callback(err, null);
                                        }
                                        else {
                                            callback(null, []);
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            callback(null, []);
                        }
                    }
                    function AddVendorRights(callback, vp_r_group_id, vd_id) {
                        var rightslength = req.body.AddRightsData.length;
                        if (rightslength > 0) {
                            loop(0);
                            function loop(cnt) {
                                var i = cnt;
                                var query = connection_ikon_cms.query('SELECT MAX(r_id) AS id, MAX(r_group_id) AS groupid FROM rights', function (err, result) {
                                    if (err) {
                                        callback(err, null);
                                    }
                                    else {
                                        var r_id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                        var r_group_id = result[0].groupid != null ? (parseInt(result[0].groupid) + 1) : 1;
                                        var Rights_datas = {
                                            r_id: r_id,
                                            r_group_id: r_group_id,
                                            r_entity_type: req.body.vendor_content_type,
                                            r_allowed_content_type: req.body.AddRightsData[i].AllowedContentType,
                                            r_country_distribution_rights: req.body.AddRightsData[i].CountryDistributionRights,
                                            r_channel_distribution_rights: req.body.AddRightsData[i].ChannelDistributionRights,
                                            r_created_on: new Date(),
                                            r_modified_on: new Date(),
                                            r_created_by: req.session.UserName,
                                            r_modified_by: req.session.UserName,
                                            r_crud_isactive: 1
                                        };
                                        var query = connection_ikon_cms.query('INSERT INTO rights SET ?', Rights_datas, function (err, result) {
                                            if (err) {
                                                callback(err, null);
                                            }
                                            else {
                                                var query = connection_ikon_cms.query('SELECT MAX(cmd_id) AS id FROM multiselect_metadata_detail', function (err, result) {
                                                    if (err) {
                                                        callback(err, null);
                                                    }
                                                    else {
                                                        var cmd_data = {
                                                            cmd_id: result[0].id != null ? (parseInt(result[0].id) + 1) : 1,
                                                            cmd_group_id: vp_r_group_id,
                                                            cmd_entity_type: req.body.vendor_content_type,
                                                            cmd_entity_detail: r_group_id,
                                                            cmd_crud_isactive: 1
                                                        };
                                                        var query = connection_ikon_cms.query('INSERT INTO multiselect_metadata_detail SET ?', cmd_data, function (err, result) {
                                                            if (err) {
                                                                callback(err, null);
                                                            }
                                                            else {
                                                                cnt = cnt + 1;
                                                                if (cnt == rightslength) {
                                                                    AdminLog.adminlog(connection_ikon_cms, req.body.Title + ' vendor ' + (req.body.state == "addvendor" ? "added" : "updated") + ' successfully and VendorId is ' + vd_id + ".", req.body.state == "addvendor" ? "Add" : "Update" + " Vendor", req.session.UserName, false);
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
                                        });
                                    }
                                });
                            }
                        }
                        else {
                            AdminLog.adminlog(connection_ikon_cms, req.body.Title + ' vendor ' + (req.body.state == "addvendor" ? "added" : "updated") + ' successfully and VendorId is ' + vd_id + ".", req.body.state == "addvendor" ? "Add" : "Update" + " Vendor", req.session.UserName, false);
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

exports.blockunblockvendor = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var query = connection_ikon_cms.query('SELECT * FROM icn_vendor_detail where vd_id = ?', [req.body.vd_Id], function (err, vendor) {
                        if (err) {
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        }
                        else {
                            var query = connection_ikon_cms.query('UPDATE icn_vendor_detail SET vd_is_active= ? where vd_id= ?', [req.body.active, req.body.vd_Id], function (err, result) {
                                if (err) {
                                    connection_ikon_cms.release();
                                    res.status(500).json(err.message);
                                }
                                else {
                                    AdminLog.adminlog(connection_ikon_cms, vendor[0].vd_name + ' Vendor ' + (req.body.active == 1 ? "unblocked" : "blocked") + " successfully and VendorId is " + req.body.vd_Id + ".", (req.body.active == 1 ? "UnBlock" : "Block") + " Vendor", req.session.UserName, true);
                                    res.send({ success: true, message: 'Vendor ' + (req.body.active == 1 ? 'unblocked' : 'blocked') + ' successfully.' });
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