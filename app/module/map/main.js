"use strict";

angular.module("map", ["ui.router"])
	.controller("mapCon", function($scope, $http, $state, $rootScope) {
		//给父级传值
		$scope.$emit('to-parent', 'map');
		var mainHeight = $(window).height() - 60 - 32;
		$(".map").height(mainHeight);
		$(".mapTree").height(mainHeight - 50);
		$("#mapRight").height(mainHeight - 50);
		$("#map_tree").height(mainHeight - 50 - 120);

		//生成地图
		$http({
			url: "js/lib/map/mapConfig.json",
			method: 'GET',
		}).success(function(data, header, config, status) {
			var mapContainer = document.getElementById('mapRight');
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
				navigationType: "xxx",
				xy: {
					x: 4,
					y: 10
				}
			});
			$scope.map.addControl(ctrl);
		});
		//生成树结构
		var setting = {
			async: {
				enable: true,
				type: "get",
				url: $rootScope.rootUrl + "org/getOrgInfoById",
				autoParam: ["id=parentId"],
			},
			callback: {
				onAsyncSuccess: zTreeOnAsyncSuccess,
				onClick: onClick
			}
		};
		//加载成功时，默认展开一级子节点
		function zTreeOnAsyncSuccess(event, treeId, treeNode, msg) {
			var oneId = JSON.parse(msg)[0].name;
			var treeObj = $.fn.zTree.getZTreeObj("map_tree");
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
		var $marker;
		var infoWindow = null;

		function onClick(e, treeId, treeNode) {
			//地图标注
			var mapTag = new MapPlatForm.Base.MapTag($scope.map);
			var MapGeometry = new MapPlatForm.Base.MapGeometry($scope.map);
			var markerParam = {
				url: "images/step.png", //图片路径
				size: { //[图片大小]
					width: 32,
					height: 32
				},
				markerType: 1 //以中心点为中心0，以底部为中心1,自定义位置2，根据iconOffset设置中心点
			};
			if ($marker) {
				$scope.map.removeOverlay($marker);
				infoWindow && (infoWindow.hide());
			};
			if (!treeNode.isParent) {
				//添加标注
				$("#title").text(treeNode.name);
				var offset = new NPMapLib.Geometry.Size(-200, -280);
				//判断是否标注
				var position, posPixel;
				if (treeNode.longitude && treeNode.latitude) {

					//存在经纬度
					$("#test").show();
					$("#longitude").val(treeNode.longitude);
					$("#latitude").val(treeNode.latitude);
					position = new NPMapLib.Geometry.Point(treeNode.longitude, treeNode.latitude);
					if (!infoWindow) {
						infoWindow = new NPMapLib.Symbols.InfoWindow(position, "", $("#test")[0], {
							width: 395, //信息窗宽度，单位像素
							height: 240, //信息窗高度，单位像素
							offset: offset, //信息窗位置偏移值
							iscommon: true, //是否为普通窗体（不带箭头）
							enableCloseOnClick: false, //移动地图，不关闭信息窗口。
							//paddingForPopups: paddingForPopups, //信息窗自动弹回后，距离四边的值。isAdaptation为true时，该设置有效。
							isAnimationOpen: false, //信息窗打开时，地图是否平滑移动，默认不平滑移动。
							isAdaptation: false, //信息窗位置是否自适应，默认不自适应。
							positionBlock: {
								offsetX: 130, //箭头X偏移量,默认在中间
								imageSrc: 'js/lib/map/Netposa/img/iw_tail.png',
								imageSize: {
									width: 16,
									height: 12
								}
							}
						});
						$scope.map.addOverlay(infoWindow);
						infoWindow.open(null, false);
					} else {
						infoWindow.setPosition(position);
					};
					infoWindow.show();
					$marker = MapGeometry.createMarker(position, markerParam);
					$scope.map.addOverlay($marker);
					//设置地图中心点
					$scope.map.setCenter(position)
						//拖拽
					$marker.enableEditing();
					$marker.addEventListener("draging", function(newmarker) {
						var postion = newmarker.getPosition();
						infoWindow.setPosition(postion);
						$("#longitude").val(postion.lon);
						$("#latitude").val(postion.lat);
					});
				} else {
					//不存在经纬度
					mapTag.adrawMarker(markerParam, function(marker) {
						$("#test").show();
						$marker = marker;
						var postion = marker.getPosition();
						$("#longitude").val(postion.lon);
						$("#latitude").val(postion.lat);
						infoWindow = infoWindow || new NPMapLib.Symbols.InfoWindow(position, "", $("#test")[0], {
							width: 395, //信息窗宽度，单位像素
							height: 240, //信息窗高度，单位像素
							offset: offset, //信息窗位置偏移值
							iscommon: true, //是否为普通窗体（不带箭头）
							enableCloseOnClick: false, //移动地图，不关闭信息窗口。
							//paddingForPopups: paddingForPopups, //信息窗自动弹回后，距离四边的值。isAdaptation为true时，该设置有效。
							isAnimationOpen: false, //信息窗打开时，地图是否平滑移动，默认不平滑移动。
							isAdaptation: false, //信息窗位置是否自适应，默认不自适应。
							positionBlock: {
								offsetX: 130, //箭头X偏移量,默认在中间
								imageSrc: '../../js/lib/map/Netposa/img/iw_tail.png',
								imageSize: {
									width: 16,
									height: 12
								}
							}
						});
						infoWindow.setPosition(postion);
						$scope.map.addOverlay(infoWindow);
						infoWindow.open(null, false);
						//拖拽
						$marker.addEventListener("draging", function(newmarker) {
							var postion = newmarker.getPosition();
							infoWindow.setPosition(postion);
							$("#longitude").val(postion.lon);
							$("#latitude").val(postion.lat);
						});
					});
				};
				//取消标注
				$scope.foot_button_cancle = function() {
					if (infoWindow) {
						$scope.map.removeOverlay($marker);
						mapTag.delAdrawMarker();
						infoWindow.hide();
						infoWindow = null;
						$("#test").hide();
					};
				};


			};

			//保存标注
			$scope.foot_button_hold = function() {
				$http({
					url: $rootScope.rootUrl + "gps/save",
					method: 'POST',
					params: {
						id: treeNode.id,
						longitude: $("#longitude").val(),
						latitude: $("#latitude").val()
					}
				}).success(function(data, header, config, status) {
					alert("保存成功")
					$scope.map.removeOverlay($marker);
					infoWindow.hide();
					$("#test").hide();
					$.fn.zTree.init($("#map_tree"), setting);
				});
			};


		};
		$(document).ready(function() {
			$.fn.zTree.init($("#map_tree"), setting);
		});



		//监听离开当前的路由 则销毁map对象
		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			if (toState.name != "list.map") {
				$rootScope.resultJson.map.destroyMap();
			};
		});
		//导入模块初始化
		$scope.import_module_hide = true;
		//点击批量导入
		$scope.ImportButton = function() {
			$scope.import_module_hide = false;
			//导出模板
			$scope.export_module_but = function() {
				window.open($rootScope.rootUrl + "gps/export");
			};
			//上传
			$scope.export_text = "请浏览选择您要导入的Excel表格";
			$scope.uploadFile = function(target) {
				$scope.$apply(function() {
					var filePath = target.value;
					//这是文件的名字
					var del = filePath.substring(filePath.lastIndexOf("\\") + 1);
					var suffix = del.split(".");
					$scope.export_text = suffix[0];
				});
			};
			$scope.publish_button = function() {
				var formData = new FormData(document.getElementById("uploadForm"));
				formData.append("X-Validation-Token", sessionStorage.getItem('x-session-token'));
				formData.append("userid", "1");

				var xhr = new XMLHttpRequest();
				xhr.open("post", $rootScope.rootUrl + "gps/import", true);
				xhr.send(formData);
				xhr.onload = function() {
					console.log(xhr.responseText)
						// var json = JSON.parse(xhr.responseText);
						// if (json.code == 200) {
						// 	layer.msg('操作完成！', {
						// 		icon : 1
						// 	});
						// } else if(json.code == 300){
						// 	layer.msg(json.info, {
						// 		icon : 5
						//   });
						// }
				};
			};

		};


		//点击关闭按钮
		$scope.clickButton = function() {
			$scope.import_module_hide = true;
		};
	})
	// .run(function($scope,$rootScope){
	//
	// })