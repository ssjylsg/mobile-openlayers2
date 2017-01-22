angular.module("userList",["ui.router"])
.controller("userListCon",function($scope,$state,$http,$rootScope){
    //获取用户列表
    var list = function(){
      $http({
        url:$rootScope.rootUrl + "user/getUserInfo",
        method:"GET"
      }).success(function(data,header,config,status){
        $scope.user_list = data.RoleList;
      });
    };
    list();
    //点击增加跳转到增加页面
    $scope.goAdd = function(){
      $state.go("list.user.userAdd")
    };
    //点击编辑
    $scope.editor = function(id){
      var userId  = id;
      $state.go("list.user.userAdd",{userId:userId})
    };
    //删除
    $scope.delete = function(id){
      var userId  = id;
      layer.confirm('确认删除该版本所有相关的数据?', {
          icon : 0,
          title : ['删除提示',"height:32px;font-size:14px;color:#ebebed;background:#acaeb5;line-height:32px;"],
          area : ['300px' , '160px'],
          btn : [ '确认', '取消' ]
      },function(index) {
          layer.close(index);
          $http({
            url:$rootScope.rootUrl + "user/delete?id="+userId,
            method:"DELETE"
          }).success(function(data,header,config,status){
            layer.msg('删除成功！',{icon: 1,});
            list();
          });
      });
    };

})
