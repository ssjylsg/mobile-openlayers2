window.NPMobile = {
    ISPOINTCONVERT: true,
    VERSION: '1.0.0',
    inherits: function(childCtor, parentCtor) {
        var p = parentCtor.prototype;
        var c = childCtor.prototype;
        for (var i in p) {
            c[i] = p[i];
        }
        c.uber = p;
        childCtor.prototype.constructor = childCtor;
    }
};
NPMobile.Geometry = {};
NPMobile.Util = {};
NPMobile.Util.clone = function(from, to) {
    if (from == null || typeof from != "object") return from;
    if (from.constructor != Object && from.constructor != Array) {
        return from;
    }
    if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
        from.constructor == String || from.constructor == Number || from.constructor == Boolean) {
        return new from.constructor(from);
    }

    to = to || new from.constructor();

    for (var name in from) {
        to[name] = typeof to[name] == "undefined" ? NPMobile.Util.clone(from[name], null) : to[name];
    }

    return to;
};
NPMobile.Util.extend = function(target, options) {
    target = target || {};
    for (var key in options) {
        if (target[key] === undefined) {
            target[key] = NPMobile.Util.clone(options[key]);
        }
    }
    return target;
};
NPMobile.Layers = {
    LAYERID: 0
};

/**
 * 基础图层 抽象图层
 * @class  NPMobile.Layers.Layer
 * @constructor
 */
NPMobile.Layers.Layer = function(name) {
    this.id = null;
};
NPMobile.Layers.Layer.prototype = {
    /** 
     * 显示/隐藏图层
     * @param {Boolean}   display  
     */
    display: function(display) {
        this._layer.display(display);
    },
    getId: function() {
        return this.id;
    }
};
/**
 * 覆盖物抽象类
 * @class  NPMobile.Geometry.Curve
 * @constructor
 */
NPMobile.Geometry.Curve = function() {
    this._vector = null;
    this.id = null;
};
NPMobile.Geometry.Curve.prototype = {
    _castPoints: function(points) {
        if (!points) {
            return [];
        }
        var result = [],
            point;
        for (var i = 0; i < points.length; ++i) {
            point = points[i];
            result.push(new OpenLayers.Geometry.Point(point.lon, point.lat));
        }
        return result;
    },
    /**
     * 刷新      
     */
    refresh: function() {
        var layer = this._vector.layer;
        if (layer) {
            layer.drawFeature(this._vector);
        }
    },
    /**
     * 显示     
     */
    show: function() {
        this._vector.style.display = 'block';
        this.refresh();
    },
    /**
     * 隐藏     
     */
    hide: function() {
        this._vector.style.display = 'none';
        this.refresh();
    },
    /**
     * 注册事件
     * @event
     * @param  {string} type     事件类型 click 
     * @param  {functon} listener      
     */
    register: function(type, listener) {
        this._vector["_" + type] = listener;
    },
    /**
     * 注销事件
     * @event
     * @param  {string} type     事件类型 click     
     */
    unregister: function(type) {
        this._vector["_" + type] = null;
    },
    /**
     * 获取当前覆盖物点集合     
     */
    getPoints: function() {
        if (!this._vector) {
            return [];
        }
        if (this._vector.geometry && (this._vector.geometry instanceof OpenLayers.Geometry.Point)) {
            return NPMobile.Geometry.Point.getPoint(this._vector.geometry.x, this._vector.geometry.y)
        }
        if (this._vector.geometry && (this._vector.geometry instanceof OpenLayers.Geometry.Polygon)) {
            var list = [];
            for (var j = 0; j < this._vector.geometry.components.length; j++) {
                var potins = this._vector.geometry.components[j].components;
                var result = [];
                for (var i = 0; i < potins.length; i++) {
                    result.push(NPMobile.Geometry.Point.getPoint(potins[i].x, potins[i].y));
                }
                list.push(result);
            }
            return list.length === 1 ? list[0] : list;
        }
        if (this._vector.geometry && (this._vector.geometry instanceof OpenLayers.Geometry.LineString)) {
            var points = this._vector.geometry.components;
            var lineResult = [];
            for (var i = 0; i < points.length; i++) {
                lineResult.push(NPMobile.Geometry.Point.getPoint(points[i].x, points[i].y));
            }
            return lineResult;
        }
    },
    /**
     * 获取长度     
     */
    getLength: function() {
        return this._vector.geometry.getLength();
    },
    /**
     * 获取面积   
     */
    getArea: function() {
        return this._vector.geometry.getArea();
    }
};
/**
 * 自定义图层
 * @class  NPMobile.Layers.CustomerLayer
 * @extends {NPMobile.Layers.Layer}
 * @constructor
 * @param {stirng} name 图层名称唯一
 */
NPMobile.Layers.CustomerLayer = function(name) {
    NPMobile.Layers.Layer.call(this, name);
    this._layer = new OpenLayers.Layer.Vector(name || "默认图层1", {
        rendererOptions: {
            zIndexing: true
        }
    });
    this._layer.events.register("featureclick", this, function(e) {
        if (e.feature._click) {
            e.feature._click.call(e.feature.data);
        }
    });
};
NPMobile.Layers.CustomerLayer.prototype = {
    /**
     * 添加覆盖物
     * @param {NPMobile.Geometry.Marker} overlay  
     */
    addOverlay: function(overlay) {
        this._layer.addFeatures(overlay._vector);
    },
    /**
     * 移除覆盖物
     * @param {NPMobile.Geometry.Marker} overlay      
     */
    removeOverlay: function(overlay) {
        this._layer.removeFeatures(overlay._vector, {
            silent: true
        });
    },
    /**
     * 清除所有覆盖物    
     */
    removeAllOverlays: function() {
        this._layer.removeAllFeatures();
    }
};
NPMobile.inherits(NPMobile.Layers.CustomerLayer, NPMobile.Layers.Layer);
/**
 * 聚合Marker
 * @class  NPMobile.Geometry.ClusterMarker
 * @constructor
 * @param {NPMobile.Geometry.Point}   point    坐标点
 * @param {string} showMarker 分类
 * @param {object} clientData 用户数据
 */
NPMobile.Geometry.ClusterMarker = function(point, showMarker, clientData) {
    this._point = point;
    this._clientData = clientData;
    this.showMarker = showMarker;
    this._visible = true;
    var tempPoint = NPMobile.T.setPoint(this._map, point);
    this.geometry = {
        x: tempPoint.lon,
        y: tempPoint.lat
    };
};

NPMobile.Geometry.ClusterMarker.prototype = {
    /**
     * 返回用户数据
     * @return {object} clientData 用户数据
     */
    getClientData: function() {
        return this._clientData;
    },
    getData: function() {
        var r = this._clientData || {};
        r._visible = this._visible;
        return r;
    },
    /**
     * 设置样式，比如换图片
     * @return {object} style
     * @param  {string}  style.externalGraphic  图片路径 
     * @param  {number}  style.graphicXOffset    X 偏移量
     * @param  {number}  style.graphicYOffset Y偏移量
     * @param  {number}  style.graphicWidth   图片宽度
     * @param  {number}  style.graphicHeight  图片高度 
     */
    changeStyle: function(style) {
        if (this._apiObj) {
            for (var k in style) {
                this._apiObj.style[k] = style[k];
            }
            this._apiObj.layer.drawFeature(this._apiObj);
        }
    }
};

/**
 * 聚合图层
 * @class NPMobile.Layers.ClusterLayer
 * @extends {NPMobile.Layers.Layer}
 * @constructor
 * @param {stirng} name 图层名称唯一
 * @param {object} opts
 * @param {string} opts.clusterClickModel 聚合点点击展开模式 默认 'zoom' 地图zoom 增加一级，其他为撒点
 * @param {number} opts.selectZoom 点击聚合点时，地图缩放到指定级别(只在clusterClickModel为'zoom'时起作用)
 * @param {number} opts.threshold 聚合点位少于threshold撒开
 * @param {number} opts.distance 聚合的像素距离
 * @param {number} opts.maxZoom 聚合图层时，达到zoom 聚合点全部展开
 * @param {number} opts.minZoom
 * @param {bool} opts.isAsynchronous 是否异步加载
 * @param {object} opts.defaultStyle
 * @param {string} opts.defaultStyle.fontColor 字体颜色
 * @param {string} opts.defaultStyle.fontSize 字体大小
 * @param {string} opts.defaultStyle.customLabelFontColor 自定义字体颜色
 * @param {object} opts.defaultStyle.customLabelOffset 字体偏移量
 * @param {number} opts.defaultStyle.customLabelOffset.height
 * @param {number} opts.defaultStyle.customLabelOffset.width
 */
NPMobile.Layers.ClusterLayer = function(name, opts) {
    NPMobile.Layers.Layer.call(this, name, opts);
    this._events = {
        '_getUrl': function() {
            return 'img/Flag.png'
        },
        '_getImageSize': function() {
            return {
                width: 32,
                height: 32
            }
        },
        '_getContent': function() {
            return '';
        }
    };
    opts = NPMobile.Util.extend(opts, {
        distance: 200,
        clusterClickModel: 'zoom',
        isAsynchronous: false,
        zIndexing: true,
        defaultStyle: {
            fontColor: 'white',
            fontSize: ''
        }
    })

    var that = this;
    var layerOpts = {
        isClusterLayer: true,
        eventListeners: {
            featureselected: function(e) {
                var f = e.feature;
                var clusters = f.layer;
                if (f.cluster && f.cluster.length > 1) {
                    return;
                } else {
                    if (f.attributes.count > 0 && opts.clusterClickModel === 'zoom') {
                        if (!opts.selectZoom) {
                            var px = clusters.map.getPixelFromLonLat({
                                lon: f.geometry.getCentroid().x,
                                lat: f.geometry.getCentroid().y
                            });
                            clusters.map.zoomTo(clusters.map.getZoom() + 1, px);
                        } else {
                            var p = new OpenLayers.LonLat(f.geometry.x, f.geometry.y);
                            clusters.map.setCenter(p, opts.selectZoom);
                        }
                    }
                }

                var clientData;
                if (!f.cluster) {
                    clientData = f.data;
                } else {
                    if (f.cluster && f.cluster.length === 1) {
                        clientData = f.cluster[0].data;
                    }
                    if (f.cluster && f.cluster.length === 0) {
                        f.data.feature._apiObj = f;
                        clientData = f.data.feature;
                    }
                }
                if ((!f.cluster || f.cluster.length < 2) && clientData && !f.data.isStatistics) {
                    that._trigger('click', clientData.id, e.feature.style.externalGraphic === '' || typeof(e.feature.style.externalGraphic) === 'undefined');
                }
                return false;
            }
        }
    };
    var clusterStrategy = new OpenLayers.Strategy.AnimatedCluster({
        threshold: opts.threshold || 5,
        distance: opts.distance || 200,
        animationMethod: OpenLayers.Easing.Expo.easeOut,
        animationDuration: 10,
        maxZoom: opts.maxZoom || 15,
        minZoom: opts.minZoom || 0,
        isAsynchronous: opts.isAsynchronous,
        clusterClickModel: opts.clusterClickModel,
        minClusterCount: opts.minClusterCount,
        callbackFun: null
    });
    layerOpts.strategies = [clusterStrategy];
    layerOpts.rendererOptions = {
        zIndexing: true
    };
    var content = {
        context: {
            getCount: function(f) {
                return f.getCount() || that._trigger('getContent', f);
            },
            getUrl: function(f) {
                return that._trigger('getUrl', f.getCount(), f.getData());
            },
            getWidth: function(f) {

                return that._trigger('getImageSize', f.getCount(), f.getData()).width;
            },
            getHeight: function(f) {
                return that._trigger('getImageSize', f.getCount(), f.getData()).height;
            },
            getRotation: function(f) {
                return that._trigger('getRotation', f.getCount(), f.getData());
            },
            getgraphicYOffset: function(f) {
                var counts = f.getCount();
                var size = that._trigger('getImageSize', counts, f.getData());
                return counts === null ? -size.height / 2 : -size.height;
            },
            getlabelYOffset: function(f) {
                var counts = f.getCount();
                var data = f.getData();
                var size = that._trigger('getImageSize', counts, data);
                if (counts) {
                    return size.height / 2;
                } else {
                    if (opts.customLabelOffset) {
                        return opts.customLabelOffset.height;
                    }
                    return that._trigger('getCustomLabelOffset', counts, data);
                }
            },
            getLabelFontColor: function(f) {
                var counts = f.getCount();
                if (!counts) {
                    return opts.defaultStyle.customLabelFontColor || opts.defaultStyle.fontColor;
                }
                return opts.defaultStyle.fontColor;
            },
            getFontSize: function(f) {
                var counts = f.getCount();
                if (!counts) {
                    return opts.defaultStyle.customLabelFontColor || opts.defaultStyle.fontSize;
                }
                return opts.defaultStyle.fontSize;
            },
            getlabelXOffset: function(f) {
                var counts = f.getCount();
                if (!counts && opts.customLabelOffset) {
                    return opts.customLabelOffset.width;
                }
                return;
            },
            getTitle: function(f) {
                var counts = f.getCount();
                var title = !counts && that._trigger('getTitle', f.getData());
                return title || '';
            },
            getlabelbg: function(f) {
                var counts = f.getCount();
                return !counts && that._trigger('getBackGroundColor', f.getData());
            }
        }
    };
    layerOpts.styleMap = new OpenLayers.StyleMap({
        'default': new OpenLayers.Style({
            externalGraphic: '${getUrl}',
            graphicWidth: '${getWidth}',
            graphicHeight: '${getHeight}',
            graphicOpacity: 1,
            graphicYOffset: '${getgraphicYOffset}',
            label: '${getCount}',
            labelYOffset: '${getlabelYOffset}',
            labelXOffset: '${getlabelXOffset}',
            labelSelect: true,
            fontColor: '${getLabelFontColor}',
            fontSize: '${getFontSize}',
            rotation: '${getRotation}',
            labelBackgroundColor: '${getlabelbg}',
            title: '${getTitle}'
        }, content)
    });
    this._layer = new OpenLayers.Layer.Vector(name || "聚合图层", layerOpts);
};

NPMobile.Layers.ClusterLayer.prototype = {
    /** 
     * 显示/隐藏图层
     * @param {Boolean}   display  
     */
    display: function(display) {
        this._layer.display(display);
    },
    _trigger: function(type) {
        var fun = this._events["_" + type];
        if (fun) {
            var args = [];
            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            return fun.apply(this, args);
        }
    },
    /**
     * 注销事件
     * @event
     * @param  {string} type   事件类型  
     */
    unregister: function(type) {
        this._events["_" + type] = null;
        return this;
    },
    /**
     * 注册事件
     * @event
     * @param  {string} type     事件类型 click:散开点click 事件
     * @param  {functon} listener      
     */
    register: function(type, listener) {
        this._events["_" + type] = listener;
        return this;
    },
    /**
     * 新增聚合Marker
     * @param {NPMobile.Geometry.ClusterMarker[]} markers 聚合Maker
     */
    addOverlays: function(markers) {
        this._layer.removeAllFeatures();
        for (var i = 0; i < markers.length; i++) {
            if (!this._layer.showMarker[markers[i].markType]) {
                this._layer.showMarker[markers[i].markType] = true;
            }
        }
        this._layer.events.triggerEvent("beforefeaturesadded", {
            features: markers
        });
        return this;
    },

};
NPMobile.inherits(NPMobile.Layers.ClusterLayer, NPMobile.Layers.Layer);
NPMobile.Geometry.MultiLineString = function() {

};
NPMobile.inherits(NPMobile.Geometry.MultiLineString, NPMobile.Geometry.Curve);
/**
 * 线段
 * @
 * @param {NPMobile.Geometry.Point[]} points
 * @param {object} style  线段样式
 * @param {string} style.strokeColor    默认red
 * @param {number} style.strokeWidth    默认2
 * @param {string} style.strokeDashstyle [dot | dash | dashdot | longdash | longdashdot | solid]
 * @param {number} style.pointRadius 默认6
 * @param {string} style.strokeLinecap [butt | round | square]
 */
NPMobile.Geometry.LineString = function(points, style) {
    NPMobile.Geometry.Curve.call(points, style);
    style = NPMobile.Util.extend(style, {
        "graphicName": "triangle",
        "strokeColor": 'red',
        "strokeWidth": 2,
        "strokeDashstyle": "solid",
        "pointRadius": 6,
        'strokeLinecap': 'round'
    });
    var tempPoint;
    var l = new OpenLayers.Geometry.LineString(this._castPoints(NPMobile.T.setPoints(this._map, points)));
    this._vector = new OpenLayers.Feature.Vector(l, this, style);
};
NPMobile.inherits(NPMobile.Geometry.LineString, NPMobile.Geometry.Curve);
/**
 * @class NPMobile.Geometry.Polygon
 * @extends {NPMobile.Geometry.Curve}
 * @constructor
 * @param {NPMobile.Geometry.Point[]} points
 * @param {object} style  线段样式
 * @param {string} style.fillColor    默认red
 * @param {number} style.fillOpacity 1
 * @param {number} style.strokeWidth    默认1
 * @param {string} style.strokeDashstyle [dot | dash | dashdot | longdash | longdashdot | solid]
 * @param {number} style.pointRadius 默认6
 * @param {string} style.strokeLinecap [butt | round | square]
 */
NPMobile.Geometry.Polygon = function(points, style) {
    NPMobile.Geometry.Curve.call(points, style);
    style = NPMobile.Util.extend(style, {
        fill: true,
        fillColor: 'red',
        fillOpacity: 1,
        strokeColor: '#ee9900',
        strokeWidth: 1,
        strokeOpacity: 1,
        pointRadius: 6,
        label: ''
    });
    points = NPMobile.T.setPoints(null, points);
    var lr = new OpenLayers.Geometry.LinearRing(this._castPoints(points));
    var pg = new OpenLayers.Geometry.Polygon(lr);
    this._vector = new OpenLayers.Feature.Vector(pg, this, style);
};
NPMobile.inherits(NPMobile.Geometry.Polygon, NPMobile.Geometry.Curve);
NPMobile.Geometry.MultiPolygon = function() {

};
NPMobile.inherits(NPMobile.Geometry.MultiPolygon, NPMobile.Geometry.Curve);

/**
 * Point
 * @class  NPMobile.Geometry.Point
 * @constructor
 * @param {number} lon
 * @param {number} lat
 */
NPMobile.Geometry.Point = function(lon, lat) {
    this.lon = Number(lon),
        this.lat = Number(lat);
};

NPMobile.Geometry.Point.setPoint = function(lon, lat) {
    return NPMobile.T.setPoint(null, {
        lon: lon,
        lat: lat
    });
};

NPMobile.Geometry.Point.getPoint = function(lon, lat) {
    return NPMobile.T.getPoint(null, {
        lon: lon,
        lat: lat
    });
};

/**
 * 创建标注 
 * @class  NPMobile.Geometry.Marker
 * @extends {NPMobile.Geometry.Curve}
 * @constructor
 * @param  {NPMobile.Geometry.Point}   point      [坐标点]
 * @param  {object}  markerParam
 * @param  {string}  markerParam.externalGraphic  图片路径 
 * @param  {number}  markerParam.graphicXOffset    X 偏移量
 * @param  {number}  markerParam.graphicYOffset Y偏移量
 * @param  {number}  markerParam.graphicWidth   图片宽度
 * @param  {number}  markerParam.graphicHeight  图片高度  
 * @param  {number}  markerParam.graphicZIndex  Zindex  
 */
NPMobile.Geometry.Marker = function(point, markerParam) {
    NPMobile.Geometry.Curve.call(this, point);
    var style = {
        graphicWidth: markerParam.graphicWidth,
        graphicHeight: markerParam.graphicHeight,
        graphicXOffset: markerParam.graphicXOffset,
        graphicYOffset: markerParam.graphicYOffset,
        externalGraphic: markerParam.externalGraphic,
        graphicZIndex: markerParam.graphicZIndex
    };
    var tempPoint = NPMobile.T.setPoint(this._map, point);
    this._vector = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(tempPoint.lon, tempPoint.lat),
        this, style);
};
NPMobile.Geometry.Marker.prototype = {
    /**
     * 设置样式
     * @param  {object}  style
     * @param  {string}  style.externalGraphic  图片路径 
     * @param  {number}  style.graphicXOffset    X 偏移量
     * @param  {number}  style.graphicYOffset Y偏移量
     * @param  {number}  style.graphicWidth   图片宽度
     * @param  {number}  style.graphicHeight  图片高度  
     * @param  {number}  style.graphicZIndex  Zindex  
     * @param  {string}  style.label    文字
     * @param  {string}  style.labelAlign    文字对其方式 “l”=left, “c”=center, “r”=right, “t”=top, “m”=middle, “b”=bottom.  
     *                                       比如: “lt”, “cm”, “rb”.  默认 is “cm”
     * @param  {number}  style.labelXOffset 文字X 偏移量
     * @param  {number}  style.labelYOffset 文字Y 偏移量
     * @param  {string}  style.fontColor    文字颜色
     * @param  {String}  style.fontSize
     * @param  {String}  style.fontFamily
     */
    setStyle: function(style) {
        for (var k in style) {
            this._vector.style[k] = style[k];
        }
        this.refresh();
    }
};
NPMobile.inherits(NPMobile.Geometry.Marker, NPMobile.Geometry.Curve);
/**
 * 新建地图，一键式生成地图
 * @class  NPMobile.Map
 * @constructor
 * @param  {string|HTMLDOM} mapContainer 地图容器的dom元素，id和Dom均可支持
 * @param  {object} mapInfo 指地图配置参数信息，此对象直接由读取NPGISSever生成的配置文件而来   
 */
NPMobile.Map = function(mapContainer, mapInfo) {
    this._events = [];
    this._selectControl = null;
    this._layers = [];
    var geolocate = new OpenLayers.Control.Geolocate({
        "id": "iploc",
        bind: false,
        geolocationOptions: {
            enableHighAccuracy: false,
            maximumAge: 0,
            timeout: 7000
        }
    });
    mapInfo.mapOpts.controls = [new OpenLayers.Control.TouchNavigation({
        dragPanOptions: {
            enableKinetic: true
        }
    }), geolocate, new OpenLayers.Control.Zoom()];
    mapInfo.mapOpts.centerPoint = mapInfo.mapOpts.centerPoint || mapInfo.vectorLayer[0].layerOpt.centerPoint;
    mapInfo.mapOpts.zoom = mapInfo.mapOpts.defaultZoom || mapInfo.mapOpts.minZoom;

    mapInfo.mapOpts.originCenter = mapInfo.mapOpts.centerPoint;
    this._map = new OpenLayers.Map(mapContainer, mapInfo.mapOpts);

    $(".icon").click(function() {
        console.log('click');
        if (geolocate.active) {
            geolocate.getCurrentLocation();
        } else {
            geolocate.activate();
        }
    });
    var that = this;
    var vector = new OpenLayers.Layer.Vector("Vector Layer", {});
    this._map.addLayer(vector);
    geolocate.events.register("locationfailed", this, function(e) {
        console.error(e.error.message);
    });
    geolocate.events.register("locationupdated", this, function(e) {
        that.setCenter(e.position, that.getMaxZoom());
        var point = NPMobile.T.setPoint(that._map, e.position);
        vector.removeAllFeatures();
        vector.addFeatures([
            new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Point(point.lon, point.lat), {}, {
                    strokeOpacity: 1,
                    strokeColor: 'rgb(23,146,255)',
                    fillColor: 'rgb(23,146,255)',
                    pointRadius: 5
                }
            ),
            new OpenLayers.Feature.Vector(
                OpenLayers.Geometry.Polygon.createRegularPolygon(
                    new OpenLayers.Geometry.Point(point.lon, point.lat),
                    that._map.getUnits() == 'm' ? 15 : 0.0001,
                    50,
                    0
                ), {}, {
                    fillOpacity: 0.3,
                    fillColor: 'rgb(23,146,255)',
                    strokeColor: 'rgb(23,146,255)',
                    strokeOpacity: 0.3
                }
            )
        ]);

    });

    this._mapJson = {
        map: this._map,
        vectorLayer: this._getLayers(mapInfo.vectorLayer),
        sattilateLayer: this._getLayers(mapInfo.sattilateLayer)
    };
    this._map.addLayers(this._mapJson.vectorLayer);
    this._defaultLayer = new OpenLayers.Layer.Vector("_默认图层", {
        rendererOptions: {
            zIndexing: true
        }
    });
    this._map.addLayers([this._defaultLayer]);

    if (this._map.getProjection() === "EPSG:900913" && mapInfo.mapOpts.centerPoint[0] < 180) {
        var ep = NPMobile.T.setPoint(this._map, {
            lon: mapInfo.mapOpts.centerPoint[0],
            lat: mapInfo.mapOpts.centerPoint[1]
        });
        this._map.originCenter = [ep.lon, ep.lat];
    }

    this.fullExtent(mapInfo.mapOpts.zoom);

    this._defaultLayer.events.register("featureclick", this, function(e) {
        if (e.feature._click) {
            e.feature._click(e.feature);
        }
    });

    NPMobile.T.map = this._map;
};
NPMobile.Map.prototype = {
    donothing: function() {

    },
    /**
     * 注册事件
     * @event
     * @param  {string} type     事件类型 click 
     * @param  {functon} listener      
     */
    register: function(type, listener) {
        if (type === 'click' && listener) {
            var clickFun = function(f) {
                try {
                    listener(NPMobile.T.getPoint(this, this.getLonLatFromLayerPx(f.xy)));
                } catch (e) {

                }
                return false;
            };
            this._events["_" + type] = clickFun;
            this._map.events.register('click', this._map, clickFun);
        } else {
            this._events["_" + type] = listener;
        }
    },
    addOverlay: function(overlayer) {
        this._defaultLayer.addFeatures([overlayer._vector]);
    },
    /**
     * 注销事件
     * @event
     * @param  {string} type     事件类型 click     
     */
    unregister: function(type) {
        if (type === 'click') {
            this._map.events.unregister('click', this._map, this._events["_" + type]);
        }
        this._events["_" + type] = null;
    },
    /**
     * 获取最小Zoom
     * @return {number} 
     */
    getMinZoom: function() {
        return this._map.minZoom;
    },
    /**
     * 获取最大Zoom
     * @return {number} 
     */
    getMaxZoom: function() {
        return this._map.maxZoom;
    },
    /**
     * 新增图层
     * @param {NPMobile.Layers.CustomerLayer} 
     */
    addLayer: function(layer) {
        this._map.addLayers([layer._layer]);

        this._layers.push(layer._layer);
        if (!this._selectControl) {
            this._selectControl = new OpenLayers.Control.SelectFeature(this._layers, {
                autoActivate: true,
                onSelect: function(feature) {
                    if (feature._click) {
                        feature._click(feature.data);
                    }
                }
            });
            this._map.addControl(this._selectControl);
        } else {
            this._selectControl.setLayer(this._layers);
        }
    },
    /**
     * 全图
     * @param  {number} initZoom
     */
    fullExtent: function(initZoom) {
        var centerArray = this._map.originCenter;
        var center = new OpenLayers.LonLat(centerArray[0], centerArray[1]);
        initZoom = initZoom || this._map.minZoom;
        this._map.setCenter(center, initZoom);
    },
    _getLayers: function(layers) {
        var get_my_url = function(bounds) {
            var res = this.map.getResolution();
            var tileOriginY = this.map.getMaxExtent().top;
            var tileOriginX = this.map.getMaxExtent().left;

            var x = Math.round((bounds.left - tileOriginX) / (res * this.tileSize.w));
            var y = Math.round((tileOriginY - bounds.top) / (res * this.tileSize.h));
            var z = this.map.getZoom();
            var path = "" + z + "/" + x + "/" + y + "." + this.type;
            if (this.isOnline) {
                path = "L=" + z + "&X=" + x + "&Y=" + y;
            }
            var url = this.url;
            if (url instanceof Array) {
                url = this.selectUrl(path, url);
            }
            return url + path;
        };
        var layersResult = [];
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            var newLayer = null;
            if (layer.layerType === 'NPMapLib.Layers.NPLayer') {
                var url = layer.layerOpt.url + "/getTile?";
                var self = layer.layerOpt.layerInfo;
                switch (layer.layerOpt.layerInfo.layerType) {
                    case "tiandi":
                    case "NPMapLib.Layers.TDMapLayer":
                        self._opts = {
                            mapType: self.type,
                            centerPoint: self.centerPoint,
                            fullExtent: self.fullExtent,
                            topLevel: 0,
                            bottomLevel: 18,
                            isBaseLayer: true,
                            zoomOffset: 0
                        };
                        self._opts.fullExtent = [-180, -90, 180, 90];
                        newLayer = new OpenLayers.Layer.TDTLayer(self.name, url, self._opts);
                        break;
                    case "gaode":
                    case "NPMapLib.Layers.GaoDeLayer":
                        self._opts = {
                            centerPoint: self.centerPoint,
                            fullExtent: self.fullExtent,
                            isBaseLayer: self.isBaseLayer
                        };
                        newLayer = new OpenLayers.Layer.gaode(url, self.name, self._opts);
                        break;
                    case "google":
                    case "NPMapLib.Layers.GoogleOffLineLayer":
                        self._opts = {
                            isOnline: true,
                            centerPoint: self.centerPoint,
                            fullExtent: self.fullExtent,
                            isBaseLayer: self.isBaseLayer
                        };
                        self._opts.getURL = get_my_url;
                        newLayer = new OpenLayers.Layer.TMS(url, self.name, self._opts);
                        break;
                    case "baidu":
                    case "NPMapLib.Layers.BaiduTileLayer":
                        url = url + "X=${x}&Y=${y}&L=${z}";
                        self._opts = {
                            centerPoint: self.centerPoint,
                            fullExtent: self.fullExtent,
                            isBaseLayer: self.isBaseLayer,
                            tileOrigin: new OpenLayers.LonLat(0, 0),
                            maxResolution: 262144
                        };
                        newLayer = new OpenLayers.Layer.Baidu(url, self.name, self._opts);
                        break;
                    case "streetmap":
                    case "NPMapLib.Layers.OSMLayer":
                        url = url + "X=${x}&Y=${y}&L=${z}";
                        newLayer = new OpenLayers.Layer.OSM(url, self.name, {
                            isChian: false,
                            centerPoint: self.centerPoint,
                            isBaseLayer: self.isBaseLayer
                        });
                        break;
                    case "pgis":
                    case "NPMapLib.Layers.EzMapTileLayer":
                        url = url + "X=${x}&Y=${y}&L=${z}";
                        self.tileOrigin = self.tileOrigin || new OpenLayers.LonLat(0, 0);
                        self.maxResolution = 2;
                        newLayer = new OpenLayers.Layer.TMS_PGIS(url, self.name, self);
                        break;
                    default:
                        break;
                }
            } else {
                var url = layer.layerOpt.url;
                var self = layer.layerOpt;
                switch (layer.layerType) {
                    case 'NPMapLib.Layers.GoogleMapTileLayer':
                        newLayer = new OpenLayers.Layer.OSM(layer.layerName, url, self);
                        break;
                    case 'NPMapLib.Layers.TDMapLayer':
                        self.fullExtent = [-180, -90, 180, 90];
                        newLayer = new OpenLayers.Layer.TDTLayer(layer.layerName, url, self);
                        break;
                    case 'NPMapLib.Layers.GaoDeLayer':
                        newLayer = new OpenLayers.Layer.gaode(layer.layerName, url, self);
                        break;
                    case 'NPMapLib.Layers.BaiduTileLayer':
                        self.tileOrigin = new OpenLayers.LonLat(0, 0);
                        self.maxResolution = 262144;
                        newLayer = new OpenLayers.Layer.Baidu(layer.layerName, url, self);
                        break;
                    case 'NPMapLib.Layers.OSMLayer':
                        newLayer = new OpenLayers.Layer.OSM(layer.layerName, url, self);
                        break;
                    case 'NPMapLib.Layers.ArcgisTileLayer':
                        var e = layer.layerOpt.layerInfo,
                            tileInfo = e.tileInfo,
                            self = {};
                        if (tileInfo.lods) {
                            self.resolutions = [];
                            for (var i = 0; i < tileInfo.lods.length; i++) {
                                self.resolutions.push(tileInfo.lods[i].resolution);
                            }
                        }
                        if (tileInfo.rows) {
                            self.tileSize = new OpenLayers.Size(tileInfo.rows, tileInfo.rows);
                        }
                        if (tileInfo.origin) {
                            self.tileOrigin = new OpenLayers.LonLat(tileInfo.origin.x, tileInfo.origin.y);
                        }

                        if (e.fullExtent) {
                            self.maxExtent = new OpenLayers.Bounds(e.fullExtent.xmin, e.fullExtent.ymin, e.fullExtent.xmax, e.fullExtent.ymax)
                        }
                        if (tileInfo.spatialReference) {
                            self.projection = "EPSG:" + tileInfo.spatialReference.wkid;
                        }
                        if (tileInfo.format) {
                            self.type = "jpg";
                        }
                        newLayer = new OpenLayers.Layer.ArcGISCache(layer.layerName, url, self);
                        break;
                    default:
                        break;
                }
            }
            layersResult.push(newLayer);
        }
        return layersResult;
    },
    /**
     * 矢量影像切换，显示矢量图出层     
     */
    showVectorLayer: function(argument) {
        if (!this._mapJson) {
            return;
        }
        if (this._mapJson.vectorLayer) {
            if (this._mapJson.vectorLayer.length > 1) {
                for (var i = 0; i < this._mapJson.vectorLayer.length; i++) {
                    this._mapJson.vectorLayer[i].show();
                    this._mapJson.vectorLayer[i].setZIndex(this._mapJson.vectorLayer[0].getZIndex() + i + 1);
                }
            }
            if (this._mapJson.sattilateLayer.length > 1) {
                for (var i = this._mapJson.sattilateLayer.length - 1; i >= 1; i--) {
                    this._mapJson.sattilateLayer[i].hide();
                }
            }
            if (this._mapJson.vectorLayer.length > 0) {
                this._mapJson.map.setBaseLayer(this._mapJson.vectorLayer[0]);
            }
        }
    },
    /**
     * 矢量影像切换，显示影像图出层     
     */
    showSattilateLayer: function(argument) {
        if (!this._mapJson) {
            return;
        }
        if (this._mapJson.sattilateLayer) {
            if (this._mapJson.sattilateLayer.length > 1) {
                for (var i = this._mapJson.sattilateLayer.length - 1; i >= 1; i--) {
                    this._mapJson.sattilateLayer[i].show();
                    this._mapJson.sattilateLayer[i].setZIndex(this._mapJson.sattilateLayer[0].getZIndex() + i + 1);
                }
            }
            if (this._mapJson.vectorLayer.length > 1) {
                for (var i = this._mapJson.vectorLayer.length - 1; i >= 1; i--) {
                    this._mapJson.vectorLayer[i].hide();
                }
            }
            if (this._mapJson.sattilateLayer.length > 0) {
                this._mapJson.map.setBaseLayer(this._mapJson.sattilateLayer[0]);
            }
        }
    },
    /**
     * 获取地图中心点
     * @return {NPMobile.Geometry.Point} 
     */
    getCenter: function() {
        var c = this._map.getCenter();
        return NPMobile.T.getPoint(this._map, c);
    },
    /**
     * 设置地图中心点
     * @param {NPMobile.Geometry.Point} point  
     * @param {number} zoom
     */
    setCenter: function(point, zoom) {
        var tempPoint = NPMobile.T.setPoint(this._map, point);
        this._map.setCenter(new OpenLayers.LonLat(tempPoint.lon, tempPoint.lat), zoom || this.getZoom());
    },
    /**
     * 获取当前Zoom
     * @return {number}
     */
    getZoom: function() {
        return this._map.getZoom();
    },
    /**
     * 创建标注 
     * @param  {NPMobile.Geometry.Point}   point      [坐标点]
     * @param  {object}  markerParam
     * @param  {string}  markerParam.externalGraphic  图片路径 
     * @param  {number}  markerParam.graphicXOffset    X 偏移量
     * @param  {number}  markerParam.graphicYOffset Y偏移量
     * @param  {number}  markerParam.graphicWidth   图片宽度
     * @param  {number}  markerParam.graphicHeight  图片高度  
     * @param  {number}  markerParam.graphicZIndex  Zindex  
     * @param {function} clickFun click 事件
     */
    createMarker: function(point, markerParam, clickFun) {
        var style = {
            graphicWidth: markerParam.graphicWidth,
            graphicHeight: markerParam.graphicHeight,
            graphicXOffset: markerParam.graphicXOffset,
            graphicYOffset: markerParam.graphicYOffset,
            externalGraphic: markerParam.externalGraphic,
            graphicZIndex: markerParam.graphicZIndex
        };
        var tempPoint = NPMobile.T.setPoint(this._map, point);
        var vector = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(tempPoint.lon, tempPoint.lat), {
            point: point,
            style: style
        }, style);
        this._defaultLayer.addFeatures([vector]);
        vector._click = clickFun;
    }
};
(function() {
    var coordHelper = (function() {
        var pi = 3.14159265358979324; // 圆周率
        var ee = 0.00669342162296594323; // WGS 偏心率的平方
        var x_pi = 3.14159265358979324 * 3000.0 / 180.0;
        var pole = 20037508.34;
        var a = 6378245.0 // WGS 长轴半径
        var helper = {};
        // 84->火星
        helper.transform = function(lon, lat) {
            lon = parseFloat(lon);
            lat = parseFloat(lat);
            var localHashMap = {};
            if (this.outofChina(lat, lon)) {
                localHashMap.lon = lon;
                localHashMap.lat = lat;
                return localHashMap;
            }
            var dLat = this.transformLat(lon - 105.0, lat - 35.0);
            var dLon = this.transformLon(lon - 105.0, lat - 35.0);
            var radLat = lat / 180.0 * pi;
            var magic = Math.sin(radLat);
            magic = 1 - ee * magic * magic;
            var sqrtMagic = Math.sqrt(magic);
            dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
            dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
            var mgLat = lat + dLat;
            var mgLon = lon + dLon;
            localHashMap.lon = mgLon;
            localHashMap.lat = mgLat;
            return localHashMap;
        };

        helper.outofChina = function(lat, lon) {
            if (lon < 72.004 || lon > 137.8347)
                return true;
            if (lat < 0.8293 || lat > 55.8271)
                return true;
            return false;
        };

        helper.transformLat = function(x, y) {
            var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0;
            ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;
            return ret;
        };

        helper.transformLon = function(x, y) {
            var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0;
            ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0;
            return ret;
        };
        // 火星->84
        helper.gcj2wgs = function(lon, lat) {
            var p = {
                lon: 0,
                lat: 0
            }
            var lontitude = lon - (this.transform(lon, lat).lon - lon);
            var latitude = lat - (this.transform(lon, lat).lat - lat);
            p.lon = lontitude;
            p.lat = latitude;
            return p;
        };

        // 火星坐标转百度坐标
        helper.bd_encrypt = function(gg_lon, gg_lat) {
            var x = gg_lon,
                y = gg_lat;
            var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);
            var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
            var bd_lon = z * Math.cos(theta) + 0.0065;
            var bd_lat = z * Math.sin(theta) + 0.006;
            return {
                lon: bd_lon,
                lat: bd_lat
            };
        };

        // 百度坐标转火星坐标
        helper.bd_decrypt = function(bd_lon, bd_lat) {
            var x = bd_lon - 0.0065,
                y = bd_lat - 0.006;
            var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
            var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
            var gg_lon = z * Math.cos(theta);
            var gg_lat = z * Math.sin(theta);
            return {
                lon: gg_lon,
                lat: gg_lat
            };
        };

        // 经纬度-> 墨卡托投影转换
        helper.webMoctorJW2PM = function(lon, lat) {
            var c = {
                lon: 0,
                lat: 0
            };
            lon = parseFloat(lon);
            lat = parseFloat(lat);
            c.lon = (lon / 180.0) * 20037508.34;
            if (lat > 85.05112) {
                lat = 85.05112;
            }
            if (lat < -85.05112) {
                lat = -85.05112;
            }
            lat = (Math.PI / 180.0) * lat;
            var tmp = Math.PI / 4.0 + lat / 2.0;
            c.lat = 20037508.34 * Math.log(Math.tan(tmp)) / Math.PI;
            return c;
        };
        // 墨卡托投影转换-》经纬度
        helper.inverseMercator = function(lon, lat) {
            lon = 180 * lon / pole;
            lat = 180 / Math.PI * (2 * Math.atan(Math.exp((lat / pole) * Math.PI)) - Math.PI / 2);
            return {
                lon: lon,
                lat: lat
            };
        }

        return helper;
    });
    var Hb = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    function Ib(a) {
        var b = "",
            c, d, e = "",
            f, g = "",
            i = 0;
        f = /[^A-Za-z0-9\+\/\=]/g;
        if (!a || f.exec(a))
            return a;
        a = a.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        do
            c = Hb.indexOf(a.charAt(i++)),
            d = Hb.indexOf(a.charAt(i++)),
            f = Hb.indexOf(a.charAt(i++)),
            g = Hb.indexOf(a.charAt(i++)),
            c = c << 2 | d >> 4,
            d = (d & 15) << 4 | f >> 2,
            e = (f & 3) << 6 | g,
            b += String.fromCharCode(c),
            64 != f && (b += String.fromCharCode(d)),
            64 != g && (b += String.fromCharCode(e));
        while (i < a.length);
        return b
    }

    function Xa(a) {
        return "string" == typeof a
    }

    function H(a, b) {
        isNaN(a) && (a = Ib(a),
            a = isNaN(a) ? 0 : a);
        Xa(a) && (a = parseFloat(a));
        isNaN(b) && (b = Ib(b),
            b = isNaN(b) ? 0 : b);
        Xa(b) && (b = parseFloat(b));
        this.lng = a;
        this.lat = b
    };
    var baiduHelper = {
        $O: 6370996.81,
        lG: [1.289059486E7, 8362377.87, 5591021, 3481989.83, 1678043.12, 0],
        Au: [75, 60, 45, 30, 15, 0],
        fP: [
            [1.410526172116255E-8, 8.98305509648872E-6, -1.9939833816331, 200.9824383106796, -187.2403703815547, 91.6087516669843, -23.38765649603339, 2.57121317296198, -0.03801003308653, 1.73379812E7],
            [-7.435856389565537E-9, 8.983055097726239E-6, -0.78625201886289, 96.32687599759846, -1.85204757529826, -59.36935905485877, 47.40033549296737, -16.50741931063887, 2.28786674699375, 1.026014486E7],
            [-3.030883460898826E-8, 8.98305509983578E-6, 0.30071316287616, 59.74293618442277, 7.357984074871, -25.38371002664745, 13.45380521110908, -3.29883767235584, 0.32710905363475, 6856817.37],
            [-1.981981304930552E-8, 8.983055099779535E-6, 0.03278182852591, 40.31678527705744, 0.65659298677277, -4.44255534477492, 0.85341911805263, 0.12923347998204, -0.04625736007561, 4482777.06],
            [3.09191371068437E-9, 8.983055096812155E-6, 6.995724062E-5, 23.10934304144901, -2.3663490511E-4, -0.6321817810242, -0.00663494467273, 0.03430082397953, -0.00466043876332, 2555164.4],
            [2.890871144776878E-9, 8.983055095805407E-6, -3.068298E-8, 7.47137025468032, -3.53937994E-6, -0.02145144861037, -1.234426596E-5, 1.0322952773E-4, -3.23890364E-6, 826088.5]
        ],
        iG: [
            [-0.0015702102444, 111320.7020616939, 1704480524535203, -10338987376042340, 26112667856603880, -35149669176653700, 26595700718403920, -10725012454188240, 1800819912950474, 82.5],
            [8.277824516172526E-4, 111320.7020463578, 6.477955746671607E8, -4.082003173641316E9, 1.077490566351142E10, -1.517187553151559E10, 1.205306533862167E10, -5.124939663577472E9, 9.133119359512032E8, 67.5],
            [0.00337398766765, 111320.7020202162, 4481351.045890365, -2.339375119931662E7, 7.968221547186455E7, -1.159649932797253E8, 9.723671115602145E7, -4.366194633752821E7, 8477230.501135234, 52.5],
            [0.00220636496208, 111320.7020209128, 51751.86112841131, 3796837.749470245, 992013.7397791013, -1221952.21711287, 1340652.697009075, -620943.6990984312, 144416.9293806241, 37.5],
            [-3.441963504368392E-4, 111320.7020576856, 278.2353980772752, 2485758.690035394, 6070.750963243378, 54821.18345352118, 9540.606633304236, -2710.55326746645, 1405.483844121726, 22.5],
            [-3.218135878613132E-4, 111320.7020701615, 0.00369383431289, 823725.6402795718, 0.46104986909093, 2351.343141331292, 1.58060784298199, 8.77738589078284, 0.37238884252424, 7.45]
        ],
        p: null,
        JD: function(a, b, c) {
            for (; a > c;)
                a -= c - b;
            for (; a < b;)
                a += c - b;
            return a
        },
        ND: function(a, b, c) {
            b != null && (a = Math.max(a, b));
            c != null && (a = Math.min(a, c));
            return a
        },
        Fb: function(a) {
            a.lng = a.lon;
            a.lat = a.lat;
            if (!a || 180 < a.lng || -180 > a.lng || 90 < a.lat || -90 > a.lat)
                return new H(0, 0);
            var b, c;
            a.lng = this.JD(a.lng, -180, 180);
            a.lat = this.ND(a.lat, -74, 74);
            b = new H(a.lng, a.lat);
            for (var d = 0; d < this.Au.length; d++)
                if (b.lat >= this.Au[d]) {
                    c = this.iG[d];
                    break
                }
            if (!c)
                for (d = this.Au.length - 1; 0 <= d; d--)
                    if (b.lat <= -this.Au[d]) {
                        c = this.iG[d];
                        break
                    }
            a = this.gK(a, c);
            a = new H(a.lng, a.lat)
            return new NPMobile.Geometry.Point(a.lng, a.lat);
        },
        gK: function(a, b) {
            if (a && b) {
                var c = b[0] + b[1] * Math.abs(a.lng),
                    d = Math.abs(a.lat) / b[9],
                    d = b[2] + b[3] * d + b[4] * d * d + b[5] * d * d * d + b[6] * d * d * d * d + b[7] * d * d * d * d * d + b[8] * d * d * d * d * d * d,
                    c = c * (0 > a.lng ? -1 : 1),
                    d = d * (0 > a.lat ? -1 : 1);
                return new H(c, d)
            }
        },
        ToLL: function(b) {
            b.lng = b.lon;
            var c;
            for (var i = 0; i < this.lG.length; i++) {
                if (b.lat >= this.lG[i]) {
                    c = this.fP[i];
                    break;
                }
            }
            b = this.gK(b, c);
            return new NPMobile.Geometry.Point(b.lng.toFixed(6), b.lat.toFixed(6));
        }

    };

    var o = NPMobile.T = {};
    o.Baidu = baiduHelper;
    var helper = new coordHelper();
    var getBaseLayer = function(map) {
        var baseLayer;
        if (map._mapAdapter) {
            baseLayer = map._mapAdapter.map.baseLayer;
        }
        if (map.map) {
            baseLayer = map.map.baseLayer
        }
        if (map.baseLayer) {
            baseLayer = map.baseLayer;
        }
        return baseLayer;
    };

    o.helper = helper;
    /*
     *
     */
    o.setPoint = function(map, point) {
        if (!NPMobile.ISPOINTCONVERT) {
            return point;
        }
        map = map || NPMobile.T.map;
        if (map.getProjection() == "EPSG:900913") {
            var layer = getBaseLayer(map);
            if (layer.CLASS_NAME.indexOf('Baidu') != -1) {

                e = helper.transform(point.lon, point.lat); // 84-> 火星
                e = helper.bd_encrypt(e.lon, e.lat); //火星-》百度
                return NPMobile.T.Baidu.Fb(e);
            } else {
                e = layer.CLASS_NAME.indexOf('OSM') != -1 && layer.isChina == false ? point : helper.transform(point.lon, point.lat); // 84->火星坐标
            }
            e = helper.webMoctorJW2PM(e.lon, e.lat);
            return new NPMobile.Geometry.Point(e.lon, e.lat);
        } else {
            return point;
        }
    };

    o.setPoints = function(map, points) {
        var result = [];
        for (var i = 0; i < points.length; i++) {
            result.push(NPMobile.T.setPoint(map, points[i]));
        }
        return result;
    };
    o.getPoint = function(map, point) {
        if (!NPMobile.ISPOINTCONVERT) {
            return point;
        }
        map = map || NPMobile.T.map;
        if (point.lon > -180 && point.lon < 180) {
            return point;
        }
        if (map.getProjection() == "EPSG:900913") {
            var e = helper.inverseMercator(point.lon, point.lat);
            var layer = getBaseLayer(map);
            if (layer.CLASS_NAME.indexOf('Baidu') != -1) {
                e = NPMobile.T.Baidu.ToLL(point);
                e = helper.bd_decrypt(e.lon, e.lat); // 百度->火星
                e = helper.gcj2wgs(e.lon, e.lat); // 火星->经纬度
                return new NPMobile.Geometry.Point(e.lon, e.lat);
            } else {
                e = layer.CLASS_NAME.indexOf('OSM') != -1 && layer.isChina == false ? e : helper.gcj2wgs(e.lon, e.lat);
            }
            return new NPMobile.Geometry.Point(e.lon, e.lat);
        } else {
            return point;
        }
    };
    o.getPoints = function(map, points) {
        var result = [];
        for (var i = 0; i < points.length; i++) {
            result.push(NPMobile.T.getPoint(map, points[i]));
        }
        return result;
    };
    o.setExtent = function(map, extent) {
        if (map.getProjection() == "EPSG:900913") {
            var point0 = NPMobile.T.setPoint(map, {
                lon: extent.left,
                lat: extent.top
            });
            var point1 = NPMobile.T.setPoint(map, {
                lon: extent.right,
                lat: extent.bottom
            });
            return new NPMap.Geometry.Extent(point0.lon, point1.lat, point1.lon, point0.lat);

        } else {
            return extent;
        }
    };

    o.getExtent = function(map, extent) {
        if (map.getProjection() == "EPSG:900913") {
            var point0 = NPMobile.T.getPoint(map, {
                lon: extent.left,
                lat: extent.top
            });
            var point1 = NPMobile.T.getPoint(map, {
                lon: extent.right,
                lat: extent.bottom
            });
            return new NPMap.Geometry.Extent(point0.lon, point1.lat, point1.lon, point0.lat);

        } else {
            return extent;
        }
    };

})();


window.NPMobileHelper = {
    _map: null,
    _objs: {

    },
    _createClass: function(obj) {
        var result = null;
        switch (obj.className) {
            case 'NPMobile.Layers.CustomerLayer':
                result = new NPMobile.Layers.CustomerLayer(obj.name);
                break;
            case "NPMobile.Geometry.Marker":
                result = new NPMobile.Geometry.Marker(obj.point, obj.options);
                break;
            case "NPMobile.Geometry.Point":
                result = new NPMobile.Geometry.Point(obj.lon, obj.lat);
                return result;
            case 'NPMobile.Map':
                if (typeof(obj.mapConfig) == 'string') {
                    $.ajaxSettings.async = false;
                    $.getJSON(obj.mapConfig, function(json, textStatus) {
                        obj.mapConfig = json;
                    });
                }
                result = new NPMobile.Map(obj.mapContainer || 'viewerContainer', obj.mapConfig);
                window.NPMobileHelper._map = result;
                break;
            case "NPMobile.Layers.ClusterLayer":
                obj.options.maxZoom = obj.options.maxZoom || window.NPMobileHelper._map.getMaxZoom();
                obj.options.selectZoom = obj.options.selectZoom || window.NPMobileHelper._map.getMaxZoom();
                result = new NPMobile.Layers.ClusterLayer(obj.name, obj.options);
                result.register('getUrl', function(count) {
                    if (count != '') {
                        return obj.options.clusterImage.url;
                    } else {
                        return obj.options.singleImage.url;
                    }
                });
                result.register('getImageSize', function(count) {
                    if (count != '') {
                        return obj.options.clusterImage.imageSize;
                    } else {
                        return obj.options.singleImage.imageSize;
                    }
                });
                result.register('getContent', function() {
                    return '';
                });
                break;
            case "NPMobile.Geometry.ClusterMarker":
                result = new NPMobile.Geometry.ClusterMarker(obj.point, null, obj);
                break;
        }
        result.id = obj.id;
        this._objs[obj.id] = result;
        return result;
    },

    callMethod: function() {
        var args = Array.prototype.slice.call(arguments),
            obj = args.shift();
        var np = this._objs[obj.id] || this._createClass(obj);
        var methodArgs = [];
        for (var i = 1; i < args.length; i++) {
            if (typeof(args[i]) == "object" && args[i].className) {
                methodArgs.push(this._createClass(args[i]));
            } else if (Array.isArray(args[i])) {
                var ls = [];
                for (var j = 0; j < args[i].length; j++) {
                    var temp = args[i][j];
                    if (typeof(temp) == "object" && temp.className) {
                        ls.push(this._createClass(temp))
                    } else {
                        ls.push(temp);
                    }
                }
                methodArgs.push(ls);
            } else {
                methodArgs.push(args[i]);
            }
        }
        if (args[0] === 'register' || args[0] === 'unregister') {            
            np[args[0]](methodArgs[0], function() {
                var data = { id: np.id, eventType: methodArgs[0], args: Array.prototype.slice.call(arguments) };               
                window.WebViewJavascriptBridge.callHandler(
                    'NPMobileHelper.Event.Call', data,
                    function(responseData) {

                    }
                );
            });
            return "";
        }
        var result = np[args[0]].apply(np, methodArgs);
        return JSON.stringify(result);        
    }
}
