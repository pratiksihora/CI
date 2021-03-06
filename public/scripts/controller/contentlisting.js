
myApp.controller('content-listingCtrl', function ($scope, $state, $http, $stateParams, ngProgress, $window, ContentListing, _, Icon, Upload, ContentFile) {
    $('.removeActiveClass').removeClass('active');
    $('.removeSubactiveClass').removeClass('active');
    $('#contentcatelog').addClass('active');
    ngProgress.color('yellowgreen');
    ngProgress.height('3px');
    $scope.CurrentPage = $state.current.name;
    $scope.accept = '';
    $scope.base_url = '';
    $scope.success = "Metadata files uploaded successfully.";
    $scope.FileUploadVisible = true;
    $scope.uploading = false;

    function getStatus(UserRole, MetadataExpirydate, VendorExpirydate, PropertyExpirydate, Meta_active, Vendor_active, Property_active, cm_state) {
        var status;
        if (cm_state == 7) {
            status = "Metadata deleted for this Metadata Id.";
        }
        else if (cm_state == 5) {
            status = "Metadata rejected for this Metadata Id.";
        }
        else if (Vendor_active != 1) {
            status = "Vendor blocked for this Metadata Id.";
        }
        else if (Datewithouttime(VendorExpirydate) < Datewithouttime(new Date())) {
            status = "Vendor expired for this Metadata Id.";
        }
        else if (Property_active != 1) {
            status = "Property blocked for this Metadata Id.";
        }
        else if (Datewithouttime(PropertyExpirydate) < Datewithouttime(new Date())) {
            status = "Property expired for this Metadata Id.";
        }
        else if (cm_state == 6) {
            status = "Metadata blocked for this Metadata Id.";
        }
        else if (Datewithouttime(MetadataExpirydate) < Datewithouttime(new Date())) {
            status = "Metadata expired for this Metadata Id.";
        }

        return status;
    }

     
    ContentListing.getContentListing({ Id: $stateParams.id }, function (content) {
        content.ContentMetadata.length > 0 ? "" : location.href = "/";
        var meta = content.ContentMetadata[0];
        var data = getStatus(content.UserRole, meta.cm_expires_on, meta.vd_end_on, meta.propertyexpirydate, meta.cm_state, meta.vd_is_active, meta.propertyactive, meta.cm_state);
        if (meta.parentname == "Wallpaper") {
            $scope.Filesuggestion = "Filename must be ContentId_Width_Height.extension like [2345_240x360.gif].";
        }
        else if (meta.parentname == "Video") {
            $scope.Filesuggestion = "Filename must be ContentId_Width_Height.extension like [2345_240x360.mp4].";
        }
        else if (meta.parentname == "Audio") {
            $scope.Filesuggestion = " Filename must be ContentId_Bitrate.extension like [2345_128.mp3].";
        }
        $scope.MetaId = $stateParams.id;
        $scope.cm_title = meta.cm_title;
        $scope.TypeName = meta.parentname;
        $scope.contentid = $stateParams.id;
        $scope.contenttitle = meta.cm_display_title;
        $scope.propertytitle = meta.propertyname;
        $scope.Content_type = meta.parentname;
        $scope.getTime = new Date().getTime();
        $scope.AppFiles = content.AppFiles;
        $scope.AudioFiles = content.AudioFiles;
        $scope.OtherImages = content.OtherImages;
        $scope.OtherVideos = content.OtherVideos;
        $scope.TextFiles = content.TextFiles;
        $scope.ThumbFiles = content.ThumbFiles;
        $scope.VideoFiles = content.VideoFiles;
        $scope.WallpaperFiles = content.WallpaperFiles;

        if ($scope.WallpaperFiles.length > 0 || $scope.AppFiles.length > 0 || $scope.AudioFiles.length > 0 || $scope.OtherImages.length > 0 || $scope.OtherVideos.length > 0 || $scope.TextFiles.length > 0 || $scope.ThumbFiles.length > 0) {
            $scope.Files = [];
            $scope.FileNames = [];
            _.each($scope.ThumbFiles, function (val) {
                val.cf_url = val.cft_thumbnail_img_browse;
                val.type = 'thumb';
                val.Name = 'Thumb File';
                val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                $scope.Files.push(val);
            });
            _.each($scope.WallpaperFiles, function (val) {
                val.compressheight = "100%";
                val.compresswidth = "100%";
                if (val.height > val.width) {
                    val.compressheight = "100%"
                    val.compresswidth = (((val.width * 100) / val.height).toFixed(2)).toString() + "%";
                }
                else if (val.width > val.height) {
                    val.compresswidth = "100%"
                    val.compressheight = (((val.height * 100) / val.width).toFixed(2)).toString() + "%";
                }
                val.type = 'wallpaper';
                val.Name = 'Wallpaper File';
                val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                $scope.Files.push(val);
            })
            _.each($scope.VideoFiles, function (val) {
                val.type = 'video';
                val.Name = 'Video File';
                val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                $scope.Files.push(val);
            });
            _.each($scope.AudioFiles, function (val) {
                val.type = 'audio';
                val.Name = 'Audio File';
                val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                $scope.Files.push(val);
            });
            _.each($scope.AppFiles, function (val) {
                val.type = 'app';
                val.Name = 'AppsGames File';
                val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                $scope.Files.push(val);
            });
            _.each($scope.TextFiles, function (val) {
                val.type = 'text';
                val.Name = 'Text File';
                val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                $scope.Files.push(val);
            });
            _.each($scope.OtherImages, function (val) {
                val.type = 'otherimage';
                val.Name = 'Supporting Image';
                val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                $scope.Files.push(val);
            });
            _.each($scope.OtherVideos, function (val) {
                val.type = 'othervideo';
                val.Name = 'Supporting Video';
                val.filename = val.cf_url.substring(val.cf_url.lastIndexOf("/") + 1).toLowerCase();
                $scope.Files.push(val);
            });
            $scope.filesdetail = BindMasterList($scope.Files, 5);
            if (data) {
                $scope.error = data;
                $scope.errorvisible = true;
                $scope.FileUploadVisible = false;
            }
            $scope.FileUploadVisible = content.UserRole == "Super Admin" ? false : $scope.FileUploadVisible;
        }
        else {
            $scope.FileUploadVisible = false;
        }

    }, function (error) {
        toastr.error(error);
    });


    $scope.replacefileupload = function () {
        $scope.InvalidFileError = false;
        if ($scope.replacefile) {
            imageloop(0);
            function imageloop(cnt) {
                var match = _.find($scope.Files, function (val) { return val.filename == $scope.replacefile[cnt].name.toLowerCase() });
                if (match) {
                    cnt = cnt + 1;
                    if (cnt == $scope.replacefile.length) {
                    }
                    else {
                        imageloop(cnt);
                    }
                }
                else {
                    $scope.InvalidFileError = true;
                    $scope.InvalidFileErrorMessage = $scope.replacefile[cnt].name + " File does not match any files.";
                    toastr.error($scope.InvalidFileErrorMessage);
                }
            }
        }
    }
    $scope.upload = function (isvalid) {
        if (isvalid) {
            if ($scope.replacefile) {
                if (!$scope.InvalidFileError) {
                    imageloop(0);
                    function imageloop(cnt) {
                        $scope.uploading = true;
                        ngProgress.start();
                        var match = _.find($scope.Files, function (val) { return val.filename == $scope.replacefile[cnt].name.toLowerCase() });
                        if (match) {
                            ContentFile.Upload('/replaceFile', { file: $scope.replacefile[cnt], filepath: match.cf_url, cm_title: $scope.cm_title, TypeName: $scope.TypeName,  cm_id: $scope.MetaId }, function (resp) {
                                $scope.getTime = new Date().getTime();
                                toastr.success(resp.config.data.file.name + '  file replaced successfully.');
                                cnt = cnt + 1;
                                if (!(cnt == $scope.replacefile.length)) {
                                    imageloop(cnt);
                                }
                                else {
                                    $("#replacefile").val("");
                                    $scope.uploading = false;
                                    ngProgress.complete();
                                }
                            }, function (error) {
                                toastr.error(error);
                                $scope.uploading = false;
                                ngProgress.complete();
                            });
                        }
                    }
                }
                else {
                    toastr.error($scope.InvalidFileErrorMessage);
                }
            }
            else {
                toastr.error("Please upload file to replace file.");
            }
        }
    }

});

