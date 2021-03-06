/**
* Created by sujata.patne on 24-07-2015.
*/
myApp.service('ContentFile', ['$http', 'Upload', function ($http, Upload) {
    var service = {};
    service.baseRestUrl = '';
    service.getContentFile = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getcontentfile').success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    service.checkMetadata = function (data, success, error) {
        $http.post(service.baseRestUrl + '/checkmetadata', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }
    service.Upload = function (url, data, success, error) {
        Upload.upload({
            url: url,
            data: data
        }).then(function (resp) {
            success(resp);
        }, function (resp) {
            error(resp.data);
        }, function (evt) {
        });
    }
    return service;
}]);