/**
* Created by sujata.patne on 24-07-2015.
*/
myApp.service('ContentCatalog', ['$http', function ($http) {
    var service = {};
    service.baseRestUrl = '';
    service.getContentCatalog = function (data, success, error) {
        $http.post(service.baseRestUrl + '/getcontentcatalog', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    service.UpdateState = function (data, success, error) {
        $http.post(service.baseRestUrl + '/updatestate', data).success(function (items) {
            success(items);
        }).error(function (err) {
            error(err);
        });
    }

    return service;
} ]);