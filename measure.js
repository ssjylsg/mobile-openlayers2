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
            // pointRadius: 4,
            // graphicName: "circle",
            // fillColor: "white",
            // fillOpacity: 1,
            // strokeWidth: 0.5,
            // strokeOpacity: 1,
            // strokeColor: "red",
            // cursor: 'inherit'
            "pointRadius": 5,
            "graphicName": "circle",
            "fillColor": "red",
            "fillOpacity": 1,
            "strokeWidth": 1.5,
            "strokeOpacity": 1,
            "strokeColor": "red",
            "strokeDashstyle": "solid"
        },
        "Line": {
            strokeWidth: 1.5,
            strokeOpacity: 1,
            strokeColor: "red"
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
        var that = this;
        var current = {
            vectors: [],
            layer: this._measureLayer,
            map: this._map,
            remove: function() {

            },
            success: function(result) {
                control.deactivate();
                this.map.removeControl(control);
                if (callBack) {
                    callBack(result);
                }
            },
            popups: []
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
                "pointRadius": 5,
                "graphicName": "circle",
                "fillColor": "red",
                "fillOpacity": 1,
                "strokeWidth": 1.5,
                "strokeOpacity": 1,
                "strokeColor": "red",
                "strokeDashstyle": "solid"
            },
            prePoint = geometry.components[geometry.components.length - 2],
            point = geometry.components[geometry.components.length - 1],
            unints = {
                'km': '千米',
                'm': '米'
            };
        if (event.order === 1) {　

            if (geometry.components.length > 0) {
                for (var i = 0; i < geometry.components.length; i++) {
                    breakPoints.push(new OpenLayers.Geometry.Point(geometry.components[i].x, geometry.components[i].y));
                }
            }
            var multiPoint = new OpenLayers.Geometry.MultiPoint(breakPoints);

            multiFeature = new OpenLayers.Feature.Vector(multiPoint, null, {
                "pointRadius": 5,
                "graphicName": "circle",
                "fillColor": "red",
                "fillOpacity": 1,
                "strokeWidth": 1.5,
                "strokeOpacity": 1,
                "strokeColor": "red",
                "strokeDashstyle": "solid"
            });
            current.vectors.push(multiFeature);　
            vector = new OpenLayers.Feature.Vector(geometry.clone(),
                null, {
                    strokeColor: 'red',
                    strokeLinecap: 'round'
                });
            current.vectors.push(vector);

            var unints = {
                'km': '千米',
                'm': '米'
            };

            var label = '总长:' + event.measure.toFixed(1) + unints[event.units];
            var id = Math.random() + '';
            var html = '<div style="display: -webkit-box;"><div><span style="font-size: 12px;font-family: 微软雅黑;font-color:red">' + label + '</span>' +
                '</div><div class="olPopupCloseBox" style="width: 17px; height: 17px;  right: 5px; top: 5px;"  id="' + id + '""></div></div>';

            var xy = event.geometry.components[event.geometry.components.length - 1].clone();
            var marker = new OpenLayers.Popup.Anchored('npgis', new OpenLayers.LonLat(xy.x, xy.y),
                new OpenLayers.Size(80, 45), html, {
                    size: new OpenLayers.Size(1, 1),
                    offset: new OpenLayers.Pixel(12, -11)
                },
                false,
                function() {

                });
            marker.autoSize = true;
            current.map.addPopup(marker);
            current.popups.push(marker);
            var closeBox = document.getElementById(id);
            if (closeBox) {
                closeBox.addEventListener('click', function() {
                    current.popups.map(function(popup) {
                        current.map.removePopup(popup);
                    })
                    current.popups = [];
                    current.layer.destroyFeatures(current.vectors)
                    current.vectors = [];
                })
            }


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

            var label = '';
            if (event.measure.toFixed(1) === '0.0') {
                label = '起点';
            } else {
                label = event.measure.toFixed(1) + unints[event.units]
            }
            var html = '<span style="font-size: 12px;font-family: 微软雅黑;">' + label + '</span>';
            var xy = event.geometry.components[event.geometry.components.length - 1].clone();
            var id = Math.random() + '_npgis';
            var marker = new OpenLayers.Popup.Anchored(id, new OpenLayers.LonLat(xy.x, xy.y),
                new OpenLayers.Size(100, 50), html, {
                    size: new OpenLayers.Size(1, 1),
                    offset: new OpenLayers.Pixel(12, -11)
                },
                null, true);
            marker.autoSize = true;
            current.map.addPopup(marker);
            current.popups.push(marker);

            var pointFeature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(xy.x, xy.y), null, {
                "pointRadius": 5,
                "graphicName": "circle",
                "fillColor": "red",
                "fillOpacity": 1,
                "strokeWidth": 1.5,
                "strokeOpacity": 1,
                "strokeColor": "red",
                "strokeDashstyle": "solid"
            });
            current.vectors.push(pointFeature);
            current.layer.addFeatures([pointFeature]);
        }
    },
    /**
     * 清楚测量工具     
     */
    remove: function() {
        // for (var k in this._measureControls) {
        //     this._map.removeControl(this._measureControls[k]);
        // }

        if (this.currentControl && this.currentControl.handler && this.currentControl.handler.active) {
            this.currentControl.handler.finishGeometry();
        }

        var length = this._map.popups.length;
        while (length != 0) {
            this._map.removePopup(this._map.popups[length - 1]);
            length = this._map.popups.length;
        }


        this._measureLayer.removeAllFeatures();
        //this._map.removeLayer(this._measureLayer);
    },
    /**
     * 销毁函数
     * @return 
     */
    destory: function() {

        if (this.currentControl && this.currentControl.handler && this.currentControl.handler.active) {
            this.currentControl.handler.finishGeometry();
        }
        var length = this._map.popups.length;
        while (length != 0) {
            this._map.removePopup(this._map.popups[length - 1]);
            length = this._map.popups.length;
        }
        for (var k in this._measureControls) {
            this._map.removeControl(this._measureControls[k]);
        }
        this._measureLayer.removeAllFeatures();
        this._map.removeLayer(this._measureLayer);
    }
};