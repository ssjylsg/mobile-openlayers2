"use strict";

angular.module("transcodingList",["ui.router"])
.controller("transcodingListCon",function($scope,$rootScope,$state,$http){
  //给父级传值
  $scope.$emit('to-parent', 'transcod');
  //获取转码数据
  var transList = function(){
    $http({
      url:$rootScope.rootUrl + "tcsp/getTcspInfo",
      method:"GET"
    }).success(function(data,header,config,status){
      $scope.tcsList = data.RoleList;
    });
  };
  transList();
  //点击增加  編輯
  $scope.add = function(id){
    var id = id;
    $state.go("list.transcoding.transcodingAdd",{transId:id})
  };
  //下载
  $scope.downLoad_Json = function(id){
    var id = id;
    window.open($rootScope.rootUrl + "tcsp/downloadConfig?id="+id);
  };
  //删除
  $scope.delete_trans = function(id){
    layer.confirm('确认删除该版本所有相关的数据?', {
        icon : 0,
        title : ['删除提示',"height:32px;font-size:14px;color:#ebebed;background:#acaeb5;line-height:32px;"],
        area : ['300px' , '160px'],
        btn : [ '确认', '取消' ]
    },function(index) {
        layer.close(index);
        $http({
          url : $rootScope.rootUrl + "tcsp/delete?id="+id,
          method : "DELETE"
        }).success(function(data,header,config,status){
          layer.msg('删除成功！',{icon: 1,});
          transList();
        })
    });
  };
})
