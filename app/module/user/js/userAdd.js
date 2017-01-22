angular.module("userAdd",["ui.router"])
.controller("userAddCon",function($scope,$state,$http,$rootScope,$stateParams){
    //表单验证
    var demo = $(".userAdd").Validform({
      tiptype : 4,
      ajaxPost : true
    });
//密码强度的验证
    //判断输入密码的类型
    function CharMode(iN){
      if (iN>=48 && iN <=57) //数字
      return 1;
      if (iN>=65 && iN <=90) //大写
      return 2;
      if (iN>=97 && iN <=122) //小写
      return 4;
      else
      return 8;
    };
    //计算密码模式
    function bitTotal(num){
      modes=0;
      for (i=0;i<4;i++){
      if (num & 1) modes++;
      num>>>=1;
      }
      return modes;
    };
    //返回强度级别
    function checkStrong(sPW){
      if (sPW.length<=4)
      $("#password_text").text("2222")
      return 0; //密码太短
      Modes=0;
      for (i=0;i<sPW.length;i++){
      //密码模式
      Modes|=CharMode(sPW.charCodeAt(i));
      }
      return bitTotal(Modes);
    };
    //返回强度级别
    function checkStrong(sPW){
    if (sPW.length<=4)

    return 0; //密码太短
    Modes=0;
    for (i=0;i<sPW.length;i++){
    //密码模式
    Modes|=CharMode(sPW.charCodeAt(i));
    }
    return bitTotal(Modes);
    }
    $scope.keyup = function(){
      O_color="#e5e5e5";
      L_color="#f29317";
      M_color="#f68235";
      H_color="#18af51";
      console.log($scope.password)
      if ($scope.password==null||$scope.password==''){
        Lcolor=Mcolor=Hcolor=O_color;
      }
      else{
        S_level=checkStrong($scope.password);
        switch(S_level) {
        case 0:
        Lcolor=Mcolor=Hcolor=O_color;
        case 1:
        Lcolor=L_color;
        Mcolor=Hcolor=O_color;
        break;
        case 2:
        Lcolor=Mcolor=M_color;
        Hcolor=O_color;
        break;
        default:
        //Lcolor=Hcolor=H_color;
        Hcolor=H_color;
        }
      };
      document.getElementById("strength_L").style.background=Lcolor;
      document.getElementById("strength_M").style.background=Mcolor;
      document.getElementById("strength_H").style.background=Hcolor;
      return;
    };
    //获取下拉的用户组
    $scope.load = function(){
      $http({
        url:$rootScope.rootUrl + "roles/getRole",
        method:"GET"
      }).success(function(data,header,config,status){
        $scope.sites = data.RoleList;
      });
    };

    //编辑页面的已有信息
    var userId = $stateParams.userId;
    if(userId){
      $http({
        url:$rootScope.rootUrl + "user/view?id="+userId,
        method:"GET"
      }).success(function(data,header,config,status){
        $scope.longinName = data.data.loginName;
        $scope.password = data.data.password;
        $scope.userName = data.data.userName;
        $scope.mobile = data.data.mobile;
        $scope.email = data.data.email;
        $scope.imei = data.data.imei;
        var _id = data.data.roleId;
        $http({
          url:$rootScope.rootUrl + "roles/getRole",
          method:"GET"
        }).success(function(data,header,config,status){
          $scope.sites = data.RoleList;
          for(var i = 0;i < $scope.sites.length;i++){
            if($scope.sites[i].id ==_id){
              $scope.selectedSite = $scope.sites[i];
            };
          };
        });
      });

    };


    //点击确认添加
    $scope.userHold = function(){
      //重置表单到初始状态
      demo.resetForm();
      if(demo.check()){
        $http({
          url:$rootScope.rootUrl + "user/save",
          method:"POST",
          params:{
            id:userId,
            longinName:$scope.longinName,
            password:$scope.password,
            userName:$scope.userName,
            mobile:$scope.mobile,
            email:$scope.email,
            imei :$scope.imei,
            roleId:$scope.selectedSite.id
          }
        }).success(function(data,header,config,status){
            if(data.code == 200){
                $state.go("list.user.userList")
            };
        });
      }else{
          return false;
      };
    };

    //取消
    $scope.loadHold = function(){
      $state.go("list.user.userList")
    };


})
