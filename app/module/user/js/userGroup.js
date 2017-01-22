angular.module("userGroup",["ui.router"])
.controller("userGroupCon",function($scope,$state,$http,$rootScope){
    //获取用户列表
    var userGroup = function(){
      $http({
        url:$rootScope.rootUrl + "roles/getRolesInfo",
        method:"GET"
      }).success(function(data,header,config,status){
        $scope.userGroup_list = data.RoleList;
      });
    };
    userGroup();
    //增加新的用户
    var mydome = $(".userGroupIfream");
    layer.config({
        skin: 'demo-class'
    });
    $scope.userGroupIfream_layer = true;
    var layer_name;
    var init = function(layer_name,roleId){
      //加载树结构
      var setting = {
        async: {
          enable: true,
          type: "get",
          url: $rootScope.rootUrl + "org/getOrgInfoById?roleId="+roleId,
          autoParam: ["id=parentId"],
        },
        check: {
          enable: true,
          nocheckInherit: true,
          chkStyle: "checkbox",
          //chkboxType: { "Y": "s", "N": "p" }
        },
        data: {
          key: {
            //checked: "isChecked",
            children: "nodes"
          },
          simpleData: {
            enable: true
          }
        },
        callback: {
          onAsyncSuccess: zTreeOnAsyncSuccess,
          onCheck: onCheck
        }
      };
      //加载成功时，默认展开一级子节点
      function zTreeOnAsyncSuccess(event, treeId, treeNode, msg) {
        var oneId = JSON.parse(msg)[0].name;
        var treeObj=$.fn.zTree.getZTreeObj("userGroup");
        if (oneId == "组织机构") {
            try {
             //调用默认展开第一个结点
             var selectedNode = treeObj.getSelectedNodes();
             var nodes = treeObj.getNodes();
             treeObj.expandNode(nodes[0], true);

             var childNodes = treeObj.transformToArray(nodes[0]);
             treeObj.expandNode(childNodes[1], true);
             treeObj.selectNode(childNodes[1]);
             var childNodes1 = treeObj.transformToArray(childNodes[1]);
             treeObj.checkNode(childNodes1[1], true, true);
             firstAsyncSuccessFlag = 1;
           } catch (err) {

           }
         }
      };
      var userTree = {userPemission:[]};
      function onCheck(e,treeId,treeNode){
        userTree = {userPemission:[]};
      };
      $(document).ready(function(){
        $.fn.zTree.init($("#userGroup"), setting);
      });
      layer.open({
        type: 1,
        title: [layer_name+'用户组',"height:48px;font-size:14px;color:#ADBECf;background:#485767;line-height:48px;"],
        shadeClose: true,
        shade:0.1,
        offset:['10%','30%'],
        area : ['540px' , '710px'],
        content:mydome,
        btn:"保存",
        yes:function(index,layero){
          var treeObj=$.fn.zTree.getZTreeObj("userGroup"),
              nodes = treeObj.getCheckedNodes(true);
          for (var i=0, l=nodes.length; i<l; i++) {
            //只要全部勾选的id
            if(!nodes[i].getCheckStatus().half){
              userTree.userPemission.push({
                resourceId : nodes[i].id,
                parentId : nodes[i].parentId,
                resourceType : nodes[i].isCameraChannel
              });
            };
          };
          $http({
            url:$rootScope.rootUrl + "roles/save",
            method:"POST",
            params: {
              id : roleId,
              name :$scope.userGroup_name,
              remark :$scope.userGroup_des,
              permission :JSON.stringify(userTree)
            }
          }).success(function(data,header,config,status){
            layer.msg('保存成功！',{icon: 1,});
            layer.close(index);
            userGroup();
          });
        }
      });
    };


    $scope.addGroup = function(){
      $scope.userGroupIfream_layer = false;
      layer_name = "新增";
      init(layer_name,"");
    };
    //编辑用户组
    $scope.editor = function($index){
      $scope.userGroupIfream_layer = false;
      layer_name = "编辑";
      var id = $scope.userGroup_list[$index].id;
      $http({
        url:$rootScope.rootUrl + "roles/view?id="+id,
        method:"GET"
      }).success(function(data,header,config,status){
        $scope.userGroup_name = data.data.role.name;
        $scope.userGroup_des = data.data.role.remark;
      });
      init(layer_name,id);


    };
    //删除用户组
    $scope.delete = function(id){
      var id = id;
      layer.confirm('确认删除该版本所有相关的数据?', {
          icon : 0,
          title : ['删除提示',"height:32px;font-size:14px;color:#ebebed;background:#acaeb5;line-height:32px;"],
          area : ['300px' , '160px'],
          btn : [ '确认', '取消' ]
      },function(index) {
          layer.close(index);
          $http({
            url : $rootScope.rootUrl + "roles/delete?id="+id,
            method : "DELETE"
          }).success(function(data,header,config,status){
            layer.msg('删除成功！',{icon: 1,});
            userGroup();
          })
      });
    };
})
