"use strict";

angular.module("user",["ui.router","userList","userAdd","userGroup"])
.config(["$stateProvider", "$urlRouterProvider", function ($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state("list.user.userList",{
        url:"/userList",
        templateUrl:"module/user/view/userList.html",
        controller:"userListCon"
    })

    .state("list.user.userGroup",{
        url:"/userGroup",
        templateUrl:"module/user/view/userGroup.html",
        controller:"userGroupCon"
    })

    .state("list.user.userAdd",{
        url:"/userAdd/:userId",
        templateUrl:"module/user/view/userAdd.html",
        controller:"userAddCon"
    })

}])
.controller("userCon",function($scope,$state,$http){
    var mainHeight = $(window).height()-60-32;
    $(".user").height(mainHeight);
    //给父级传值
    $scope.$emit('to-parent', 'user');
    //切换tab
    $scope.userTab = 'userGroup';
    $scope.changeTab = function(tab){
        $scope.userTab = tab;
    };
})
