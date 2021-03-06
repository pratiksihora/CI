
myApp.controller('propertyCtrl', function ($scope, $window, $http, $state, ngProgress, $stateParams, Propertys, _, Excel) {
    $('.removeActiveClass').removeClass('active');
    $('.removeSubactiveClass').removeClass('active');
    $('#manageproperty').addClass('active');
    ngProgress.color('yellowgreen');
    ngProgress.height('3px');
    $scope.CurrentPage = $state.current.name;

    $scope.CurrentPage == "addproperty" ? $('#addproperty').addClass('active') : '';
    ($scope.CurrentPage == "property" || $scope.CurrentPage == "vendorproperty") ? $('#propertylist').addClass('active') : '';
    $scope.RightsShow = false;
    $scope.currentPage = 0;
    $scope.pageSize = 50;
    $scope.PageTitle = $state.current.name == "editproperty" ? "Edit" : "Add";
    $scope.Checked = 1;
    $scope.open1 = false;
    $scope.open2 = false;
    $scope.IsDisable = $scope.CurrentPage == "addproperty" ? false : true;

    $scope.openDatepicker = function (evt) {
        $scope.open2 = false;
        evt.preventDefault();
        evt.stopPropagation();
        $scope.open1 = !$scope.open1;
    }
    $scope.openEndDatepicker = function (evt1) {
        $scope.open1 = false;
        evt1.preventDefault();
        evt1.stopPropagation();
        $scope.open2 = !$scope.open2;
    }

    function GetTitle(Role, VendorActive, VendorExpirydate, PropertyActive, PropertyExpirydate) {
        return VendorActive == 1 ? Datewithouttime(VendorExpirydate) >= Datewithouttime(new Date()) ? PropertyActive == 1 ? Datewithouttime(PropertyExpirydate) >= Datewithouttime(new Date()) ? "Block" : "Property Expired" : "UnBlock" : "Vendor Expired" : "Vendor Blocked";
    }

    function ButtonColor(Role, VendorActive, VendorExpirydate, PropertyActive, PropertyExpirydate) {
        return VendorActive == 1 ? Datewithouttime(VendorExpirydate) >= Datewithouttime(new Date()) ? PropertyActive == 1 ? Datewithouttime(PropertyExpirydate) >= Datewithouttime(new Date()) ? "green" : "darkorange" : "red" : "darkorange" : "darkorange";
    }

    function EditVisible(Role, VendorActive, VendorExpirydate, PropertyActive, PropertyExpirydate) {
        return Role == "Content Manager" ? VendorActive == 1 ? Datewithouttime(VendorExpirydate) >= Datewithouttime(new Date()) ? PropertyActive == 1 ? Datewithouttime(PropertyExpirydate) >= Datewithouttime(new Date()) ? true : true : false : false : false : true;;
    }

    function PropertyStatus(Role, VendorActive, VendorExpirydate, PropertyActive, PropertyExpirydate) {
        return VendorActive == 1 ? Datewithouttime(VendorExpirydate) >= Datewithouttime(new Date()) ? PropertyActive == 1 ? Datewithouttime(PropertyExpirydate) >= Datewithouttime(new Date()) ? "Active" : "Property Expired" : "Property Blocked" : "Vendor Expired" : "Vendor Blocked";
    }
    function GetAddRights(OldData, SelectedData) {
        var AddArray = [];
        _.each(SelectedData, function (selected) {
            var data = _.find(OldData, function (old, key) { return old.cm_vendor == selected.vendorId && selected.AllowedContentType == old.r_allowed_content_type && old.r_channel_distribution_rights == selected.ChannelDistributionRights && old.r_country_distribution_rights == selected.CountryDistributionRights });
            if (!data) {
                AddArray.push(selected);
            }
        });
        return AddArray;
    }

    function GetDeleteRights(OldData, SelectedData) {
        var DeleteArray = [];
        _.each(OldData, function (old) {
            var data = _.find(SelectedData, function (selected, key) { return old.cm_vendor == selected.vendorId && selected.AllowedContentType == old.r_allowed_content_type && old.r_channel_distribution_rights == selected.ChannelDistributionRights && old.r_country_distribution_rights == selected.CountryDistributionRights });
            if (!data) {
                DeleteArray.push({ r_id: old.r_id, cmd_id: old.cmd_id });
            }
        });
        return DeleteArray;
    }

    $scope.resetform = function () {
        $scope.propertyForm.$setPristine();
    }

    function CheckGroupSelection(selectedcountry) {
        var country = [];
        var tempcountry1 = [];
        _.each($scope.CountryGroups, function (item) {
            var groupcountry = _.where($scope.IconGroupCountry, { cm_name: item.cd_name });
            var flag = false;
            var tempcountry2 = [];
            _.each(groupcountry, function (item1) {
                var match = _.find(selectedcountry, function (country) { return country == item1.cd_id });
                if (!match) {
                    flag = true;
                }
                else {
                    tempcountry2.push(match);
                }
            });
            if (!flag) {
                country.push(item.cd_id);
                _.each(tempcountry2, function (item1) {
                    tempcountry1.push(item1);
                });
            }
        });
        _.each(selectedcountry, function (item) {
            var match = _.find($scope.IconOnlyCountry, function (country) { return country.cd_id == item });
            if (match) {
                if (!_.contains(tempcountry1, item)) {
                    country.push(item);
                }
            }
        });
        country = _.unique(country);
        return country;
    }

    function GetSelectedCountry(selectedcountry) {
        var country = [];
        var group = [];
        _.each(selectedcountry, function (item) {
            var match = _.find($scope.IconOnlyCountry, function (country) { return country.cd_id == item });
            if (match) {
                country.push(item);
            }
            else {
                group.push(item);
            }
        });
        _.each(group, function (item) {
            var match = _.find($scope.CountryGroups, function (country) { return country.cd_id == item });
            if (match) {
                var groupcountry = _.where($scope.IconGroupCountry, { cm_name: match.cd_name });
                _.each(groupcountry, function (item) {
                    country.push(item.cd_id);
                });
            }
        });
        country = _.unique(country);
        return country;
    }

    $scope.ExportExcel = function () {
        if ($scope.PropertyList.length > 0) {
            var array = [];
            _.each($scope.PropertyList, function (val) {
                array.push({ 'PropertyTitle': val.cm_title, 'Vendor': val.vd_name, 'AddedOn': val.cm_created_on, 'Status': val.propertystatus });
            })
            var data = ExportExcel(array);
            Excel.ExportExcel({ data: data, 'FileName': 'Propertys' }, function (data) {
                var blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8" });
                window.saveAs(blob, 'Propertys.xlsx');
            }, function (error) {
                toastr.error(error);
            });
        }
    }

    Propertys.getPropertys({ Id: $stateParams.id, state: $scope.CurrentPage }, function (property) {
        var flag = ((property.UserRole == "Moderator" || property.UserRole == "Super Admin") && $scope.CurrentPage == "addproperty") ? location.href = "/" : "";
        if ($scope.CurrentPage == "property" || $scope.CurrentPage == "vendorproperty") {
            $scope.IsBlockPermission = property.UserRole == "Moderator" ? true : false;
            $scope.PropertyList = [];
            property.PropertyList.forEach(function (prop) {
                prop.cm_created_on = setDate(prop.cm_created_on);
                prop.UserRole = property.UserRole;
                prop.title = GetTitle(prop.UserRole, prop.vd_is_active, prop.vd_end_on, prop.cm_is_active, prop.cm_expires_on);
                prop.propertystatus = PropertyStatus(prop.UserRole, prop.vd_is_active, prop.vd_end_on, prop.cm_is_active, prop.cm_expires_on);
                prop.IsEditvisible = EditVisible(prop.UserRole, prop.vd_is_active, prop.vd_end_on, prop.cm_is_active, prop.cm_expires_on);
                prop.buttoncolor = ButtonColor(prop.UserRole, prop.vd_is_active, prop.vd_end_on, prop.cm_is_active, prop.cm_expires_on);
                $scope.PropertyList.push(prop);
            });
        }
        else if ($scope.CurrentPage == "editproperty") {
            property.PropertyList.length > 0 ? "" : location.href = "/";
            $scope.IsEditPermission = (property.UserRole == "Moderator" || property.UserRole == "Super Admin") ? true : false;
            $scope.Vendors = angular.copy(property.VendorList);
            $scope.VendorRights = angular.copy(property.VendorRights);
            $scope.OldPropertyRights = $scope.PropertyRights = property.PropertyRights;

            $scope.CountryGroups = _.where(property.IconCountry, { group_status: "group" });
            $scope.IconOnlyCountry = _.where(property.IconCountry, { group_status: null })
            $scope.IconGroupCountry = property.IconGroupCountry;

            $scope.AllCountryDistributionRights = property.IconCountry;

            $scope.AllAllowedContentType = _.where(property.MasterRights, { cm_name: "Content Type" });
            $scope.AllChannelDistributionRights = _.where(property.MasterRights, { cm_name: "Channel Distribution" });
            var propertycontent = _.find(property.MasterRights, function (prop) { return prop.cm_name == "Property" });
            if (propertycontent) {
                $scope.property_content_type = propertycontent.cd_id;
            }
            property.PropertyList.forEach(function (prop) {
                $scope.SelectedVendor = prop.cm_vendor;
                $scope.OldVendor = prop.cm_vendor;
                $scope.Title = prop.cm_title;
                $scope.ShortDescription = prop.cm_short_desc;
                $scope.ReleaseYear = prop.cm_release_year;
                $scope.StartDate = new Date(prop.cm_starts_from);
                $scope.ExpiryDate = new Date(prop.cm_expires_on);
                $scope.property_group = prop.cm_r_group_id;
            });
            $scope.VendorChange();
        }
        else if ($scope.CurrentPage == "addproperty" && property.UserRole == "Content Manager") {
            $scope.Checked = 1;
            $scope.Vendors = angular.copy(property.VendorList);
            $scope.VendorRights = angular.copy(property.VendorRights);

            $scope.CountryGroups = _.where(property.IconCountry, { group_status: "group" });
            $scope.IconOnlyCountry = _.where(property.IconCountry, { group_status: null })
            $scope.IconGroupCountry = property.IconGroupCountry;

            $scope.AllCountryDistributionRights = property.IconCountry;

            $scope.AllAllowedContentType = _.where(property.MasterRights, { cm_name: "Content Type" });
            $scope.AllChannelDistributionRights = _.where(property.MasterRights, { cm_name: "Channel Distribution" });
            var propertycontent = _.find(property.MasterRights, function (prop) { return prop.cm_name == "Property" });
            if (propertycontent) {
                $scope.property_content_type = propertycontent.cd_id;
            }
        }
        else {
            $window.location.href = "/";
        }
    }, function (error) {
        toastr.error(error);
    });

    $scope.VendorChange = function () {
        VendorRights();
        if ($scope.CurrentPage == "addproperty") {
            $scope.SelectedAllowedContentType = [];
            $scope.SelectedCountryDistributionRights = [];
            $scope.SelectedChannelDistributionRights = [];
            var vendor = _.find($scope.Vendors, function (vdr) { return vdr.vd_id == $scope.SelectedVendor; });
            if (vendor) {
                $scope.VendorStartDate = vendor.vd_starts_on;
                $scope.VendorEndDate = vendor.vd_end_on;
                $scope.StartDate = new Date(vendor.vd_starts_on);
                $scope.ExpiryDate = new Date(vendor.vd_end_on);
                $scope.RightsShow = vendor.vp_rights_at_property_level == 1 ? true : false;
            }
        }
        else {
            var vendor = _.find($scope.Vendors, function (vdr) { return vdr.vd_id == $scope.SelectedVendor; });
            if (vendor) {
                $scope.VendorStartDate = vendor.vd_starts_on;
                $scope.VendorEndDate = vendor.vd_end_on;
                $scope.RightsShow = vendor.vp_rights_at_property_level == 1 ? true : false;
            }
            if ($scope.OldVendor == $scope.SelectedVendor) {

                $scope.SelectedAllowedContentType = _.unique(_.pluck($scope.OldPropertyRights, "r_allowed_content_type"));
                var country = CheckGroupSelection(_.unique(_.pluck($scope.OldPropertyRights, "r_country_distribution_rights")));
                $scope.SelectedCountryDistributionRights = country;
                $scope.SelectedChannelDistributionRights = _.unique(_.pluck($scope.OldPropertyRights, "r_channel_distribution_rights"));
                var right = _.find($scope.OldPropertyRights, function (prop) { return prop; });
                if (right) {
                    $scope.Checked = right.r_rights_at_content_level;
                }
            }
        }
    }

    function GetVendorCountry(selectedcountry) {
        var country = [];
        var tempcountry1 = [];
        _.each($scope.CountryGroups, function (item) {
            var groupcountry = _.where($scope.IconGroupCountry, { cm_name: item.cd_name });
            var flag = false;
            var tempcountry2 = [];
            _.each(groupcountry, function (item1) {
                var match = _.find(selectedcountry, function (country) { return country == item1.cd_id });
                if (!match) {
                    flag = true;
                }
                else {
                    tempcountry2.push(match);
                }
            });
            if (!flag) {
                country.push(item);
                _.each(tempcountry2, function (item1) {
                    tempcountry1.push(item1);
                });
            }
        });
        _.each(selectedcountry, function (item) {
            var match = _.find($scope.IconOnlyCountry, function (country) { return country.cd_id == item });
            if (match) {
                if (!_.contains(tempcountry1, item)) {
                    country.push(match);
                }
            }
        });
        country = _.unique(country);
        return country;
    }

    function VendorRights() {
        $scope.AllowedContentType = [];
        $scope.CountryDistributionRights = [];
        $scope.ChannelDistributionRights = [];
        var VendorRights = _.where($scope.VendorRights, { vp_vendor_id: $scope.SelectedVendor });
        var ContentTypes = _.unique(_.pluck(VendorRights, "r_allowed_content_type"));
        var Countrys = _.unique(_.pluck(VendorRights, "r_country_distribution_rights"));
        var Channels = _.unique(_.pluck(VendorRights, "r_channel_distribution_rights"));

        $scope.AllAllowedContentType.forEach(function (contenttype) {
            var right = _.find(ContentTypes, function (cnt) { return contenttype.cd_id == cnt; });
            if (right) {
                $scope.AllowedContentType.push(contenttype);
            }
        });
        $scope.CountryDistributionRights = GetVendorCountry(Countrys);
        $scope.AllChannelDistributionRights.forEach(function (channeltype) {
            var right = _.find(Channels, function (cnt) { return channeltype.cd_id == cnt; });
            if (right) {
                $scope.ChannelDistributionRights.push(channeltype);
            }
        });
    }

    $scope.Searchpropertyclick = function (data) {
        $scope.searchpropertyquery = $scope.propertyquery;
    }

    $scope.BlockUnBlockProperty = function (Id, Status, classtext) {
        if (classtext !== "darkorange") {
            bootbox.confirm("Are you sure want to " + Status + " this property?", function (result) {
                if (result) {
                    ngProgress.start();
                    var property_data = {
                        cm_id: Id,
                        active: classtext == "green" ? 0 : 1
                    }
                    Propertys.BlockUnBlockProperty(property_data, function (data) {
                        if (data.success) {
                            var prop = _.find($scope.PropertyList, function (property, key) { return Id == property.cm_id; });
                            if (prop) {
                                prop.cm_is_active = property_data.active;
                                prop.title = GetTitle(prop.UserRole, prop.vd_is_active, prop.vd_end_on, prop.cm_is_active, prop.cm_expires_on);
                                prop.propertystatus = PropertyStatus(prop.UserRole, prop.vd_is_active, prop.vd_end_on, prop.cm_is_active, prop.cm_expires_on);
                                prop.IsEditvisible = EditVisible(prop.UserRole, prop.vd_is_active, prop.vd_end_on, prop.cm_is_active, prop.cm_expires_on);
                                prop.buttoncolor = ButtonColor(prop.UserRole, prop.vd_is_active, prop.vd_end_on, prop.cm_is_active, prop.cm_expires_on);
                            }
                            toastr.success(data.message)
                        }
                        else {
                            toastr.error(data.message);
                        }
                        ngProgress.complete();
                    }, function (err) {
                        toastr.error(err);
                        ngProgress.complete();
                    });
                }
            });
        }

    }

    $scope.submitForm = function (isValid) {
        if (isValid) {
            var year = new Date().getFullYear();
            var flag = ($scope.ReleaseYear > 1949 && $scope.ReleaseYear < (year + 2)) ? Datewithouttime($scope.StartDate) <= Datewithouttime($scope.ExpiryDate) ? Datewithouttime($scope.VendorStartDate) <= Datewithouttime($scope.StartDate) && Datewithouttime($scope.VendorEndDate) >= Datewithouttime($scope.ExpiryDate) ? $scope.RightsShow == true ? $scope.SelectedAllowedContentType.length > 0 ? $scope.SelectedCountryDistributionRights.length > 0 ? $scope.SelectedChannelDistributionRights.length > 0 ? "" : "Please Select Channel Distribution rights." : "Please Select Country Distribution rights." : "Please Select Allowed Content Type." : "" : "Start & Expiry date should be within limit of Vendor limits." : "Expire date must be equal or greater than start date." : "Release Year must be between 1950 to current year + 1.";
            if (flag == "") {
                var NewRightsData = [];
                if (!$scope.RightsShow) {
                    $scope.SelectedAllowedContentType = [];
                    $scope.SelectedCountryDistributionRights = [];
                    $scope.SelectedChannelDistributionRights = [];
                }
                else {
                    var selectedcountry = GetSelectedCountry($scope.SelectedCountryDistributionRights);
                    _.each($scope.SelectedAllowedContentType, function (content) {
                        _.each(selectedcountry, function (country) {
                            _.each($scope.SelectedChannelDistributionRights, function (channel) {
                                NewRightsData.push({ vendorId: $scope.SelectedVendor, AllowedContentType: content, CountryDistributionRights: country, ChannelDistributionRights: channel });
                            });
                        });
                    });
                }
                var AddRights = GetAddRights($scope.OldPropertyRights, NewRightsData);
                var DeleteRights = GetDeleteRights($scope.OldPropertyRights, NewRightsData);
                ngProgress.start();
                var property = {
                    "state": $scope.CurrentPage,
                    "cm_id": $stateParams.id,
                    "property_group": $scope.property_group,
                    "Title": $scope.Title,
                    "Vendor": $scope.SelectedVendor,
                    "Description": $scope.ShortDescription,
                    "ReleaseYear": $scope.ReleaseYear,
                    "AddRightsData": AddRights,
                    "DeleteRightsData": DeleteRights,
                    "StartDate": getDate($scope.StartDate),
                    "ExpiryDate": getDate($scope.ExpiryDate),
                    "RightSettingShow": $scope.RightsShow,
                    "AllowChange": $scope.Checked,
                    "property_content": $scope.property_content_type
                }
                Propertys.AddEditProperty(property, function (data) {
                    if (data.success) {
                        toastr.success(data.message);
                        $window.location.href = "#property-list";
                    }
                    else {
                        toastr.error(data.message);
                    }
                    ngProgress.complete();
                }, function (err) {
                    toastr.error(err);
                    ngProgress.complete();
                });
            }
            else {
                toastr.error(flag);
            }
        }
    };
})