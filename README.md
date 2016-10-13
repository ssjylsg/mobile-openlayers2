## 概述
NPMobile 是一个JavaScript 库用于在Web浏览器创建 3D 地球和 2D NPMAP3D 使用 WebGL 来进行硬件加速图形化；跨平台；跨浏览器；实现真正的动态数据进行可视化。
### 1. 第一章 hello World  
使用本套类库创建第一个应用,加载地图配置 
```js
var json = {
    "mapOpts": {
        "minZoom": 6,
        "defaultZoom": 11,
        "maxZoom": 18,
        "centerPoint": [116.37949, 39.87198],
        "projection": "EPSG:900913"
    },
    "vectorLayer": [{
        "layerName": "shanghaiBaseMap1",
        "layerType": "NPMapLib.Layers.BaiduTileLayer",
        "layerOpt": {
            "url": ["http://online1.map.bdimg.com/tile/?qt=tile&x=${x}&y=${y}&z=${z}&styles=pl&udt=20150605&scaler=1", "http://online2.map.bdimg.com/tile/?qt=tile&x=${x}&y=${y}&z=${z}&styles=pl&udt=20150605&scaler=1", "http://online3.map.bdimg.com/tile/?qt=tile&x=${x}&y=${y}&z=${z}&styles=pl&udt=20150605&scaler=1"],
            "isBaseLayer": true,
            "mapTyp": "EMap"
        }
    }],
    "sattilateLayer": []
};
var map = new NPMobile.Map(viewerContainer, json);
// 注册地图click 事件
map.register('click', function(f) {
    console.log(f)
})

```

----

### 2. 第二章 申明自定义图层
初始化图层

```js
var layer = new NPMobile.Layers.CustomerLayer('自定义图层');
map.addLayer(layer);
```


----
### 3. 第三章 加载Marker 并注册事件
新增Marker 

```js
marker = new NPMobile.Geometry.Marker(map.getCenter(), {
    graphicWidth: 21,
    graphicHeight: 25,
    graphicXOffset: 0,
    graphicYOffset: 0,
    externalGraphic: 'img/marker.png',
    graphicZIndex: 0
    });
marker.register('click', function(argument) {
    window.alert('hellow');
});
layer.addOverlay(marker);
```
----
### 4. 第四章 申明聚合图层
申明图层 

```js
var clusterLayer = new NPMobile.Layers.ClusterLayer('聚合', {
    selectZoom: map.getMaxZoom(),
    maxZoom: map.getMaxZoom(),
    distance: 200,
    clusterClickModel: 'zoom',
    defaultStyle: {
        fontColor: 'white',
        customLabelOffset: {
            height: 10
        }
    }
});

clusterLayer.register('getUrl', function() {
    return 'img/Flag.png'
});
clusterLayer.register('getImageSize', function() {
    return {
        width: 32,
        height: 32
    }
});
clusterLayer.register('getContent', function() {
    return '';
});

map.addLayer(clusterLayer);
```
---
### 5. 第五章 申明聚合Marker
申明聚合Marker
```js
var c = map.getCenter();
for (var i = 0; i < 100; i++) {
    markers.push(new NPMobile.Geometry.ClusterMarker(new NPMobile.Geometry.Point(c.lon + Math.random() * Math.pow(-1, i) * 0.1, c.lat + Math.random() * Math.pow(-1, i + 1) * 0.1)));
}
clusterLayer.addOverlays(markers);


```