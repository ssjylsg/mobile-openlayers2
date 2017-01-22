"use strict";

angular.module("transcodingLoad",["ui.router"])
.controller("transcodingLoadCon",function($scope,$rootScope,$state,$http){
  //表单验证
  var demo = $(".load").Validform({
    tiptype : 4,
    ajaxPost : true
  });
  $scope.formClick = function(){
    return demo.check();
  };

  $http({
    url:$rootScope.rootUrl + "media/view",
    method:"GET"
  }).success(function(data,header,config,status){
    $scope.load = data.data;
  });
  //保存
  $scope.loadHold = function(){
    var id = $scope.load.id;
    if($scope.formClick()){
      $http({
        url:$rootScope.rootUrl + "media/save",
        method:"POST",
        params:{
          id : id,
          lanIp : $scope.load.lanIp,
          wanIp : $scope.load.wanIp,
          port : $scope.load.port
        }
      }).success(function(data,header,config,status){
        if(data.code == 200){
          layer.msg('保存成功！',{icon: 1,});
        };
      });
    }else{
      return false;
    };
  };
  //下载
  $scope.downLoadJson = function(){
    var id = $scope.load.id;
    window.open($rootScope.rootUrl + "media/downloadConfig?id="+id);
  };
})
