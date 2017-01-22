angular.module("myApp",["ui.router","login","list"])
.config(["$stateProvider","$urlRouterProvider",function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.when("","/login")
    $stateProvider
        .state("login",{
          url:"/login",
          templateUrl:"module/login/login.html",
          controller:'loginCon'
        })
        .state("list",{
          url:"/list",
          templateUrl:"module/list/list.html",
          controller:'listCon'
        })


}])
.controller("myIndex",function($scope,$http,$rootScope){
    $rootScope.rootUrl = "http://192.168.60.40:8090/mvs/service/";
})
