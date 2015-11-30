/**
* Created by sujata.patne on 13-07-2015.
*/
var mysql = require('../config/db').pool;
var AdminLog = require('../models/AdminLog');
var async = require("async");
var shell = require("shelljs");
var atob = require("atob");
var btoa = require("btoa");
var _ = require("underscore");
function getDate() {
    var d = new Date();
    var dt = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    var selectdate = year + '-' + Pad("0", month, 2) + '-' + Pad("0", dt, 2);
    return selectdate;
}
function getTime(val) {
    var d = new Date(val);
    var minite = d.getMinutes();
    var hour = d.getHours();
    var second = d.getSeconds();
    var selectdate = Pad("0", hour, 2) + ':' + Pad("0", minite, 2) + ':' + Pad("0", second, 2);
    return selectdate;
}
function Pad(padString, value, length) {
    var str = value.toString();
    while (str.length < length)
        str = padString + str;

    return str;
}



exports.getcontentcatalog = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var currentdate = getDate();
                    var ModCMquery = " inner join (select * from icn_vendor_user)vu on (vd.vd_id =vu.vu_vd_id and vu_ld_id =" + req.session.UserId + ")";
                    var vendorquery = (req.session.UserRole == "Content Manager" || req.session.UserRole == "Moderator") ? ModCMquery : "";
                    var propquery = (req.body.state == "propertycontent") ? " inner join (select * from content_metadata where cm_property_id is null and cm_id = " + req.body.Id + ")cm on (vd.vd_id = cm.cm_vendor)" : "";
                    var propquery1 = (req.body.state == "propertycontent") ? " and cm_id = " + req.body.Id : "";
                    async.parallel({
                        ContentMetadata: function (callback) {
                            var query = 'SELECT cm_id, cm_vendor, cm_content_type, cm_title ,cm_starts_from, cm_expires_on, cm_property_id, cm_display_title, cm_celebrity, cm_genre, cm_sub_genre ,cm_mood, cm_language,  cm_religion, cm_festival_occasion, cm_raag_tal, cm_instruments,  cm_is_active, cm_thumb_url,cm_modified_on,cm_modified_by, cm_comment, cm_live_on, parentid,parentname,vd_id ,vd_end_on,vd_is_active,propertyid,propertyname,propertyexpirydate,propertyactive,genre_id,genre_name,subgenre_id,subgenre_name,mood_id,mood_name,raagtaal_id,raagtaal_name,instrument_id,instrument_name,festival_id,festival_name,religion_id,religion_name,celebrity_name,language_name,';
                            query += ' CASE  WHEN cm_state = 6   THEN cm_state ';
                            query += ' WHEN cm_state = 1    THEN cm_state ';
                            query += ' WHEN cm_state = 2    THEN cm_state ';
                            query += ' WHEN cm_state = 5    THEN cm_state ';
                            query += ' WHEN cm_state =7   THEN cm_state ';
                            query += ' WHEN propertyexpirydate < "' + currentdate + '" THEN 6 ';
                            query += ' WHEN propertyactive = 0   THEN 6 ';
                            query += ' WHEN vd_end_on < "' + currentdate + '"   THEN 6 ';
                            query += ' WHEN vd_is_active = 0   THEN 6 ';
                            query += ' ELSE cm_state END AS cm_state  FROM  ';
                            query += ' (select cm_id, cm_vendor, cm_content_type, cm_title ,cm_starts_from, cm_expires_on, cm_property_id, cm_display_title, cm_celebrity, cm_genre, cm_sub_genre, cm_mood, cm_language,  cm_religion, cm_festival_occasion, cm_raag_tal, cm_instruments,  cm_is_active,  cm_comment,cm_modified_on,cm_modified_by, cm_live_on,';
                            query += ' CASE WHEN cm_state =5 THEN cm_state ';
                            query += ' WHEN cm_state =7 THEN cm_state ';
                            query += ' WHEN cm_expires_on < "' + currentdate + '" THEN 6 ';
                            query += ' ELSE cm_state END AS cm_state from content_metadata ';
                            query += ' WHERE cm_property_id is not null )cm ';
                            query += ' inner join(SELECT cm_id as propertyid,cm_title as propertyname ,cm_expires_on as propertyexpirydate ,cm_is_active as propertyactive FROM content_metadata where cm_property_id is null ' + propquery1 + ')prop on(cm.cm_property_id =prop.propertyid) ';
                            query += ' inner join(SELECT vd_id ,vd_end_on  ,vd_is_active  FROM icn_vendor_detail)vd on(cm.cm_vendor =vd.vd_id) ' + vendorquery;
                            query += ' inner join (SELECT * FROM icn_manage_content_type)cnt on (cnt.mct_cnt_type_id = cm.cm_content_type) inner join (select cd_id as parentid,cd_name as parentname from catalogue_detail )parent on(parent.parentid  = cnt.mct_parent_cnt_type_id)';
                            query += ' left outer join (select cft_thumbnail_img_browse as cm_thumb_url,cft_cm_id,cft_thumbnail_size from content_files_thumbnail where cft_thumbnail_size ="125*125")cth on(cth.cft_cm_id =cm.cm_id)'
                            query += ' left outer join (select cd_id as genre_id,cd_name as genre_name from catalogue_detail)genres on (genres.genre_id = cm.cm_genre)';
                            query += ' left outer join (select cd_id as subgenre_id,cd_name as subgenre_name from catalogue_detail)subgenres on (subgenres.subgenre_id = cm.cm_sub_genre)';
                            query += ' left outer join (select cd_id as mood_id,cd_name as mood_name from catalogue_detail)mood on (mood.mood_id = cm.cm_mood)';
                            query += ' left outer join (select cd_id as raagtaal_id,cd_name as raagtaal_name from catalogue_detail)raagtaal on (raagtaal.raagtaal_id = cm.cm_raag_tal)';
                            query += ' left outer join (select cd_id as instrument_id,cd_name as instrument_name from catalogue_detail)instrument on (instrument.instrument_id = cm.cm_instruments)';
                            query += ' left outer join (select cd_id as festival_id,cd_name as festival_name from catalogue_detail)festival on (festival.festival_id = cm.cm_festival_occasion)';
                            query += ' left outer join (select cd_id as religion_id,cd_name as religion_name from catalogue_detail)religion on (religion.religion_id = cm.cm_religion)';
                            query += ' LEFT OUTER JOIN (SELECT a.cmd_id AS celebrity_cmd_id, a.cmd_group_id AS celebrity_group,b.cd_id AS celebrity_id,group_concat(  b.cd_name) AS celebrity_name FROM multiselect_metadata_detail a, catalogue_detail b WHERE b.cd_id = a.cmd_entity_detail group by cmd_group_id)celebrity ON ( celebrity.celebrity_group = cm.cm_celebrity )';
                            query += ' LEFT OUTER JOIN (SELECT a.cmd_id AS lang_cmd_id, a.cmd_group_id AS lang_group, b.cd_id AS language_id,group_concat(  b.cd_name )AS language_name FROM multiselect_metadata_detail a, catalogue_detail b WHERE b.cd_id = a.cmd_entity_detail  group by cmd_group_id)lang ON ( lang.lang_group = cm.cm_language ) '
                            var query1 = connection_ikon_cms.query(query, function (err, ContentMetadata) {
                                callback(err, ContentMetadata);
                            });
                        },
                        CatalogueMaster: function (callback) {
                            var query = connection_ikon_cms.query('select * from (select * from catalogue_master where cm_name IN ("Content Title","Property","Celebrity","Genres","Sub Genres","Mood","Languages","Festival","Religion","Instruments","Raag Taal") ) cm', function (err, CatalogueMaster) {
                                callback(err, CatalogueMaster);
                            });
                        },
                        ContentStatus: function (callback) {
                            var query = connection_ikon_cms.query('select * from ( select * from catalogue_detail)cd inner join(select * from catalogue_master where cm_name IN ("Content Status","Content Type") ) cm on (cd.cd_cm_id = cm.cm_id ) order by cd_id', function (err, ContentStatus) {
                                callback(err, ContentStatus);
                            });
                        },
                        Vendors: function (callback) {
                            var query = connection_ikon_cms.query('select * from (select * from icn_vendor_detail) vd ' + vendorquery + propquery, function (err, Vendors) {
                                callback(err, Vendors);
                            });
                        },
                        UserRole: function (callback) {
                            callback(null, req.session.UserRole);
                        },
                        UserName: function (callback) {
                            callback(null, req.session.UserName);
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

exports.updatestate = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var obj = req.body;
                    if (obj.meta.length > 0) {
                        var meta_length = obj.meta.length;
                        loop(0);
                        function loop(m) {
                            var query = connection_ikon_cms.query('Update content_metadata set cm_state =?,cm_comment= ?,cm_modified_on=?,cm_modified_by =?  where cm_id = ?', [obj.meta[m].state, obj.meta[m].comment, new Date(), req.session.UserName, obj.meta[m].id], function (err, multiselectId) {
                                if (err) {
                                    connection_ikon_cms.release();
                                    res.status(500).json(err.message);
                                }
                                else {
                                    //if (obj.meta[m].state == 4 && obj.meta[m].oldstate == 3) {
                                    //    var query = connection_ikon_cms.query('select * from content_files where cf_cm_id = ?', [obj.meta[m].id], function (err, files) {
                                    //        if (err) {
                                    //            connection_ikon_cms.release();
                                    //            res.status(500).json(err.message);
                                    //        }
                                    //        else {
                                    //            if (files.length > 0) {
                                    //                var file_length = files.length
                                    //                fileloop(0);
                                    //                function fileloop(f) {
                                    //                    var oldpath = 'public/' + files[f].cf_url;
                                    //                    var newpath = 'public/temporary/' + files[f].cf_url.substr(files[f].cf_url.lastIndexOf('/') + 1);
                                    //                    shell.exec('ffmpeg -y  -i "' + oldpath + '" -c copy ' + newpath);
                                    //                    f = f + 1;
                                    //                    if (f == file_length) {
                                    //                        m = m + 1;
                                    //                        if (m == meta_length) {
                                    //                            connection_ikon_cms.release();
                                    //                            res.send({ success: true, message: req.body.message });
                                    //                        }
                                    //                        else {
                                    //                            loop(m);
                                    //                        }
                                    //                    }
                                    //                    else {
                                    //                        fileloop(f);
                                    //                    }
                                    //                }
                                    //            }
                                    //            else {
                                    //                m = m + 1;
                                    //                if (m == meta_length) {
                                    //                    connection_ikon_cms.release();
                                    //                    res.send({ success: true, message: req.body.message });
                                    //                }
                                    //                else {
                                    //                    loop(m);
                                    //                }
                                    //            }
                                    //        }
                                    //    });
                                    //}
                                    //else {
                                    m = m + 1;
                                    if (m == meta_length) {
                                        connection_ikon_cms.release();
                                        res.send({ success: true, message: req.body.message });
                                    }
                                    else {
                                        loop(m);
                                    }
                                    //}
                                }
                            });
                        }
                    }
                    else {
                        connection_ikon_cms.release();
                        res.send({ success: true, message: req.body.message });
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
        connection_ikon_plan.release();
        res.status(500).json(err.message);
    }
}

exports.getcontentlisting = function (req, res, next) {
    try {
        if (req.session) {
            if (req.session.UserName) {
                mysql.getConnection('CMS', function (err, connection_ikon_cms) {
                    var currentdate = getDate();
                    var ModCMquery = " inner join (select * from icn_vendor_user)vu on (vd.vd_id =vu.vu_vd_id and vu_ld_id =" + req.session.UserId + ")";
                    var vendorquery = (req.session.UserRole == "Content Manager" || req.session.UserRole == "Moderator") ? ModCMquery : "";
                    async.waterfall([
                           function (callback) {
                               var query = 'SELECT *  FROM  ';
                               query += ' (select * from content_metadata ';
                               query += ' WHERE cm_property_id is not null and cm_id = ? )cm ';
                               query += ' inner join(SELECT cm_id as propertyid,cm_title as propertyname ,cm_expires_on as propertyexpirydate ,cm_is_active as propertyactive FROM content_metadata where cm_property_id is null )prop on(cm.cm_property_id =prop.propertyid) ';
                               query += ' inner join(SELECT vd_id ,vd_end_on  ,vd_is_active  FROM icn_vendor_detail)vd on(cm.cm_vendor =vd.vd_id) ' + vendorquery;
                               query += ' inner join (SELECT * FROM icn_manage_content_type)cnt on (cnt.mct_cnt_type_id = cm.cm_content_type) inner join (select cd_id as parentid,cd_name as parentname from catalogue_detail)parent on(parent.parentid  = cnt.mct_parent_cnt_type_id)';
                               var query1 = connection_ikon_cms.query(query, [req.body.Id], function (err, ContentMetadata) {
                                   callback(err, ContentMetadata);
                               });
                           }
                    ]
                    , function (err, ContentMetadata) {
                        if (err) {
                            connection_ikon_cms.release();
                            res.status(500).json(err.message);
                        } else {
                            if (ContentMetadata.length > 0) {
                                //parentname
                                async.parallel({
                                    ContentMetadata: function (callback) {
                                        callback(null, ContentMetadata);
                                    },
                                    WallpaperFiles: function (callback) {
                                        if (ContentMetadata[0].parentname == "Wallpaper") {
                                            var query = connection_ikon_cms.query('select * from (select cm_id from content_metadata where cm_id = ?)meta inner join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id ) inner join(select  ct_group_id, ct_param  as width from content_template where ct_param_value ="width" )ct_width on(ct_width.ct_group_id =cm_files.cf_template_id) left outer join(select  ct_group_id, ct_param  as height from content_template where ct_param_value ="height" )ct_height on(ct_height.ct_group_id =cm_files.cf_template_id)', [req.body.Id], function (err, ContentFiles) {
                                                callback(err, ContentFiles);
                                            });
                                        }
                                        else {
                                            callback(null, []);
                                        }
                                    },
                                    VideoFiles: function (callback) {
                                        if (ContentMetadata[0].parentname == "Video") {
                                            var query = connection_ikon_cms.query('select * from (select cm_id from content_metadata where cm_id = ?)meta inner join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id ) inner join(select  ct_group_id, ct_param  as width from content_template where ct_param_value ="width" )ct_width on(ct_width.ct_group_id =cm_files.cf_template_id) left outer join(select  ct_group_id, ct_param  as height from content_template where ct_param_value ="height" )ct_height on(ct_height.ct_group_id =cm_files.cf_template_id) left join(select MIN(cft_thumbnail_img_browse) as cm_thumb_url,cft_cm_id from content_files_thumbnail where cft_cm_id = ? group by cft_cm_id)cth on(cth.cft_cm_id =meta.cm_id)', [req.body.Id, req.body.Id], function (err, TextFiles) {
                                                callback(err, TextFiles);
                                            });
                                        }
                                        else {
                                            callback(null, []);
                                        }
                                    },
                                    AudioFiles: function (callback) {
                                        if (ContentMetadata[0].parentname == "Audio") {
                                            var query = connection_ikon_cms.query('select * from (select cm_id from content_metadata where cm_id = ?)meta inner join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id ) inner join(select  ct_group_id, ct_param  as bitrate from content_template where ct_param_value ="bitrate" )ct_bitrate on(ct_bitrate.ct_group_id =cm_files.cf_template_id)  left join(select MIN(cft_thumbnail_img_browse) as cm_thumb_url,cft_cm_id from content_files_thumbnail where cft_cm_id = ? group by cft_cm_id)cth on(cth.cft_cm_id =meta.cm_id)', [req.body.Id, req.body.Id], function (err, TextFiles) {
                                                callback(err, TextFiles);
                                            });
                                        }
                                        else {
                                            callback(null, []);
                                        }
                                    },
                                    AppFiles: function (callback) {
                                        if (ContentMetadata[0].parentname == "AppsGames") {
                                            var query = connection_ikon_cms.query('select * from (select cm_id from content_metadata where cm_id = ?)meta inner join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id ) inner join(select  ct_group_id, ct_param  as app from content_template where ct_param_value ="app" )ct_app on(ct_app.ct_group_id =cm_files.cf_template_id)  left join(select MIN(cft_thumbnail_img_browse) as cm_thumb_url,cft_cm_id from content_files_thumbnail where cft_cm_id = ? group by cft_cm_id)cth on(cth.cft_cm_id =meta.cm_id)', [req.body.Id, req.body.Id], function (err, TextFiles) {
                                                callback(err, TextFiles);
                                            });
                                        }
                                        else {
                                            callback(null, []);
                                        }
                                    },
                                    OtherImages: function (callback) {
                                        if (ContentMetadata[0].parentname == "AppsGames" || ContentMetadata[0].parentname == "Text") {
                                            var query = connection_ikon_cms.query('select * from (select cm_id from content_metadata where cm_id = ?)meta inner join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id )inner join(select  ct_group_id, ct_param  as otherimage from content_template where ct_param_value ="otherimage" )ct_image on(ct_image.ct_group_id =cm_files.cf_template_id) ', [req.body.Id], function (err, TextFiles) {
                                                callback(err, TextFiles);
                                            });
                                        }
                                        else {
                                            callback(null, []);
                                        }
                                    },
                                    OtherVideos: function (callback) {
                                        if (ContentMetadata[0].parentname == "AppsGames" || ContentMetadata[0].parentname == "Text") {
                                            var query = connection_ikon_cms.query('select * from (select cm_id from content_metadata where cm_id = ?)meta inner join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id ) inner join(select  ct_group_id, ct_param  as othervideo from content_template where ct_param_value ="othervideo" )ct_video on(ct_video.ct_group_id =cm_files.cf_template_id)   left join(select MIN(cft_thumbnail_img_browse) as cm_thumb_url,cft_cm_id from content_files_thumbnail where cft_cm_id = ? group by cft_cm_id)cth on(cth.cft_cm_id =meta.cm_id)', [req.body.Id, req.body.Id], function (err, TextFiles) {
                                                callback(err, TextFiles);
                                            });
                                        }
                                        else {
                                            callback(null, []);
                                        }
                                    },
                                    TextFiles: function (callback) {
                                        if (ContentMetadata[0].parentname == "Text") {
                                            var query = connection_ikon_cms.query('select * from (SELECT cm_id,cm_language FROM content_metadata where cm_id =? )meta inner join(select * from multiselect_metadata_detail)mlm on(mlm.cmd_group_id = meta.cm_language) inner join(select * from catalogue_detail )cd on(cd.cd_id = mlm.cmd_entity_detail) inner join(select * from catalogue_master where cm_name in ("Languages"))cm on(cm.cm_id =cd.cd_cm_id)inner join(select * from content_template)ct on(ct.ct_param =  mlm.cmd_entity_detail and ct.ct_param_value = cd.cd_name) inner join (SELECT * FROM content_files  )cm_files on(meta.cm_id = cm_files.cf_cm_id and ct.ct_group_id = cm_files.cf_template_id) left join(select MIN(cft_thumbnail_img_browse) as cm_thumb_url,cft_cm_id from content_files_thumbnail where cft_cm_id = ? group by cft_cm_id)cth on(cth.cft_cm_id =meta.cm_id)', [req.body.Id, req.body.Id], function (err, TextFiles) {
                                                callback(err, TextFiles);
                                            });
                                        }
                                        else {
                                            callback(null, []);
                                        }
                                    },
                                    ThumbFiles: function (callback) {
                                        var query = connection_ikon_cms.query('select * from (SELECT cm_id FROM content_metadata where cm_id = ?)meta inner join(select cft_thumbnail_img_browse, cft_thumbnail_size,cft_cm_id from content_files_thumbnail where cft_cm_id = ?)cth on(cth.cft_cm_id =meta.cm_id)', [req.body.Id, req.body.Id], function (err, ThumbFiles) {
                                            callback(err, ThumbFiles);
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
                            }
                            else {
                                connection_ikon_cms.release();
                                res.send({ ContentMetadata: [] });
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