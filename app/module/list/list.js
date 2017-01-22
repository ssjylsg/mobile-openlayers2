angular.module("list",[
    "ui.router",
                      // "equipment",
                      // "transcoding",
                      // "screenPublish",
                      "map",
                      //'3dMap'
                      //"user"
                    ])
.config(["$stateProvider", "$urlRouterProvider", function ($stateProvider, $urlRouterProvider) {
    $stateProvider
    // .state("list.equipment",{
    //     url:"/equipment",
    //     templateUrl:"module/equipment/equipment.html",
    //     controller:"equipmentCon"
    // })
    // .state("list.transcoding",{
    //     url:"/transcoding",
    //     templateUrl:"module/transcoding/view/transcoding.html",
    //     controller:"transcodingCon"
    // })
    // .state("list.screenPublish",{
    //     url:"/screenPublish",
    //     templateUrl:"module/screenPublish/screenPublish.html",
    //     controller:"screenPublishCon"
    // })
    .state("list.map",{
        url:"/map",
        templateUrl:"module/map/map.html",
        controller:"mapCon"
    })
    //  .state("list.3dMap",{
    //     url:"/3dMap",
    //     templateUrl:"module/3dMap/map.html",
    //     controller:"map"
    // })
    // .state("list.user",{
    //     url:"/user",
    //     templateUrl:"module/user/view/user.html",
    //     controller:"userCon"
    // })

}])
.controller("listCon",function($scope,$http,$state,$rootScope){
    //接收参数
    $scope.$on('to-parent',function(d,data){
      $rootScope.rooTabColor = data;
    });
    //变换tab
    $rootScope.rooTabColor = "equip";
    $scope.changeTab = function(tab){
      $rootScope.rooTabColor = tab;
    };
    //从本地取用户名
    $scope.login_name =  JSON.parse(sessionStorage.getItem("currentUser")).userName;
    //退出按钮
    $scope.login_backed = function(){
      window.sessionStorage.clear();
      $state.go("login");
    };
    //websocket
    $('#websocket_module').hide();
    var webSocket = null;
    // 判断当前浏览器是否支持webSocket
    if ('WebSocket' in window) {
        webSocket = new WebSocket("ws://192.168.60.40:8090/mvs/webSocket");
    } else {
        alert("当前浏览器不支持WebSocket！");
    };
    // 连接成功建立的回调方法
    webSocket.onopen = function(event) {
        //console.log("webSocket 建立连接成功！");
    };

    // 接收到消息的回调方法
    webSocket.onmessage = function(event) {
        console.log("接收到消息：" + event.data);
        $('#websocket_module').show();
        $(".tips_content").text(event.data)

    };
    $scope.close_button = function(){
      $('#websocket_module').hide();
      // 连接关闭的回调方法
      webSocket.onclose = function() {
          console.log("webSocket 连接关闭！");
      };
    };
    // 监听窗口关闭事件，当窗口关闭时，主动关闭webSocket连接
    window.onbeforeunload = function() {
        webSocket.close();
    };
})
