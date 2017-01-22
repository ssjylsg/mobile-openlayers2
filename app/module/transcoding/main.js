"use strict";

angular.module("transcoding",["ui.router","transcodingList","transcodingLoad","transcodingAdd"])
.config(["$stateProvider", "$urlRouterProvider", function ($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state("list.transcoding.transcodingList",{
        url:"/transcodingList",
        templateUrl:"module/transcoding/view/transcodingList.html",
        controller:"transcodingListCon"
    })

    .state("list.transcoding.transcodingAdd",{
        url:"/transcodingAdd/:transId",
        templateUrl:"module/transcoding/view/transcodingAdd.html",
        controller:"transcodingAddCon"
    })

    .state("list.transcoding.transcodingLoad",{
        url:"/transcodingLoad",
        templateUrl:"module/transcoding/view/transcodingLoad.html",
        controller:"transcodingLoadCon"
    })

}])
.controller("transcodingCon",function($scope,$rootScope,$state,$http){
    var mainHeight = $(window).height()-60-32;
    $(".transcoding").height(mainHeight);

    $scope.rootTab = "trans";
    $scope.change_Click = function(tab){
      $scope.rootTab = tab;
    }
    // var init = function(){
    //
    //     //表单验证
    //     var demo = $(".mianTextTrans").Validform({
    //       btnSubmit : "#btnSubmit",
    //       tiptype : 4,
    //       ajaxPost : true
    //     });
    //       //增加新的服务器
    //     var mydome = $(".mianTextTrans");
    //     $scope.layer = true;
    //     layer.config({
    //         skin: 'demo-class'
    //     });
    //
    //     $scope.add = function(){
    //       $scope.layer = false;
    //       demo.resetForm();
    //
    //       layer.open({
    //         type: 1,
    //         title: ['新增转码服务器',"height:48px;font-size:14px;color:#ADBECf;background:#485767;line-height:48px;"],
    //         shadeClose: false,
    //         shade:0.1,
    //         offset:['15%','30%'],
    //         area : ['540px' , '460px'],
    //         content:mydome,
    //         btn:"保存",
    //         yes:function(index,layero){
    //
    //         }
    //
    //
    //       });
    //     }
    //
    //     //查看
    //     $scope.sea = function(){
    //       alert()
    //     };
    //     //编辑
    //     $scope.editor = function(){
    //       $scope.layer = false;
    //       demo.resetForm();
    //
    //       layer.open({
    //         type: 1,
    //         title: ['新增转码服务器',"height:48px;font-size:14px;color:#ADBECf;background:#485767;line-height:48px;"],
    //         shadeClose: false,
    //         shade:0.1,
    //         offset:['15%','30%'],
    //         area : ['540px' , '560px'],
    //         content:mydome,
    //         btn:"保存",
    //         yes:function(index,layero){
    //
    //         }
    //       });
    //     };
    //     //删除
    //     $scope.delete = function(){
    //       layer.confirm('确认删除所选的信息吗？', {
    //           icon : 0,
    //           title : ['确定',"height:48px;font-size:14px;color:#ADBECf;background:#485767;line-height:48px;"],
    //           area : ['250px' , '160px'],
    //           btn : [ '确认', '取消' ]
    //         },function(index) {
    //           layer.close(index);
    //         });
    //     };
    //     //下载
    //   $scope.download = function(){
    //       alert()
    //   }
    // };
    // init();
    // //点击转码
    // $scope.transClick = function(){
    //     $scope.rootTab = "trans";
    //     $scope.trans_module = false;
    //     init();
    // };
    //
    // $scope.loadClick = function(){
    //     $scope.rootTab = "loaded";
    //     $scope.trans_module = true;
    //     //表单验证
    //     var demo = $(".load").Validform({
    //       //btnSubmit : "#btnSubmit",
    //       tiptype : 4,
    //       ajaxPost : true
    //     });
    //     $scope.formClick = function(){
    //       return demo1.check();
    //     };
    // }
})
