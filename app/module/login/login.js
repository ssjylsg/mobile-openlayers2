angular.module("login", ["ui.router"])
    .controller('loginCon', function($scope, $http, $state, $rootScope) {
        var height = $(window).height();
        $(".login").height(height);
        $scope.goList = function() {
            $state.go("list.equipment")
        };
        //点击登录
        $scope.goList = function() {

            var data = {
              currentUser:'admin'
            };
            sessionStorage.setItem("currentUser", JSON.stringify(data));
            $state.go("list.map");
            return;

            if ($scope.passWord && $scope.userName) {
                $http({
                    url: $rootScope.rootUrl + "user/login",
                    method: 'POST',
                    params: {
                        loginName: $scope.userName,
                        password: $scope.passWord
                    }
                }).success(function(data, header, config, status) {
                    console.log(data)
                        //响应成功
                    sessionStorage.setItem("currentUser", JSON.stringify(data));
                    $state.go("list.equipment");
                }).error(function(data, header, config, status) {
                    //处理响应失败
                    $(".loginTips").show();
                });
            } else {
                return false;
            };
        };
        //回车登录
        $scope.myKeyup = function(e) {
            var keycode = window.event ? e.keyCode : e.which;
            if (keycode == 13) {
                $scope.goList();
            }
        };











        //关于
        var mydome = $(".about_layer");
        $scope.about_layer = true;
        layer.config({
            skin: 'demo-class'
        });
        $scope.about = function() {
            $scope.about_layer = false;
            layer.open({
                type: 1,
                title: ['关于', "height:48px;font-size:14px;color:#00a0e9;background:#f8f9fa;line-height:48px;"],
                shadeClose: false,
                shade: 0.1,
                offset: ['15%', '30%'],
                area: ['656px', '416px'],
                content: mydome,



            });
        };
    })
