"use strict";

angular.module("transcodingAdd",["ui.router"])
.controller("transcodingAddCon",function($scope,$rootScope,$state,$http,$stateParams){
  //表单验证
  var demo = $(".mianTextTrans").Validform({
    tiptype : 4,
    ajaxPost : true
  });
  $scope.formClick = function(){
    return demo.check();
  };
  //是否存在id
  if($stateParams.transId){
    //获取已有信息
    $http({
      url:$rootScope.rootUrl + "tcsp/view?id="+$stateParams.transId,
      method:"GET"
    }).success(function(data,header,config,status){
      $scope.trans = data.data;
    });
  };
  // else{
  //   $scope.trans.httpPort = "8888";
  //   $scope.trans.mediaPort = "554";
  // };
  //确认
  $scope.trans_add_hold = function(){
    if($scope.formClick()){
      $http({
        url:$rootScope.rootUrl + "tcsp/save",
        method:"POST",
        params:{
          id:$stateParams.transId,
          name : $scope.trans.name,
          lanIp : $scope.trans.lanIp,
          wanIp : $scope.trans.wanIp,
          httpPort : $scope.trans.httpPort,
          mediaPort : $scope.trans.mediaPort,
          frequency : $scope.trans.frequency
        }
      }).success(function(data,header,config,status){
        if(data.code == 200){
          $state.go("list.transcoding.transcodingList");
        };
      });
    }else{
      return false;
    };
  };
  //取消
  $scope.trans_add_cancel = function(){
    $state.go("list.transcoding.transcodingList");
  };
})
