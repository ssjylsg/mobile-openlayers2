"use strict";

angular.module("screenPublish",["ui.router"])
.controller("screenPublishCon",function($scope,$http,$state,$rootScope){
    //给父级传值
    $scope.$emit('to-parent', 'screen');
    var mainHeight = $(window).height()-60-32;
    $(".screenPublish").height(mainHeight);
    $(".screenTree").height(mainHeight-50);
    $("#screenMap").height(mainHeight-50);
    $("#map_tree").height(mainHeight-50-120);
    //生成地图
    $http({
        url: "../../js/lib/map/mapConfig.json",
        method: 'GET',
    }).success(function(data, header, config, status){
      var mapContainer = document.getElementById('screenMap');
      var mapConfig = new MapPlatForm.Base.MapConfig();
      $rootScope.resultJson = mapConfig.createMap(mapContainer, data);
      $scope.map = $rootScope.resultJson.map;
      //比例尺控件
      var ctrl = new NPMapLib.Controls.ScaleControl();
      $scope.map.addControl(ctrl);
      //鹰眼控件
      var ctrl = new NPMapLib.Controls.OverviewControl();
      $scope.map.addControl(ctrl);
      ctrl.changeView(true);
      //缩放时鼠标动画效果控件
      var zoomAnimation = new NPMapLib.Controls.zoomAnimationControl();
      $scope.map.addControl(zoomAnimation);
      //导航控件
      var ctrl = new NPMapLib.Controls.NavigationControl({
          navigationType:"xxx",
          xy:{
              x: 4,
              y: 10
          }
      });
      $scope.map.addControl(ctrl);
    });
    //生成树结构
    var $marker,position;
    var infoWindow = null;
    var setting = {
      async: {
        enable: true,
        type: "get",
        url: $rootScope.rootUrl + "org/getOrgInfoById",
        autoParam: ["id=parentId"],
      },
      callback: {
        onAsyncSuccess: zTreeOnAsyncSuccess
  			//onClick: onClick
      }
    };
    //加载成功时，
    function zTreeOnAsyncSuccess(event, treeId, treeNode, msg) {
      var oneId = JSON.parse(msg)[0].name;
      var treeObj=$.fn.zTree.getZTreeObj("map_tree");
      //默认展开一级子节点
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

         };
       }
       //渲染全部点位
      var MapGeometry = new MapPlatForm.Base.MapGeometry($scope.map);
      var markerParam = {
          url: "../../images/step.png", //图片路径
          size: { //[图片大小]
              width: 32,
              height: 32
          },
          markerType: 1 //以中心点为中心0，以底部为中心1,自定义位置2，根据iconOffset设置中心点
      };
      $http({
          url: $rootScope.rootUrl + "gps/testmark",
          method: 'GET',
      }).success(function(data, header, config, status){
        var points = [];
        for(var i= 0;i<data.length;i++){
          //点位聚合
          var p = new NPMapLib.Symbols.ClusterMarker({
              lon: data[i].longitude,
              lat: data[i].latitude
          }, {
              markType: i % 2 == 0 ? '偶数' : '奇数'
          });
          points.push(p);
        };
        var clusterPoints = new NPMapLib.Symbols.ClusterPoints(points, {
            threshold: 1
        });
        var overlay;
        var opt = {
            getUrl: function(count, p) {
                if (count) {
                    return "../../images/cluster_marker_bg.png";
                } else {
                    return "../../images/step.png";
                }

            },
            getImageSize: function(count, p) {
                if (count) {
                    return {
                        width: 30,
                        height: 30
                    };
                } else {
                    return {
                        width: 30,
                        height: 30
                    };
                }
            },
            clusterClickModel: 'zoom',
            click: function(f) {
                console.log(f);
            },

            getBackGroundColor: function(data) {
                return "red";
            },
            getCustomLabelOffset: function() {
                return {
                    width: 10,
                    height: 20
                }
            },
            mouseover: function(f) {
                //console.log(f.getData());
                //overlayLayer.addClusterPoints(f);
            },
            mouseout: function(f) {
                // console.log(f.getData());
            },
            clusteronmouseover: function(m) {
                if(m.cluster.length<200){
                    overlayLayer.addClusterPoints(m);
                }
            },
            fontColor: 'white',
            distance: 200,
            maxZoom: 16
        };
        // 聚合图层 为点击聚合点位时 进行撒点
        var overlayLayer = new NPMapLib.Layers.OverlayLayer('聚合图层', true, opt);
        $scope.map.addLayer(overlayLayer);

        overlayLayer.addOverlay(clusterPoints, function() {
          //console.log('异步执行完毕');
        });
      });


    };


    // function onClick(e,treeId,treeNode){
    //   //地图标注
    //   var mapTag = new MapPlatForm.Base.MapTag($scope.map);
    //   var MapGeometry = new MapPlatForm.Base.MapGeometry($scope.map);
    //   var markerParam = {
    //       url: "../../images/step.png", //图片路径
    //       size: { //[图片大小]
    //          width: 32,
    //          height: 32
    //       },
    //       markerType: 1 //以中心点为中心0，以底部为中心1,自定义位置2，根据iconOffset设置中心点
    //   };
    //   if($marker){
    //     $scope.map.removeOverlay($marker);
    //     infoWindow && (infoWindow.hide());
    //   };
    //   if(!treeNode.isParent){
    //     //添加标注
    //     $("#title").text(treeNode.name);
    //     var offset = new NPMapLib.Geometry.Size(-200, -280);
    //     //判断是否标注
    //     var position,posPixel;
    //     if(treeNode.longitude && treeNode.latitude){
    //       //存在经纬度
    //       $("#test").show();
    //       $("#longitude").val(treeNode.longitude);
    //       $("#latitude").val(treeNode.latitude);
    //       position= new NPMapLib.Geometry.Point(treeNode.longitude,treeNode.latitude);
    //       if(!infoWindow){
    //         infoWindow = new NPMapLib.Symbols.InfoWindow(position, "", $("#test")[0], {
    //             width: 395, //信息窗宽度，单位像素
    //             height: 240, //信息窗高度，单位像素
    //             offset: offset, //信息窗位置偏移值
    //             iscommon: true, //是否为普通窗体（不带箭头）
    //             enableCloseOnClick: false, //移动地图，不关闭信息窗口。
    //             //paddingForPopups: paddingForPopups, //信息窗自动弹回后，距离四边的值。isAdaptation为true时，该设置有效。
    //             isAnimationOpen: false, //信息窗打开时，地图是否平滑移动，默认不平滑移动。
    //             isAdaptation: false, //信息窗位置是否自适应，默认不自适应。
    //             positionBlock: {
    //                 offsetX: 130, //箭头X偏移量,默认在中间
    //                 imageSrc: '../../js/lib/map/Netposa/img/iw_tail.png',
    //                 imageSize: {
    //                     width: 16,
    //                     height: 12
    //                 }
    //             }
    //         });
    //         $scope.map.addOverlay(infoWindow);
    //         infoWindow.open(null,false);
    //       }else{
    //         infoWindow.setPosition(position);
    //       };
    //       infoWindow.show();
    //       $marker = MapGeometry.createMarker(position, markerParam);
    //       $scope.map.addOverlay($marker);
    //       //拖拽
    //       $marker.enableEditing();
    //       $marker.addEventListener("draging", function(newmarker) {
    //         var postion = newmarker.getPosition();
    //         infoWindow.setPosition(postion);
    //         $("#longitude").val(postion.lon);
    //         $("#latitude").val(postion.lat);
    //       });
    //     }else{
    //       //不存在经纬度
    //       mapTag.adrawMarker(markerParam,function(marker){
    //         $("#test").show();
    //         $marker = marker;
    //         var postion = marker.getPosition();
    //         $("#longitude").val(postion.lon);
    //         $("#latitude").val(postion.lat);
    //         infoWindow = infoWindow ||  new NPMapLib.Symbols.InfoWindow(position, "", $("#test")[0], {
    //             width: 395, //信息窗宽度，单位像素
    //             height: 240, //信息窗高度，单位像素
    //             offset: offset, //信息窗位置偏移值
    //             iscommon: true, //是否为普通窗体（不带箭头）
    //             enableCloseOnClick: false, //移动地图，不关闭信息窗口。
    //             //paddingForPopups: paddingForPopups, //信息窗自动弹回后，距离四边的值。isAdaptation为true时，该设置有效。
    //             isAnimationOpen: false, //信息窗打开时，地图是否平滑移动，默认不平滑移动。
    //             isAdaptation: false, //信息窗位置是否自适应，默认不自适应。
    //             positionBlock: {
    //                 offsetX: 130, //箭头X偏移量,默认在中间
    //                 imageSrc: '../../js/lib/map/Netposa/img/iw_tail.png',
    //                 imageSize: {
    //                     width: 16,
    //                     height: 12
    //                 }
    //             }
    //         });
    //         infoWindow.setPosition(postion);
    //         $scope.map.addOverlay(infoWindow);
    //         infoWindow.open(null,false);
    //         //拖拽
    //         $marker.addEventListener("draging", function(newmarker) {
    //           var postion = newmarker.getPosition();
    //           infoWindow.setPosition(postion);
    //             $("#longitude").val(postion.lon);
    //             $("#latitude").val(postion.lat);
    //         });
    //       });
    //     };
    //     //取消标注
    //     $scope.foot_button_cancle = function(){
    //       if (infoWindow) {
    //          $scope.map.removeOverlay($marker);
    //          mapTag.delAdrawMarker();
    //          infoWindow.hide();
    //          infoWindow = null;
    //          $("#test").hide();
    //       };
    //     };
    //
    //
    //   };
    //
    //   //保存标注
    //   $scope.foot_button_hold = function(){
    //     $http({
    //         url: $rootScope.rootUrl + "gps/save",
    //         method: 'POST',
    //         params: {
    //           id: treeNode.id,
    //           longitude: $("#longitude").val(),
    //           latitude: $("#latitude").val()
    //         }
    //     }).success(function(data, header, config, status){
    //       alert("保存成功")
    //       $scope.map.removeOverlay($marker);
    //       infoWindow.hide();
    //       $("#test").hide();
    //       $.fn.zTree.init($("#map_tree"), setting);
    //     });
    //   };
    //
    //
    // };
    $(document).ready(function(){
      $.fn.zTree.init($("#map_tree"), setting);
    });








    //监听离开当前的路由 则销毁map对象
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
      if(toState.name != "list.screenPublish"){
        $rootScope.resultJson.map.destroyMap();
      };
    });

});
