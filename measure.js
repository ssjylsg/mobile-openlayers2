NPMobile.Tool = {
    MeasureMode: {
        DISTANCE: "Path",
        AREA: "Polygon"
    }
};
/**
 * 测量工具类
 * @class  NPMobile.Tool.Measure
 * @constructor
 * @param {NPMobile.Map} map 当前地图
 */
NPMobile.Tool.Measure = function(map) {
    var sketchSymbolizers = {
        "Point": {
            pointRadius: 4,
            graphicName: "circle",
            fillColor: "white",
            fillOpacity: 1,
            strokeWidth: 0.5,
            strokeOpacity: 1,
            strokeColor: "red",
            cursor: 'inherit'
        },
        "Line": {
            strokeWidth: 1.5,
            strokeOpacity: 1,
            strokeColor: "#ff0000"
        },
        "Polygon": {
            strokeWidth: 1.5,
            strokeOpacity: 1,
            fillOpacity: 0.3,
            fillColor: "yellow",
            strokeColor: "#ff0000"
        }
    };
    var style = new OpenLayers.Style();
    style.addRules([
        new OpenLayers.Rule({
            symbolizer: sketchSymbolizers
        })
    ]);
    var styleMap = new OpenLayers.StyleMap({
        "default": style
    });
    this._measureControls = {
        Path: new OpenLayers.Control.Measure(OpenLayers.Handler.Path, {
            displayUnits: "km",
            geodesic: true,
            persist: true,
            handlerOptions: {
                layerOptions: {
                    styleMap: styleMap
                }
            }
        }),
        Polygon: new OpenLayers.Control.Measure(OpenLayers.Handler.Polygon, {
            displayUnits: "km",
            persist: false,
            geodesic: true,
            handlerOptions: {
                layerOptions: {
                    styleMap: styleMap
                }
            }
        })
    };

    this._measureLayer = new OpenLayers.Layer.Vector("__绘制图层", {
        rendererOptions: {
            zIndexing: true
        },
        eventListeners: {
            featureselected: function(e) {
                if (e.feature && e.feature.data && e.feature.data.current) {
                    var current = e.feature.data.current;
                    current.layer.removeFeatures(current.vectors);
                    current.vectors = [];
                }
            }
        }
    });
    this._map = map._map;
    map.addLayer({
        '_layer': this._measureLayer
    });
};
NPMobile.Tool.Measure.prototype = {
    /**
     * 开始测距或面积测量
     * @param {string} mode     <p>测距:NPMobile.Tool.MeasureMode.DISTANCE</p>
     *                          <p>面积测量:NPMobile.Tool.MeasureMode.AREA</p>
     * @param {function} callBack 回调函数
     */
    setMode: function(mode, callBack) {
        var control = this._measureControls[mode];
        if (!control) {
            return;
        }
        for (var k in this._measureControls) {
            this._map.removeControl(this._measureControls[k]);
        }
        this._map.addControl(control);
        control.activate();
        if (!callBack) {
            var data = {
                id: this.id,
                eventType: 'MeasureCompleted',
                args: Array.prototype.slice.call(arguments)
            };
            callBack = function() {
                data.args = Array.prototype.slice.call(arguments);
                window.WebViewJavascriptBridge.callHandler(
                    'NPMobileHelper.Event.Call', data,
                    function(responseData) {

                    }
                );
            }

        }
        var current = {
            vectors: [],
            layer: this._measureLayer,
            map: this._map,
            success: function(result) {
                control.deactivate();
                this.map.removeControl(control);
                if (callBack) {
                    callBack(result);
                }
            }
        };
        this.currentControl = control;
        control.events.listeners = {};
        control.events.on({
            "scope": this,
            "measure": function(event) {
                this._measure(event, current);
            },
            "measurepartial": function(event) {
                this._measureProcess(event, current);
            }
        });
    },
    _measure: function(event, current) {
        if (event.measure === 0) {
            return;
        }
        var points = [],
            breakPoints = [],
            geometry = event.geometry,
            style = {
                pointRadius: 4,
                graphicName: "circle",
                fillColor: "white",
                fillOpacity: 1,
                strokeWidth: 1.5,
                strokeOpacity: 1,
                strokeColor: "red"
            },
            prePoint = geometry.components[geometry.components.length - 2],
            point = geometry.components[geometry.components.length - 1],
            unints = {
                'km': '千米',
                'm': '米'
            };
        if (event.order === 1) {
            if (event.measure >= 1000) {
                iconUrl = "110_15.gif"
            } else if (event.measure >= 100) {
                iconUrl = "100_15.gif"
            } else if (event.measure >= 10) {
                iconUrl = "90_15.gif"
            } else {
                iconUrl = "80_15.gif"
            }


            var w_h = iconUrl.substring(0, iconUrl.indexOf('.')).split('_');
            var size = {
                width: 20,
                height: 10
            }; // 删除图片大小
            var xOffset = prePoint.x < point.x ? (size.width + Number(w_h[0])) / 2 : (-size.width - Number(w_h[0])) / 2;
            var yOffset = 0;
            var style = {
                "label": "总长" + event.measure.toFixed(1) + unints[event.units],
                "fontSize": 12,
                'fontColor': 'red',
                "fontFamily": "宋体",
                'labelXOffset': 0 + xOffset,
                'labelYOffset': 8 + yOffset,
                "graphicWidth": Number(w_h[0]),
                "graphicHeight": Number(w_h[1]),
                'externalGraphic': OpenLayers.Util.getImageLocation(iconUrl),
                'graphicXOffset': -Number(w_h[0]) / 2 + xOffset,
                'graphicYOffset': -Number(w_h[1]),
            };
            var vector = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(point.x, point.y),
                vector, style);
            current.vectors.push(vector);

            if (geometry.components.length > 0) {
                for (var i = 0; i < geometry.components.length; i++) {
                    breakPoints.push(new OpenLayers.Geometry.Point(geometry.components[i].x, geometry.components[i].y));
                }
            }
            var multiPoint = new OpenLayers.Geometry.MultiPoint(breakPoints);

            multiFeature = new OpenLayers.Feature.Vector(multiPoint, null, {
                pointRadius: 4,
                graphicName: "circle",
                fillColor: "white",
                fillOpacity: 1,
                strokeWidth: 1.5,
                strokeOpacity: 1,
                strokeColor: "red"
            });
            current.vectors.push(multiFeature);
            style = {
                graphicWidth: 12,
                graphicHeight: 12,
                graphicXOffset: xOffset + Number(w_h[0]) / 2 + (prePoint.x < point.x ? 0 : -8),
                graphicYOffset: -Number(w_h[1])
            };
            style.externalGraphic = OpenLayers.Util.getImageLocation("close.gif");
            vector = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(point.x, point.y), {
                current: current
            }, style);
            current.vectors.push(vector);
            vector = new OpenLayers.Feature.Vector(geometry.clone(),
                vector, {
                    strokeColor: 'red',
                    strokeLinecap: 'round'
                });
            current.vectors.push(vector);

        } else {

            label = parseFloat(event.measure).toFixed(2) + "平方" + unints[event.units];
            var breakPoints = [];
            //线和圆圈部分
            if (geometry.components.length > 0 && geometry.components[0].components.length > 0) {
                for (var j = 0; j < geometry.components[0].components.length; j++) {
                    var c = geometry.components[0].components[j];
                    breakPoints.push(new OpenLayers.Geometry.Point(c.x, c.y));
                }
            }
            multiPoint = new OpenLayers.Geometry.MultiPoint(breakPoints);
            multiFeature = new OpenLayers.Feature.Vector(multiPoint, null, style);
            current.vectors.push(multiFeature);
            style = {
                strokeWidth: 1.5,
                strokeOpacity: 1,
                fillOpacity: 0.3,
                fillColor: "yellow",
                strokeColor: "#ff0000"
            };
            multiFeature = new OpenLayers.Feature.Vector(event.geometry.clone(), null, style);
            current.vectors.push(multiFeature);
            //总面积
            var bound = event.geometry.getBounds()
            var center = bound.getCenterLonLat();

            if (event.measure >= 1000) {
                iconUrl = "110_15.gif";
            } else if (event.measure >= 100) {
                iconUrl = "100_15.gif";
            } else if (event.measure >= 10) {
                iconUrl = "90_15.gif";
            } else {
                iconUrl = "80_15.gif";
            }
            var w_h = iconUrl.substring(0, iconUrl.indexOf('.')).split('_');
            var yOffset = 1.5;
            var style = {
                "label": label,
                "fontSize": 12,
                'fontColor': 'red',
                "fontFamily": "宋体",
                'labelXOffset': 0,
                'labelAlign': "cb",
                'labelYOffset': 4,
                'fontWeight': "bold",
                'labelSelect': true,
                'externalGraphic': OpenLayers.Util.getImageLocation(iconUrl),
                'graphicXOffset': -Number(w_h[0]) / 2,
                'graphicYOffset': -Number(w_h[1]),
                "graphicWidth": Number(w_h[0]),
                "graphicHeight": Number(w_h[1])
            };
            vector = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(center.lon, bound.top), null, style);
            current.vectors.push(vector);
            style = {
                graphicWidth: 12,
                graphicHeight: 12,
                graphicXOffset: Number(w_h[0]) / 2,
                graphicYOffset: -Number(w_h[1])
            };
            style.externalGraphic = OpenLayers.Util.getImageLocation("close.gif");
            vector = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(center.lon, bound.top), {
                current: current
            }, style);
            current.vectors.push(vector);
        }
        current.layer.addFeatures(current.vectors);
        current.success({
            measure: event.measure.toFixed(1),
            unit: (event.order == 1 ? '' : '平方') + unints[event.units]
        });
    },
    _measureProcess: function(event, current) {
        if (event.order === 1) {
            var unints = {
                'km': '千米',
                'm': '米'
            };
            var label = event.measure.toFixed(1) + unints[event.units];
            var style = {
                "pointRadius": 4,
                "graphicName": "circle",
                "fillColor": "white",
                "fillOpacity": 1,
                "strokeWidth": 1.5,
                "strokeOpacity": 1,
                "strokeColor": "red",
                "fontSize": 12,
                'fontColor': 'red',
                "fontFamily": "宋体",
            };
            if (event.measure.toFixed(1) === '0.0') {
                style["label"] = '起点';
                style['labelXOffset'] = 31;
                style['labelYOffset'] = 4;
                style['externalGraphic'] = OpenLayers.Util.getImageLocation("35_15.gif");
                style['graphicHeight'] = 15;
                style['graphicWidth'] = 35;
                style['graphicXOffset'] = 15;
                style['graphicYOffset'] = -10;
            }

            var vector = new OpenLayers.Feature.Vector(event.geometry.components[event.geometry.components.length - 1].clone(),
                null, style);
            current.vectors.push(vector);
            current.layer.addFeatures([vector]);
        }
    },
    /**
     * 清楚测量工具     
     */
    remove: function() {
        // for (var k in this._measureControls) {
        //     this._map.removeControl(this._measureControls[k]);
        // }

        if (this.currentControl && this.currentControl.handler) {
            this.currentControl.handler.finishGeometry();
        }



        this._measureLayer.removeAllFeatures();
        //this._map.removeLayer(this._measureLayer);
    },
    /**
     * 销毁函数
     * @return 
     */
    destory: function() {

        if (this.currentControl && this.currentControl.handler) {
            this.currentControl.handler.finishGeometry();
        }

        for (var k in this._measureControls) {
            this._map.removeControl(this._measureControls[k]);
        }
        this._measureLayer.removeAllFeatures();
        this._map.removeLayer(this._measureLayer);
    }
};