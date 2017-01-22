"use strict";

angular.module("equipment",["ui.router","ngTable"])
.controller("equipmentCon",function($scope,$http,$state,$rootScope,$timeout){
    var mainHeight = $(window).height()-60-32;
    $(".equipment").height(mainHeight);
    $(".equipment_right").height(mainHeight-50);
    //给父级传值
    $scope.$emit('to-parent', 'equip');
    //获取当前设备列表
    var pvg_list = function(){
      $http({
        url:$rootScope.rootUrl + "device/list",
        method:"GET"
      }).success(function(data,header,config,status){
        $scope.pvgList = data;
      });
    };
    pvg_list();
    //新增设备
    var mydome = $(".equipmentAdd_ifeame");
    var mydome1 = $(".sync_page");
    $scope.equipmentAdd_ifeame_hide = true;
    $scope.sync_page_hide = true;
    layer.config({
        skin: 'demo-class'
    });
    //表单验证
    var demo = $(".equipmentAdd_ifeame").Validform({
      btnSubmit : "#btnSubmit",
      tiptype : 4,
      ajaxPost : true
    });
    $scope.formClick = function(){
      return demo.check();
    };
    var showName,id;
    var layer_list = function(showName,id){
      $scope.equipmentAdd_ifeame_hide = false;
      layer.open({
        type: 1,
        title: [showName +'设备',"height:48px;font-size:14px;color:#4d5254;background:#dce2e9;line-height:48px;"],
        shadeClose: true,
        shade:0.1,
        offset:['10%','30%'],
        area : ['540px' , '420px'],
        content:mydome,
        btn:"确认",
        yes:function(index,layero){
          if($scope.formClick()){
            $http({
              url:$rootScope.rootUrl + "device",
              method:"POST",
              params:{
                id:id,
                pvgName : $scope.pvgForm.pvgName,
                pvgIp : $scope.pvgForm.pvgIp,
                pvgPort : $scope.pvgForm.pvgPort,
                userName : $scope.pvgForm.userName,
                password : $scope.pvgForm.password
              }
            }).success(function(data,header,config,status){
              layer.close(index);
              pvg_list();
            });
          }else{
            return false;
          };
        }
      });
    }
    //新增设备
    $scope.equipment_Add = function(){
      demo.resetForm();
      showName = "新增";
      layer_list(showName);
      //layer.msg('保存成功！',{icon: 1,});
    };
    //编辑设备
    $scope.equipment_editor = function($index){
      var id = $scope.pvgList[$index].id;
      var _pvgInfo = $scope.pvgList[$index];
      $scope.pvgForm = {
        pvgName: _pvgInfo.pvgName,
        pvgIp: _pvgInfo.pvgIp,
        pvgPort: _pvgInfo.pvgPort,
        userName: _pvgInfo.userName,
        password: _pvgInfo.password
      };
      showName = "编辑";
      layer_list(showName,id);
    };
    //删除
    $scope.delete = function($index){
      var id = $scope.pvgList[$index].id;
      layer.confirm('确认删除该版本所有相关的数据?', {
          icon : 0,
          title : ['删除提示',"height:32px;font-size:14px;color:#ebebed;background:#acaeb5;line-height:32px;"],
          area : ['300px' , '160px'],
          btn : [ '确认', '取消' ]
      },function(index) {
          layer.close(index);
          $http({
            url : $rootScope.rootUrl + "device/"+id,
            method : "DELETE"
          }).success(function(data,header,config,status){
            layer.msg('删除成功！',{icon: 1,});
            pvg_list();
          })
      });
    };
    //同步
    $scope.sync = function($index){
      var pvgId = $scope.pvgList[$index].id;
      $scope.sync_page_hide = false;
      var setting = {
  			async: {
  				enable: true,
  				type: "get",
  				url: $rootScope.rootUrl + "org/tree/"+pvgId,
  				autoParam: ["id=parentId"],
  			},
  			check: {
  				enable: true,
          nocheckInherit: true,
  				chkStyle: "checkbox",
  				//chkboxType: { "Y": "p", "N": "s" }
  			},
  			data: {
  				key: {
            checked: "isChecked",
  					children: "nodes"
  				},
  				simpleData: {
  					enable: true
  				}
  			},
        callback: {
          onAsyncSuccess: zTreeOnAsyncSuccess,
      		onCheck: onCheck
      	},
        view: {
      		addDiyDom: addDiyDom
      	}
  		};
      function addDiyDom(treeId, treeNode) {
        var SameData;
        if(treeNode.isSameData){
          SameData = "数据一致";
          $("#diyBtn_"+treeNode.id).css({'color':'#00a0e9'});
        }else{
          SameData = "数据变更";
          $("diyBtn_space_181"+treeNode.id).css({'color':'red'});
          if(!treeNode.isParent){
            SameData = "待同步";
            $("#diyBtn_"+treeNode.id).css({'color':'#000'});
          };
        };
      	var aObj = $("#" + treeNode.tId + "_a");
      	if ($("#diyBtn_"+treeNode.id).length>0) return;
      	var editStr = "<span class='dataMargin' id='diyBtn_space_" +treeNode.id+ "' >"+SameData+"</span>";
      	aObj.append(editStr);
      	//var btn = $("#diyBtn_"+treeNode.id);
      };
      //加载成功时，默认展开一级子节点
      function zTreeOnAsyncSuccess(event, treeId, treeNode, msg) {
        // var json_data = JSON.parse(msg);
        // for(var i=0;i<json_data.length;i++){
        //   if(json_data[i].isSameData){;
        //     $("#diyBtn_"+json_data[i].id).bind("change",function(){
        //       $("#diyBtn_"+json_data[i].id).css({'color':'#00a0e9'});
        //     });
        //   };
        // };
        var oneId = JSON.parse(msg)[0].name;
        var treeObj=$.fn.zTree.getZTreeObj("treeDemo");
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
      var nodeCheckArr = [];
  		function onCheck(e,treeId,treeNode){
        nodeCheckArr = [];
        var treeObj=$.fn.zTree.getZTreeObj("treeDemo"),
            nodes = treeObj.getChangeCheckedNodes();
  			for (var i=0, l=nodes.length; i<l; i++) {
          //只要全部勾选的id
  				if(!nodes[i].getCheckStatus().half){
            nodeCheckArr.push(nodes[i].id);
          };
          console.log(nodeCheckArr)
  			};
      };
  		$(document).ready(function(){
  			$.fn.zTree.init($("#treeDemo"), setting);
  		});
      layer.open({
        type: 1,
        title: ['通道同步',"height:48px;font-size:14px;color:#4d5254;background:#dce2e9;line-height:48px;"],
        shadeClose: true,
        shade:0.1,
        offset:['10%','30%'],
        area : ['540px' , '420px'],
        content:mydome1,
        btn:"确认",
        yes:function(index,layero){
          //将勾选的结构传递给服务器
          $http({
            url:$rootScope.rootUrl + "device/sync/" + pvgId,
            method:"POST",
            params: {
              orgIds :nodeCheckArr
            }
          }).success(function(data,header,config,status){
            $(".step_tips").slideDown();
            $timeout(function () {
                $(".step_tips").slideUp();
            }, 1000);
            layer.close(index);
          });
          layer.close(index);
        }
      });
    };


})
