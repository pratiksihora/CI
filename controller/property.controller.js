/**
* Created by sujata.patne on 13-07-2015.
*/
var mysql = require('../config/db').pool;
var AdminLog = require('../models/AdminLog');
var nodeExcel = require('excel-export');
var async = require("async");
var _ = require("underscore");

exports.getproperty = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                if ((req.session.UserRole == "Moderator" || req.session.UserRole == "Super Admin") && req.body.state == "addproperty") {
                    res.send({ UserRole: req.session.UserRole });
                }
                else {
                    mysql.getConnection('CMS', function (err, connection_ikon_cms) {

                        var ModCMquery = " inner join (select * from icn_vendor_user)vu on (vd.vd_id =vu.vu_vd_id and vu_ld_id =" + req.session.UserId + ")";
                        var vendorquery = (req.session.UserRole == "Content Manager" || req.session.UserRole == "Moderator") ? ModCMquery : "";
                        async.parallel({
                            VendorList: function (callback) {
                                if (req.body.state == "addproperty" || req.body.state == "editproperty") {
                                    var query = connection_ikon_cms.query('select vd_id,vd_name,vd_created_on,vd_starts_on,vd_end_on,vd_is_active,vp_r_group_id,vp_rights_at_property_level from (select * from icn_vendor_detail) vd inner join (select * from vendor_profile)vp on(vd.vd_id = vp.vp_vendor_id) ' + vendorquery + ' order by vd_name', function (err, VendorList) {
                                        callback(err, VendorList);
                                    });
                                }
                                else {
                                    callback(err, []);
                                }
                            },
                            PropertyList: function (callback) {
                                if (req.body.state == "property") {
                                    var query = connection_ikon_cms.query('select * from (select * from content_metadata where cm_property_id is null) cm inner join (select * from icn_vendor_detail )vd on (cm.cm_vendor=vd.vd_id) ' + vendorquery + ' order by cm_title', function (err, PropertyList) {
                                        callback(err, PropertyList);
                                    });
                                }
                                else if (req.body.state == "vendorproperty") {
                                    var query = connection_ikon_cms.query('select * from (select * from content_metadata where cm_property_id is null and cm_vendor = ?) cm inner join (select * from icn_vendor_detail where vd_id =? )vd on (cm.cm_vendor=vd.vd_id) ' + vendorquery + ' order by cm_title', [req.body.Id, req.body.Id], function (err, PropertyList) {
                                        callback(err, PropertyList);
                                    });
                                }
                                else if (req.body.state == "editproperty") {
                                    if (req.session.UserRole == "Content Manager") {
                                        var query = connection_ikon_cms.query('select * from (select * from content_metadata where cm_property_id is null and cm_id = ? and cm_is_active =1) cm inner join (select * from icn_vendor_detail where vd_is_active =1 )vd on (cm.cm_vendor=vd.vd_id) ' + vendorquery + ' order by cm_title', [req.body.Id], function (err, PropertyList) {
                                            callback(err, PropertyList);
                                        });
                                    }
                                    else {
                                        var query = connection_ikon_cms.query('select * from (select * from content_metadata where cm_property_id is null and cm_id = ?) cm inner join (select * from icn_vendor_detail )vd on (cm.cm_vendor=vd.vd_id) ' + vendorquery + ' order by cm_title', [req.body.Id], function (err, PropertyList) {
                                            callback(err, PropertyList);
                                        });
                                    }
                                }
                                else {
                                    callback(null, []);
                                }
                            },
                            VendorRights: function (callback) {
                                if (req.body.state == "addproperty" || req.body.state == "editproperty") {
                                    var query = connection_ikon_cms.query("select * from (select * from icn_vendor_detail)vd " + vendorquery + " inner join (select * from vendor_profile )vp on(vd.vd_id = vp.vp_vendor_id) inner join (select * from multiselect_metadata_detail )mmd on (vp.vp_r_group_id=mmd.cmd_group_id)inner join (SELECT * FROM catalogue_detail  where cd_name = 'Vendor')cd inner join(select * from catalogue_master where cm_name = 'Vendor')cm on(cm.cm_id = cd.cd_cm_id) inner join (select * from rights ) r on (mmd.cmd_entity_detail = r.r_group_id and r.r_entity_type =cd.cd_id)", function (err, VendorRights) {
                                        callback(err, VendorRights);
                                    });
                                }
                                else {
                                    callback(null, []);
                                }
                            },
                            PropertyRights: function (callback) {
                                if (req.body.state == "editproperty") {
                                    var str = "select * from (select * from(select cm_r_group_id,cm_vendor from content_metadata where cm_id=?)";
                                    str += " cn_mt inner join (select * from multiselect_metadata_detail )mmd on (cn_mt.cm_r_group_id=mmd.cmd_group_id)";
                                    str += " inner join (select * from rights ) r on (mmd.cmd_entity_detail = r.r_group_id)) cm";
                                    //str += " left outer join ( select a.cm_id as country_cm_id,a.cm_name as country_cm_name, b.cd_id as country_cd_id, b.cd_name as country_cd_name";
                                    //str += " from catalogue_master a, catalogue_detail b where b.cd_cm_id=a.cm_id and a.cm_name ='global_country_list')cntry";
                                    //str += " on (cm.r_country_distribution_rights = cntry.country_cd_id)";
                                    //str += " left outer join ( select a.cm_id as channel_cm_id,a.cm_name as channel_cm_name, b.cd_id as channel_cd_id, b.cd_name as channel_cd_name";
                                    //str += " from catalogue_master a, catalogue_detail b where b.cd_cm_id=a.cm_id and  a.cm_name ='Channel Distribution')chnl";
                                    //str += " on ( cm.r_channel_distribution_rights = chnl.channel_cd_id)";
                                    //str += " left outer join ( select a.cm_id as content_cm_id,a.cm_name as  content_cm_name, b.cd_id as content_cd_id, b.cd_name as content_cd_name";
                                    //str += " from catalogue_master a, catalogue_detail b where b.cd_cm_id=a.cm_id and  a.cm_name ='Content Type')content";
                                    //str += " on (cm.r_allowed_content_type = content.content_cd_id)";
                                    //str += " left outer join ( select a.cm_id as property_cm_id,a.cm_name as property_cm_name, b.cd_id as property_cd_id, b.cd_name as property_cd_name";
                                    //str += " from catalogue_master a, catalogue_detail b where b.cd_cm_id=a.cm_id and a.cm_name='Property')property";
                                    //str += " on (cm.r_entity_type = property.property_cd_id)";

                                    var query = connection_ikon_cms.query(str, [req.body.Id], function (err, PropertyRights) {
                                        callback(err, PropertyRights);
                                    });
                                }
                                else {
                                    callback(err, []);
                                }
                            },
                            MasterRights: function (callback) {
                                var query = connection_ikon_cms.query('select * from (SELECT * FROM catalogue_detail)cd inner join(select * from catalogue_master where cm_name in("Content Type","Channel Distribution","Property") )cm on(cm.cm_id = cd.cd_cm_id)', function (err, MasterRights) {
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
        connection_central.release();
        res.status(500).json(err.message);
    }
}

exports.addeditproperty = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var query = connection_ikon_cms.query('SELECT * FROM content_metadata Where cm_title =? and  cm_vendor = ? and  cm_property_id is NULL', [req.body.Title,  req.body.Vendor], function (err, result) {
                        if (err) {
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        }
                        else {
                            if (result.length > 0) {
                                if (result[0].cm_id == req.body.cm_id && req.body.state == "editproperty") {
                                    async.parallel({
                                        EditProperty: function (callback) {
                                            EditProperty(callback);
                                        },
                                        DeletePropertyRights: function (callback) {
                                            DeletePropertyRights(callback);
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
                                            res.send({ success: true, message: "Property updated successfully." });
                                        }
                                    });
                                }
                                else {
                                    connection_ikon_cms.release();
                                    res.send({ success: false, message: 'Property Name must be unique.' });
                                }
                            }
                            else {
                                if (req.body.state == "editproperty") {
                                    async.parallel({
                                        EditProperty: function (callback) {
                                            EditProperty(callback);
                                        },
                                        DeletePropertyRights: function (callback) {
                                            DeletePropertyRights(callback);
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
                                            res.send({ success: true, message: "Property updated successfully." });
                                        }
                                    });
                                }
                                else {
                                    async.parallel({
                                        AddProperty: function (callback) {
                                            AddProperty(callback);
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
                                            res.send({ success: true, message: "Property added successfully." });
                                        }
                                    });
                                }
                            }
                        }
                    });

                    function AddProperty(callback) {
                        var query = connection_ikon_cms.query('SELECT MAX(cm_id) AS id FROM content_metadata', function (err, result) {
                            if (err) {
                                callback(err, null);
                            }
                            else {
                                var query = connection_ikon_cms.query('SELECT MAX(cmd_group_id) AS groupid FROM multiselect_metadata_detail', function (err, group) {
                                    if (err) {
                                        callback(err, null);
                                    }
                                    else {

                                        var cm_id = result[0].id != null ? (parseInt(result[0].id) + 1) : 1;
                                        var cm_r_group_id = req.body.RightSettingShow ? group[0].groupid != null ? (parseInt(group[0].groupid) + 1) : 1 : null;
                                        var cm_datas = {
                                            cm_id: cm_id,
                                            cm_vendor: req.body.Vendor,
                                            cm_content_type: req.body.property_content,
                                            cm_r_group_id: cm_r_group_id,
                                            cm_title: req.body.Title,
                                            cm_short_desc: req.body.Description,
                                            cm_release_year: req.body.ReleaseYear,
                                            cm_starts_from: new Date(req.body.StartDate),
                                            cm_expires_on: new Date(req.body.ExpiryDate),
                                            cm_display_title: req.body.Title,
                                            cm_is_active: 1,
                                            cm_created_by: req.session.UserName,
                                            cm_created_on: new Date(),
                                            cm_modified_by: req.session.UserName,
                                            cm_modified_on: new Date(),
                                            cm_crud_isactive: 1
                                        };
                                        var query = connection_ikon_cms.query('INSERT INTO content_metadata SET ?', cm_datas, function (err, result) {
                                            if (err) {
                                                callback(err, null);
                                            }
                                            else {
                                                AddPropertyRights(callback, cm_r_group_id, cm_id);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                    function EditProperty(callback) {
                        var cm_r_group_id = req.body.RightSettingShow ? req.body.property_group : null;
                        if (!cm_r_group_id && req.body.RightSettingShow) {
                            var query = connection_ikon_cms.query('SELECT MAX(cmd_group_id) AS groupid FROM multiselect_metadata_detail', function (err, group) {
                                if (err) {
                                    callback(err, null);
                                }
                                else {
                                    cm_r_group_id = group[0].groupid != null ? (parseInt(group[0].groupid) + 1) : 1;
                                    var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_title=?,cm_short_desc=?,cm_r_group_id=?,cm_release_year=?,cm_starts_from=?,cm_expires_on=?,cm_vendor=? ,cm_modified_on =?,cm_modified_by=? where cm_id= ?', [req.body.Title, req.body.Description, cm_r_group_id, req.body.ReleaseYear, new Date(req.body.StartDate), new Date(req.body.ExpiryDate), req.body.Vendor, new Date(), req.session.UserName, req.body.cm_id], function (err, result) {
                                        if (err) {
                                            callback(err, null);
                                        }
                                        else {
                                            AddPropertyRights(callback, cm_r_group_id, req.body.cm_id);
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_title=?,cm_short_desc=?,cm_r_group_id=?,cm_release_year=?,cm_starts_from=?,cm_expires_on=?,cm_vendor=? ,cm_modified_on =?,cm_modified_by=? where cm_id= ?', [req.body.Title, req.body.Description, cm_r_group_id, req.body.ReleaseYear, new Date(req.body.StartDate), new Date(req.body.ExpiryDate), req.body.Vendor, new Date(), req.session.UserName, req.body.cm_id], function (err, result) {
                                if (err) {
                                    callback(err, null);
                                }
                                else {
                                    AddPropertyRights(callback, cm_r_group_id, req.body.cm_id);
                                }
                            });
                        }
                    }
                    function DeletePropertyRights(callback) {
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
                    function AddPropertyRights(callback, cm_r_group_id, cm_id) {
                        var rightslength = req.body.AddRightsData.length;
                        if (rightslength > 0 && cm_r_group_id != null) {
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
                                            r_entity_type: req.body.property_content,
                                            r_allowed_content_type: req.body.AddRightsData[i].AllowedContentType,
                                            r_country_distribution_rights: req.body.AddRightsData[i].CountryDistributionRights,
                                            r_channel_distribution_rights: req.body.AddRightsData[i].ChannelDistributionRights,
                                            r_rights_at_content_level: req.body.AllowChange,
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
                                                            cmd_group_id: cm_r_group_id,
                                                            cmd_entity_type: req.body.property_content,
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
                                                                    var query = connection_ikon_cms.query('UPDATE rights as a ,multiselect_metadata_detail as b SET a.r_rights_at_content_level = ? WHERE a.r_group_id =b.cmd_entity_detail and b.cmd_group_id =?', [req.body.AllowChange, req.body.cm_r_group_id], function (err, test) {
                                                                        if (err) {
                                                                            callback(err, null);
                                                                        }
                                                                        else {
                                                                            AdminLog.adminlog(connection_ikon_cms, req.body.Title + ' property ' + req.body.state == "addproperty" ? "added" : "updated" + ' successfully and PropertyId is ' + cm_id + ".", req.body.state == "addproperty" ? "Add" : "Update" + " Property", req.session.UserName, false);
                                                                            callback(null, []);
                                                                        }
                                                                    });
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
                            var query = connection_ikon_cms.query('UPDATE rights as a ,multiselect_metadata_detail as b SET a.r_rights_at_content_level = ? WHERE a.r_group_id =b.cmd_entity_detail and b.cmd_group_id =?', [req.body.AllowChange, cm_r_group_id], function (err, test) {
                                if (err) {
                                    callback(err, null);
                                }
                                else {
                                    AdminLog.adminlog(connection_ikon_cms, req.body.Title + ' property ' + req.body.state == "addproperty" ? "added" : "updated" + ' successfully and PropertyId is ' + cm_id + ".", req.body.state == "addproperty" ? "Add" : "Update" + " Property", req.session.UserName, false);
                                    callback(null, []);
                                }
                            });
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

exports.blockunblockproperty = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var query = connection_ikon_cms.query('SELECT * FROM content_metadata where cm_id = ?', [req.body.cm_id], function (err, property) {
                        if (err) {
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        }
                        else {
                            var query = connection_ikon_cms.query('UPDATE content_metadata SET cm_is_active= ? where cm_id= ?', [req.body.active, req.body.cm_id], function (err, result) {
                                if (err) {
                                    connection_ikon_cms.release();
                                    res.status(500).json(err.message);
                                }
                                else {
                                    AdminLog.adminlog(connection_ikon_cms, property[0].cm_title + ' Property ' + (req.body.active == 1 ? "unblocked" : "blocked") + " successfully and Property is " + req.body.cm_id + ".", (req.body.active == 1 ? "UnBlock" : "Block") + " Property", req.session.UserName, true);
                                    res.send({ success: true, message: 'Property ' + (req.body.active == 1 ? 'unblocked' : 'blocked') + ' successfully.' });
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

