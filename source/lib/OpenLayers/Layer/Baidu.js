/**
 * 对自定义规则切割的图片进行拼装的类
 */
OpenLayers.Layer.Baidu = OpenLayers.Class(OpenLayers.Layer.TileCache, {
    trafficStatus: false,
    arrLineCap: ["round", "butt", "square"],
    arrLineJoin: ["miter", "round", "bevel"],
    curViewLabels: [],
    isLabelTimeout: false,
    labelCount: 0,
    iconCache: {},
    isIphone: true,
    trafficInterval: 300000,
    trafficTimeStamp: 0,
    onlineUrl:["http://mapor0.bdimg.com/pvd/?qt=tile&x=${x}&y=${y}&z=${z}&styles=pl&p=1&limit=80&v=088&udt=20170216"],
    iconURLs: ['/mobile/dist/baiduImg/'], //["//mapor0.bdimg.com/sty/vpl_icons/", "//mapor0.bdimg.com/sty/vpl_icons/"],
    initialize: function(name, url, options) {
        var tempoptions = OpenLayers.Util.extend({
            'format': 'image/png',
            isBaseLayer: true
        }, options);
        OpenLayers.Layer.TileCache.prototype.initialize.apply(this, [name, url, {},
            tempoptions
        ]);
        this.extension = this.format.split('/')[1].toLowerCase();
        this.extension = (this.extension === 'jpg') ? 'jpeg' : this.extension;
        this.transitionEffect = "resize";
        this.buffer = 0;
        if (!OpenLayers.Util.isArray(this.url)) {
            this.url = [this.url];
        }
        if (!this.isVectorLayer) {
            return;
        }
        this.featureStyle = window.FeatureStyle;
        this.ratio = 2;
        this.iconSetInfoHigh = window.iconSetInfo_high;
        var temp = OpenLayers._getScriptLocation() + 'baiduImg/';
        this.iconURLs = [temp];
    },
    currentZoom: null,
    setMap: function(map) {
        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        if (!this.isBaseLayer) {
            this.setZIndex(parseInt(this.map.baseLayer.getZIndex()) + 1);
        }

        if (!this.isVectorLayer) {
            return;
        }
        map.viewPortDiv.style.backgroundColor = 'rgb(245, 243, 240)'
        map.events.register("moveend", this, function(opt) {
            if (this.currentZoom != this.map.getZoom()) {
                this.clearLabel();
                this.currentZoom = this.map.getZoom();
            }

            this.moveGriddedTiles(true);

        });
        map.config = {
            trafficStatus: false
        };
        this._opts = {
            maxZoom: map.maxZoom
        }
        var that = this;
        this.mapType = {
            getZoomUnits: function(t) {
                var e = 18;
                return Math.pow(2, e - t)
            }
        }


        var a = 2;
        var labelCanvas = document.createElement('canvas');

        labelCanvas.style.position = 'absolute';
        labelCanvas.style.top = '0';
        labelCanvas.style.left = '0';
        labelCanvas.style.width = map.viewPortDiv.offsetWidth + 'px';
        labelCanvas.style.height = map.viewPortDiv.offsetHeight + 'px';
        //labelCanvas.style.display = 'none';
        labelCanvas.width = map.viewPortDiv.offsetWidth * a;
        labelCanvas.height = map.viewPortDiv.offsetHeight * a;
        labelCanvas.style.zIndex = 2;
        labelCanvas.textBaseline = "top";



        this.labelCanvas = labelCanvas;
        this.div.appendChild(labelCanvas);
        this.labelCtx = labelCanvas.getContext('2d');
        this.labelCtx.scale(a, a);
        this.labelCanvas.id = "biaozhu";


    },
    /**
     * 按地图引擎切图规则实现的拼接方式
     */
    getURL: function(bounds, isRemove) {

        var tilez = this.map.zoom - 1;
        var res = this.map.getResolution();

        var size = this.tileSize;
        var bx = Math.round((bounds.left - this.tileOrigin.lon) / (res * size.w));
        var by = Math.round((bounds.bottom - this.tileOrigin.lat) / (res * size.h)) + (isRemove ? 0 : 0);
        tilez = tilez + 1;

        var x = bx.toString().replace("-", "M");
        var y = by.toString().replace("-", "M");

        var urlsNum = Math.abs((bx + by) % this.url.length);
        return OpenLayers.String.format(this.url[urlsNum], {
            'x': x,
            'y': y,
            'z': tilez
        });
    },
    formatUrl: function(x, y, z) {
        var urlsNum = Math.abs((x + y) % this.url.length);
        return OpenLayers.String.format(this.url[urlsNum], {
            'x': x,
            'y': y,
            'z': z
        });
    },
    clone: function(obj) {
        if (obj == null) {
            obj = new OpenLayers.Layer.Baidu(this.name, this.url, this.options);
        }
        obj = OpenLayers.Layer.TileCache.prototype.clone.apply(this, [obj]);
        return obj;
    },
    clearLabel: function() {
        this.labelCanvas.getContext('2d').clearRect(0, 0, this.labelCanvas.width, this.labelCanvas.height);
    },
    drawIconAndText: function(t) {
        var l = 1;
        for (var e = this.labelCtx, a = (this.ratio,
                0), i = t.length; i > a; a++) {
            var r = t[a];
            if (r.isDel === !1) {
                var n = r.baseDrawX,
                    s = r.baseDrawY;
                if ("fixed" === r.type) {
                    var o = r.iconPos,
                        h = r.textPos,
                        d = r.style0,
                        f = r.style1;
                    if (o) {
                        var v = d[1],
                            c = o.width,
                            u = o.height;
                        this.drawIcon(e, v, n, s, c, u)
                    }
                    if (h) {
                        var p = void 0;
                        p = f && f[0] === l ? f : d;
                        var g = p[4],
                            w = p[5],
                            m = p[6];
                        m && (e.fillStyle = "rgba(" + w + ")",
                                e.fillRect(r.minX, r.minY, r.maxX - r.minX, r.maxY - r.minY)),
                            e.font = this.getFont(p),
                            e.fillStyle = "rgba(" + g + ")";
                        var b = r.name.split("$"),
                            y = h[0];
                        if (w && (e.strokeStyle = "rgba(" + w + ")",
                                e.strokeText(b[0], y.drawX, y.drawY + 11)),
                            e.fillText(b[0], y.drawX, y.drawY + 11),
                            2 === h.length) {
                            var x = h[1];
                            w && e.strokeText(b[1], x.drawX, x.drawY + 11),
                                e.fillText(b[1], x.drawX, x.drawY + 11)
                        }
                    }
                } else if ("line" === r.type) {
                    var T = r.wordsInfo,
                        C = r.tileX,
                        L = r.tileY,
                        P = r.style,
                        g = P[4],
                        w = P[5];
                    e.font = this.getFont(P),
                        e.fillStyle = "rgba(" + g + ")";
                    for (var I = 0, S = T.length; S > I; I++) {
                        var X = T[I],
                            Y = C + X.destX,
                            _ = L + X.destY,
                            D = X.angle,
                            M = X.wd;
                        if (D > 10 && 350 > D) {
                            e.save();
                            var k = Y + X.width / 2,
                                O = _ + X.height / 2;
                            e.translate(k, O),
                                e.rotate(-D / 180 * Math.PI),
                                e.fillText(M, -X.width / 2, -X.height / 2),
                                e.restore()
                        } else
                            w && (e.strokeStyle = "rgba(" + w + ")",
                                e.strokeText(M, Y, _)),
                            e.fillText(M, Y, _)
                    }
                } else if ("biaopai" === r.type) {
                    var V = r.name,
                        P = r.style,
                        v = P[1],
                        F = r.pos,
                        c = F.width,
                        u = F.height,
                        z = {
                            name: V,
                            style: P,
                            callback: this.drawBiaoPaiText
                        };
                    this.drawIcon(e, v, n, s, c, u, z)
                }
            }
        }
    },
    drawBiaoPaiText: function(t, e, a, i) {
        var r = t.labelCtx,
            n = i.name,
            s = i.style,
            o = s[5];
        r.font = t.getBiaoPaiFont(),
            r.fillStyle = "rgba(" + o + ")",
            r.fillText(n, e, a + 10.5)
    },
    drawIcon: function(t, e, a, i, r, n, s) {
        if (s) {
            //  console.log(s);
        }
        var o = this,
            l = a - r / 2,
            h = i - n / 2;
        if (o.iconCache[e])
            t.drawImage(o.iconCache[e], l, h, r, n),
            s && s.callback(o, l, h, s);
        else {
            var d = o.getIconUrl(e),
                f = new Image,
                v = o.map,
                c = v.getCenter(),
                u = v.getZoom();
            f.onload = function() {
                    o.iconCache[e] = this;
                    var a = v.getCenter(),
                        i = v.getZoom();
                    a.equals(c) && u === i && (t.drawImage(this, l, h, r, n),
                            s && s.callback(o, l, h, s)),
                        f.onload = null,
                        delete f.onload
                },
                f.src = d
        }
    },
    createLabelCanvas: function() {
        var t = this.map,
            e = t.tileMgr,
            a = this.ratio,
            i = t.getSize(),
            r = i.width,
            n = i.height,
            o = s.create("canvas"),
            l = o.style;
        l.cssText = "position: absolute;left:0;top:0;width:" + r + "px;height:" + n + "px;z-index:2;",
            o.width = r * a,
            o.height = n * a,
            this.labelCanvas = o,
            this.labelCtx = o.getContext("2d"),
            this.labelCtx.scale(a, a),
            this.labelCtx.textBaseline = "top",
            e._vectorLayerContainer.appendChild(o),
            t._labelCanvas = o
    },
    titlesCanvas: [],
    tilesInfo: [],
    objInCanvas: {},
    createBgCanvas: function(postion) {
        var canvas = document.createElement('canvas');

        canvas.style.background = "#F5F3F0";
        canvas.style.position = 'absolute';
        canvas.style.width = '256px';
        canvas.style.height = '256px';
        canvas.width = 512;
        canvas.height = 512;

        this.div.appendChild(canvas);
        return canvas;
    },
    setTrafficOff: function() {
        this.map.config.trafficStatus = false;
        this.reDrawVectorMap();
    },
    setTrafficOn: function() {
        this.map.config.trafficStatus = true;
        this.reDrawVectorMap();
    },
    reDrawVectorMap: function() {
        for (var i = 0; i < this.div.childNodes.length; i++) {
            if (this.div.childNodes[i].id != "biaozhu") {
                this.div.childNodes[i]._drawFinished = false;
            }
        }
        this.moveGriddedTiles(true);
    },
    getTilesInfo: function() {
        this.tilesInfo = [];
        var L = this.objInCanvas;
        if (L) {
            for (var P in L)
                delete L[P];
        } else {
            this.objInCanvas = {};
        }


        var zoom = this.map.getZoom();
        var resolution = this.resolutions[zoom];
        var bounds = this.map.getExtent();
        var size = this.tileSize;
        var center = this.map.getCenter();
        this.titlesCanvas = [];
        var imageDatas = [];
        for (var i = 0; i < this.div.childNodes.length; i++) {
            if (this.div.childNodes[i].id != "biaozhu") {
                this.titlesCanvas.push(this.div.childNodes[i]);
            }
        }

        var minRow = Math.floor((bounds.left - this.tileOrigin.lon) / (resolution * 256));
        var maxCol = Math.ceil((bounds.top - this.tileOrigin.lat) / (resolution * 256));
        var maxRow = Math.ceil((bounds.right + this.tileOrigin.lon) / (resolution * 256));
        var minCol = Math.floor((bounds.bottom - this.tileOrigin.lat) / (resolution * 256));

        for (var i = minRow; i < maxRow + 1; i++) {
            for (var j = minCol; j < maxCol + 1; j++) {
                var left = i * (resolution * size.w) - 0;
                var right = (i + 1) * (resolution * size.w) - 0;
                var top = (j + 1) * (resolution * size.w);
                var bottom = (j) * (resolution * size.w);
                var tbound = new OpenLayers.Bounds(left, bottom, right, top);
                var lt = this.map.getPixelFromLonLat(new OpenLayers.LonLat(left, top));
                var url = this.getURL(tbound, true);

                var bx = Math.round((tbound.left - this.tileOrigin.lon) / (resolution * size.w));
                var by = Math.round((tbound.bottom - this.tileOrigin.lat) / (resolution * size.h));


                var tileCenter = tbound.getCenterLonLat();
                imageDatas.push({
                    key: zoom + "_" + bx + "_" + by,
                    i: i,
                    j: j,
                    zoom: zoom,
                    postion: {
                        x: lt.x,
                        y: lt.y
                    },
                    distance: Math.pow(tileCenter.lon - center.lon, 2) +
                        Math.pow(tileCenter.lat - center.lat, 2)
                });
            }
        }
        imageDatas.sort(function(a, b) {
            return b.distance - a.distance;
        });

        var arrOutCanvas = [];
        for (var i = this.titlesCanvas.length - 1; i >= 0; i--) {
            this.titlesCanvas[i]._isInCurrentView = false;

            for (var j = imageDatas.length - 1; j >= 0; j--) {
                if (this.titlesCanvas[i].id == imageDatas[j].key) {
                    this.titlesCanvas[i]._isInCurrentView = true;
                    //   this.titlesCanvas[i]._drawFinished = true;
                    this.objInCanvas[this.titlesCanvas[i].id] = this.titlesCanvas[i];
                    break;
                }
            }
        }

        for (var i = this.titlesCanvas.length - 1; i >= 0; i--) {
            var Y = this.titlesCanvas[i];
            Y._isInCurrentView || (Y._vtd = null, Y.image = null, delete Y.image,
                delete Y._vtd,
                Y._drawFinished = !1,
                arrOutCanvas.push(Y))
        }

        for (var i = imageDatas.length - 1; i >= 0; i--) {
            var o = this.objInCanvas[imageDatas[i].key];
            var image = imageDatas[i];
            if (o) {
                if (o._drawFinished) {
                    o._vtd && o._vtd._arrLabelInfo && this.curViewLabels.push(o._vtd._arrLabelInfo)
                } else {
                    o._vtd = null, delete o._vtd, this.tilesInfo.push(o)
                }

            } else {
                if (arrOutCanvas.length > 0) {
                    o = arrOutCanvas.shift();
                    o.getContext('2d').clearRect(0, 0, 256, 256);
                } else {
                    o = this.createBgCanvas();
                }

                o.image = image;
                o.id = image.key;
                this.tilesInfo.push(o);
            }

            o.style.top = (image.postion.y - parseFloat(this.map.layerContainerDiv.style.top.replace("px", ""))) + "px";
            o.style.left = (image.postion.x - parseFloat(this.map.layerContainerDiv.style.left.replace("px", ""))) + "px";
            o.style.visibility = "";
        }
        for (var i = arrOutCanvas.length - 1; i >= 0; i--) {
            arrOutCanvas[i].style.visibility = "hidden";
        }
        return this.tilesInfo;
    },
    request: function(e) {
        var t = document.createElement('script');
        t.src = e;
        t.type = "text/javascript";
        t.charset = "utf-8";
        t.addEventListener("load", function(e) {
                var t = e.target;
                t.parentNode.removeChild(t)
            }, !1),
            document.getElementsByTagName("head")[0].appendChild(t),
            t = null
    },
    loadData: function(tile, zoom) {
        tile._drawFinished = false;
        if (!tile.image) {
            return;
        }
        var g = "_" + parseInt(tile.image.i + "" + tile.image.j).toString(36);
        var that = {
            image: tile.image,
            layer: this,
            canvas: tile
        };
        window[g] = function(r) {
            var z = that.layer.map.getZoom();
            if (z == zoom) {
                var f = r,
                    s = that.layer,
                    v = s.map.config.trafficStatus;

                content = that.canvas.getContext('2d');               

                v && (f = r[0], f.trafficData = r[1]),
                    s.drawBackGround(f, that.canvas, that.image.i, that.image.j, that.image.zoom, s.map.getCenter());

                var c = s.calcIconAndTextInfo(f, that.image.i, that.image.j, that.image.zoom);
                f._arrLabelInfo = c,
                    that.canvas._vtd = f,
                    c._bounds = that.image.bounds,
                    s.curViewLabels.push(c),
                    s.isLabelTimeout === !1 && s.labelCount--,
                    (0 === s.labelCount || s.isLabelTimeout === !0) && s.updateLabel()

                delete window[g]
            }
        };
        var w = this.map.config.trafficStatus ? "&trafficstamp=" + this.trafficTimeStamp + "&" : "&";
        this.request(this.formatUrl(tile.image.i, tile.image.j, tile.image.zoom) + w + "fn=window." + g)
    },
    moveGriddedTiles: function(isClear) {
        if (!this.isVectorLayer) {
            OpenLayers.Layer.Grid.prototype.moveGriddedTiles.call(this);
            return;
        }
        if (!isClear) {
            return;
        }
        this.labelCount = 0;
        this.isLabelTimeout = !1;
        this.curViewLabels = [];

        var zoom = this.map.getZoom();
        var tiles = this.getTilesInfo();
        if (tiles.length == 0) {
            this.updateLabel();
            return;
        }

        var t = this;
        var s = (new Date).getTime();
        s - t.trafficTimeStamp >= t.trafficInterval && (t.trafficTimeStamp = s);

        this.labelCount = tiles.length;
        for (var i = 0, ii = tiles.length; i < ii; ++i) {
            this.loadData(tiles[i], zoom);
        }
        window.clearTimeout(this.timeout);
        var that = this;
        this.timeout = setTimeout(function() {
            that.labelCount = 0;
            that.isLabelTimeout = !1;
            that.updateLabel();
        }, 1000);
    },
    drawBackGround: function(t, e, a, i, r, n) {
        var s = this,
            o = e.getContext('2d');
        s.ratio > 1 && !e._scale && (o.scale(s.ratio, s.ratio),
            e._scale = !0);
        var l = s.featureStyle || (s.featureStyle = window.FeatureStyle, window.FeatureStyle),
            h = s.tileSize.w;
        if (!l) {
            l = window.FeatureStyle;
        }
        o.fillStyle = "#F5F3F0";
        o.fillRect(0, 0, h, h);
        var v = 5;
        var c = 6;
        for (var d = t[2] || [], f = [], u = [], p = 0, g = d.length; g > p; p++) {
            var w = d[p];
            if (!w) {
                // console.log(w);
            }
            var m = l[w[5]];
            m[0] === v ? (w = s.parseFeature(w, h),
                w.style0 = m,
                w[4] && "090301" === w[4] ? f.push(w) : s.drawPolygon(o, w)) : m[0] === c && (w = s.parseFeature(w, h),
                w.style0 = m,
                u.push(w))
        }
        setTimeout(function() {
            var l = s.map.getCenter(),
                h = s.map.getZoom();
            //l.equals(n) && 
            h === r && s.drawRoads(o, t, e, f, u, a, i, r)
        }, 1)

    },
    drawRoads: function(t, e, a, i, r, n, s, o) {
        var f = 4;
        for (var l = this, h = l.featureStyle, d = l.tileSize.w, v = e[1] || [], c = [], u = [], p = [], g = {
                crossoverBridge: [],
                underGroundRoad: []
            }, w = 0, m = v.length; m > w; w++) {
            var b = v[w],
                y = b[5],
                x = y.split(","),
                T = null,
                C = null,
                L = x.length;
            1 == L ? T = h[x[0]] : 2 == L ? (T = h[x[0]],
                    C = h[x[1]]) : 3 == L && (T = h[x[0]],
                    C = h[x[1]]),
                T && T[0] === f && (b = l.parseFeature(b, d),
                    b.style0 = T,
                    b.style1 = C,
                    o >= 17 && ("1.0,6.0" === T[3] || "1.0,10.0" === T[3]) && (T[3] = null),
                    b[4] && b[4].indexOf("050202") > -1 ? u.push(b) : o >= 17 && b[4] && b[4].indexOf("040C05") > -1 ? g.crossoverBridge.push(b) : o >= 17 && b[4] && b[4].indexOf("040C04") > -1 ? g.underGroundRoad.push(b) : c.push(b)),
                o >= 18 && b[10] && b[10].length > 0 && p.push(b[10])
        }
        for (var P = g.underGroundRoad, w = 0, m = P.length; m > w; w++) {
            var I = P[w];
            this.drawPolyline(t, I[0], I.style0)
        }
        for (var w = 0, m = P.length; m > w; w++) {
            var I = P[w];
            this.drawPolyline(t, I[0], I.style1)
        }
        l.renderRoad(t, c, 0, function() {
            for (var n = g.crossoverBridge, s = 0, f = n.length; f > s; s++) {
                var v = n[s];
                l.drawPolyline(t, v[0], v.style0)
            }
            for (var s = 0, f = n.length; f > s; s++) {
                var v = n[s];
                l.drawPolyline(t, v[0], v.style1)
            }
            if (o >= 17)
                for (var c = e[3] || [], s = 0, f = c.length; f > s; s++) {
                    var w = l.parseFeature(c[s], d),
                        m = w[5],
                        b = m.split(","),
                        y = h[b[0]];
                    X = h[b[1]],
                        l.drawPolyline(t, w[0], y),
                        l.drawPolyline(t, w[0], X)
                }
            if (o >= 18) {
                t.strokeStyle = "rgba(0,0,0,0.3)",
                    t.fillStyle = "rgba(0,0,0,0.3)",
                    t.lineWidth = 1.5,
                    t.lineCap = "butt",
                    t.lineJoin = "miter";
                for (var s = 0, f = p.length; f > s; s++)
                    for (var x = p[s], T = 0, C = x.length; C > T; T++) {
                        var L = x[T],
                            P = L[0],
                            I = P[0][0],
                            S = P[1][0];
                        I[1] = d - I[1],
                            S[1] = d - S[1],
                            l.drawArrow(t, I, S, t.lineWidth)
                    }
                for (var s = 0, f = r.length; f > s; s++) {
                    var w = r[s];
                    l.draw3DBuilding(t, w)
                }
            }
            if (o >= 12) {
                for (var s = 0, f = u.length; f > s; s++) {
                    var w = u[s],
                        y = w.style0,
                        X = w.style1;
                    l.isDashedLine(y, X) ? l.drawDashedPolyline(t, w[0], y, X) : (l.drawPolyline(t, w[0], w.style0),
                        l.drawPolyline(t, w[0], w.style1))
                }
                for (var s = 0, f = i.length; f > s; s++)
                    l.drawPolygon(t, i[s])
            }
            var Y = l.map.config.trafficStatus;
            Y && e.trafficData && l.drawTraffic(t, e.trafficData),
                a._drawFinished = !0
        })
    },
    parseFeature: function(t, e) {
        for (var a = t[0], i = 0, r = 0, n = 0, s = a.length; s > n; n++)
            i += a[n][0],
            r += a[n][1],
            a[n][0] = i,
            a[n][1] = e - r;
        return t
    },
    parseTrafficFeature: function(t) {
        for (var e = t[1], a = 0, i = 0, r = 0, n = e.length; n > r; r += 2)
            a += e[r] / 10,
            i += e[r + 1] / 10,
            e[r] = a,
            e[r + 1] = i;
        return t
    },
    drawPolygon: function(t, e) {
        var a = e.style0,
            i = a[1],
            r = e[0];
        t.fillStyle = "rgba(" + i + ")",
            t.strokeStyle = t.fillStyle,
            t.beginPath(),
            t.moveTo(r[0][0], r[0][1]);
        for (var n = 1, s = r.length; s > n; n++)
            t.lineTo(r[n][0], r[n][1]);
        t.closePath(),
            t.fill();
        var o = a[3];
        o && (t.lineWidth = o,
            t.stroke())
    },
    drawPolyline: function(t, e, a) {
        t.beginPath(),
            t.moveTo(e[0][0], e[0][1]);
        for (var i = 1, r = e.length; r > i; i++)
            t.lineTo(e[i][0], e[i][1]);
        t.strokeStyle = "rgba(" + a[1] + ")",
            t.lineCap = this.arrLineCap[a[4]],
            t.lineJoin = this.arrLineJoin[a[5]],
            t.lineWidth = a[2],
            t.stroke()
    },
    renderRoad: function(t, e, a, i) {
        var r = e.length,
            n = a;
        if (r > n) {
            for (var s = e[a], o = s[4], l = this.getRoadLevel(o), h = n + 1; r > h; h++) {
                var d = e[h],
                    f = d[4],
                    v = this.getRoadLevel(f);
                if (l !== v)
                    break
            }
            for (var c = h, u = n; c > u; u++) {
                var p = e[u],
                    g = p.style0,
                    w = p.style1;
                this.isDashedLine(g, w) ? p.isDashed = !0 : this.drawPolyline(t, p[0], g)
            }
            for (var u = n; c > u; u++) {
                var p = e[u],
                    g = p.style0,
                    w = p.style1;
                p.isDashed ? this.drawDashedPolyline(t, p[0], g, w) : w && this.drawPolyline(t, p[0], w)
            }
            var m = this;
            setTimeout(function() {
                m.renderRoad(t, e, c, i)
            }, 1)
        } else
            i && i()
    },
    getRoadLevel: function(t) {
        return t && t.indexOf("0C08") > -1 ? 8 : t && (t.indexOf("jct") > -1 || t.indexOf("0C01") > -1) ? 1 : 0
    },
    isDashedLine: function(t, e) {
        return t[3] && t[3].length > 0 || e && e[3] && e[3].length > 0 ? !0 : !1
    },
    drawDashedPolyline: function(t, e, a, i) {
        var r, n, s, o, l, h, d, f, v;
        i && i[3] && i[3].length > 0 ? (r = a[2],
                n = i[2],
                s = "rgba(" + a[1] + ")",
                o = "rgba(" + i[1] + ")",
                arrDash = i[3].split(","),
                l = arrDash[0],
                h = this.arrLineCap[a[4]],
                d = this.arrLineCap[i[4]],
                f = this.arrLineJoin[a[5]],
                v = this.arrLineJoin[i[5]]) : (r = a[2],
                n = r,
                s = "rgba(0,0,0,0)",
                o = "rgba(" + a[1] + ")",
                arrDash = a[3].split(","),
                l = arrDash[0],
                h = this.arrLineCap[a[4]],
                d = h,
                f = this.arrLineJoin[a[5]],
                v = f),
            t.beginPath(),
            t.lineWidth = r,
            t.strokeStyle = s,
            t.lineCap = h,
            t.lineJoin = f,
            t.moveTo(e[0][0], e[0][1]);
        for (var c = 1, u = e.length; u > c; c++)
            t.lineTo(e[c][0], e[c][1]);
        if (t.stroke(),
            t.beginPath(),
            t.lineWidth = n,
            t.strokeStyle = o,
            t.lineCap = d,
            t.lineJoin = v,
            this.isSupportDashedLine) {
            t.save(),
                t.setLineDash(arrDash),
                t.lineDashOffset = 0,
                t.moveTo(e[0][0], e[0][1]);
            for (var c = 1, u = e.length; u > c; c++)
                t.lineTo(e[c][0], e[c][1]);
            t.stroke(),
                t.restore()
        } else {
            for (var p = !0, c = 0, u = e.length; u - 1 > c; c++) {
                var g = e[c][0],
                    w = e[c][1],
                    m = e[c + 1][0],
                    b = e[c + 1][1],
                    y = m - g,
                    x = b - w,
                    T = 0 !== y ? x / y : x > 0 ? 1e15 : -1e15,
                    C = Math.sqrt(y * y + x * x),
                    L = l;
                for (t.moveTo(g, w); C >= .1;) {
                    L > C && (L = C);
                    var P = Math.sqrt(L * L / (1 + T * T));
                    0 > y && (P = -P),
                        g += P,
                        w += T * P,
                        t[p ? "lineTo" : "moveTo"](g, w),
                        C -= L,
                        p = !p
                }
            }
            t.stroke()
        }
    },
    drawArrow: function(t, e, a, i) {
        t.beginPath(),
            t.moveTo(e[0], e[1]),
            t.lineTo(a[0], a[1]),
            t.stroke();
        var r = this.calcArrowPts(e, a, i),
            n = r[0],
            s = r[1];
        t.beginPath(),
            t.moveTo(n[0], n[1]),
            t.lineTo(s[0], s[1]),
            t.lineTo(a[0], a[1]),
            t.closePath(),
            t.stroke()
    },
    calcArrowPts: function(t, e, a) {
        var i = 3.5 * Math.pow(a, .8),
            r = .3,
            n = e[1] - t[1],
            s = e[0] - t[0],
            o = 1.8 * Math.sqrt(s * s + n * n),
            l = e[0] + s / o * i,
            h = e[1] + n / o * i,
            d = Math.atan2(n, s) + Math.PI,
            f = [l + i * Math.cos(d - r), h + i * Math.sin(d - r)],
            v = [l + i * Math.cos(d + r), h + i * Math.sin(d + r)];
        return [f, v]
    },
    draw3DBuilding: function(t, e) {
        var a = e[0],
            i = e.style0,
            r = "rgba(" + i[1] + ")",
            n = "rgba(" + i[2] + ")",
            s = i[3];
        t.beginPath(),
            t.moveTo(a[0][0], a[0][1]);
        for (var o = 1, l = a.length; l > o; o++)
            t.lineTo(a[o][0], a[o][1]);
        t.closePath(),
            t.strokeStyle = n,
            t.lineWidth = s,
            t.fillStyle = r,
            t.stroke(),
            t.fill()
    },
    drawTraffic: function(t, e) {
        for (var a = (this.tileSize.w,
                0), i = e.length; i > a; a++) {
            var r = this.parseTrafficFeature(e[a]),
                n = r[1],
                s = (this.arrTrafficStyles[r[2]],
                    this.arrTrafficStyles[r[3]]);
            t.beginPath(),
                t.moveTo(n[0], n[1]);
            for (var o = 2, l = n.length; l > o; o += 2)
                t.lineTo(n[o], n[o + 1]);
            t.strokeStyle = "rgba(255,255,255,1)",
                t.lineWidth = 4,
                t.lineCap = "butt",
                t.lineJoin = "miter",
                t.stroke(),
                t.strokeStyle = "rgba(" + s[1] + ")",
                t.lineWidth = s[2],
                t.lineCap = this.arrLineCap[s[3]],
                t.lineJoin = this.arrLineJoin[s[4]],
                t.stroke()
        }
    },
    calcIconAndTextInfo: function(t, e, a, i) {
        var r = this,
            n = r.featureStyle,
            s = this.tileSize.w,
            l = 1,
            o = 0,
            d = 3,
            h = 2,
            //y = [0,"busstop_2"],
            f = [];
        f.x = e,
            f.y = a,
            f.z = i;
        for (var v = t[0] || [], c = 0, u = v.length; u > c; c++) {
            var p = v[c],
                g = p[5],
                w = p[2],
                m = p[4],
                b = g.split(","),
                y = n[b[0]],
                x = null,
                T = p[6],
                C = p[1];
            if (p[0][1] = s - p[0][1],
                2 == b.length && (x = n[b[1]]),
                x && x[0] !== l && y[0] === l) {
                var L = x;
                x = y,
                    y = L
            }
            var P = {
                    type: "fixed",
                    name: w,
                    rank: p[3],
                    catalog: m,
                    baseX: p[0][0],
                    baseY: p[0][1],
                    iconPos: null,
                    textPos: null,
                    guid: C,
                    style0: y,
                    style1: x
                },
                I = w.split("$");
            if (y && y[0] === o && x && x[0] === l) {
                var S = this.calcIconPos(p, y),
                    X = S.width,
                    Y = S.height;
                P.iconPos = S;
                var _ = this.calcTxtSize(I, x);
                i >= 3 && 9 >= i ? 0 === T ? (P.textPos = this.calcTextPosTop(p, _, Y),
                    P.textDirTop = !0) : 1 === T ? (P.textPos = this.calcTextPosBottom(p, _, Y),
                    P.textDirBottom = !0) : 2 === T ? (P.textPos = this.calcTextPosLeft(p, _, X),
                    P.textDirLeft = !0) : P.textPos = this.calcTextPos(p, _, X) : (12 === i && "65e1ee886c885190f60e77ff" === C && (T = 1),
                    T ? (P.textPos = this.calcTextPosLeft(p, _, X),
                        P.textDirLeft = !0) : P.textPos = this.calcTextPos(p, _, X))
            } else if (y && y[0] === o)
                P.iconPos = this.calcIconPos(p, y);
            else if (y && y[0] === l) {
                var _ = this.calcTxtSize(I, y);
                P.textPos = this.calcTextPos(p, _)
            } else
                P = null;
            P && f.push(P)
        }
        for (var D = t[5] || [], c = 0, u = D.length; u > c; c++) {
            var M = D[c],
                g = M[5],
                b = g.split(",");
            if (3 === b.length) {
                var k = this.featureStyle[b[2]];
                k && (k[0] === d ? this.addLineTextPos(f, M, k, s) : k[0] === h && this.addLineBiaoPaiPos(f, M, k, s))
            }
        }
        return f
    },
    addLineTextPos: function(t, e, a, i) {
        for (var r = e[2].split(""), n = [], s = 0, o = r.length; o > s; s++) {
            var l = this.calcTxtSize(r[s], a);
            n.push(l)
        }
        for (var h = e[8], s = 0, o = h.length; o > s; s++) {
            var d = [],
                f = h[s],
                v = 1 === f[1] ? !0 : !1,
                c = f[0];
            v && (r.reverse(),
                n.reverse());
            for (var u = c[0][0][0], p = i - c[0][0][1], g = 0, w = n[g][0], m = u - w[0] / 2, b = p - w[1] / 2, y = m + w[0], x = b + w[1], T = 0, C = c.length; C > T; T++) {
                w = n[g][0];
                var L = c[T],
                    P = w[0],
                    I = w[1],
                    S = L[0][0] - P / 2,
                    X = i - L[0][1] - I / 2,
                    Y = {
                        wd: r[g],
                        angle: L[1],
                        destX: S,
                        destY: X,
                        width: P,
                        height: I
                    };
                m > S && (m = S),
                    b > X && (b = X),
                    S + P > y && (y = S + P),
                    X + I > x && (x = X + I),
                    d.push(Y),
                    g++
            }
            var _ = {
                type: "line",
                rank: e[3],
                baseX: u,
                baseY: p,
                wordsInfo: d,
                _minX: m,
                _minY: b,
                _maxX: y,
                _maxY: x,
                style: a
            };
            t.push(_)
        }
    },
    addLineBiaoPaiPos: function(t, e, a, i) {
        if (!this.iconSetInfoHigh) {
            this.iconSetInfoHigh = window.iconSetInfo_high;
        }
        var r = e[2],
            n = e[8],
            s = n[0],
            o = s[0],
            l = o[0][0][0],
            h = i - o[0][0][1],
            d = a[1],
            f = this.iconSetInfoHigh[d],
            v = Math.ceil(f[3] / 2);
        this.labelCtx.font = this.getBiaoPaiFont();
        var c = this.labelCtx.measureText(r).width,
            u = {
                type: "biaopai",
                name: r,
                rank: e[3],
                baseX: l,
                baseY: h,
                pos: {
                    destX: l - c / 2,
                    destY: h - v / 2,
                    width: c,
                    height: v
                },
                style: a
            };
        t.push(u)
    },
    getFont: function(t) {
        var e = [],
            a = 1 === t[1] ? "italic" : "",
            i = t[3];
        return e.push(a),
            this.isIphone ? (e.push("bold"),
                e.push(i + "px"),
                e.push("arial,黑体")) : (e.push(i + "px"),
                e.push("黑体")),
            e.join(" ")
    },
    getBiaoPaiFont: function() {
        var t = 11,
            e = [];
        return this.isIphone ? (e.push("bold"),
                e.push(t + "px"),
                e.push("arial,黑体")) : (e.push(t + "px"),
                e.push("黑体")),
            e.join(" ")
    },
    calcTxtSize: function(t, e) {
        var a = [],
            i = this.labelCtx;
        i.font = this.getFont(e);
        var r = e[3];
        if (t.length > 1) {
            var n = t[0],
                s = t[1],
                o = i.measureText(n).width,
                l = i.measureText(s).width;
            a.push([o, r], [l, r])
        } else {
            var h = t[0],
                o = i.measureText(h).width;
            a.push([o, r])
        }
        return a
    },
    calcIconPos: function(t, e) {
        var a = t[0],
            i = a[0],
            r = a[1],
            n = e[1];
        isNaN(n[0]) || (n = "_" + n);
        var s = this.iconSetInfoHigh[n],
            o = s[2] / 2,
            l = s[3] / 2;
        return {
            destX: i - o / 2,
            destY: r - l / 2,
            width: o,
            height: l
        }
    },
    calcTextPos: function(t, e, a) {
        var i = [],
            r = t[0],
            n = r[0],
            s = r[1];
        if (e.length <= 1) {
            var o = e[0],
                l = a ? a / 2 : -o[0] / 2,
                h = {
                    destX: n + l,
                    destY: s - o[1] / 2,
                    width: o[0],
                    height: o[1]
                };
            i.push(h)
        } else {
            var o = e[0],
                l = a ? a / 2 : -o[0] / 2,
                h = {
                    destX: n + l,
                    destY: s - o[1],
                    width: o[0],
                    height: o[1]
                },
                d = e[1],
                f = a ? a / 2 : -d[0] / 2,
                v = {
                    destX: n + f,
                    destY: s,
                    width: d[0],
                    height: d[1]
                };
            i.push(h),
                i.push(v)
        }
        return i
    },
    calcTextPosLeft: function(t, e, a) {
        var i = [],
            r = t[0],
            n = r[0],
            s = r[1],
            o = a / 2;
        if (e.length <= 1) {
            var l = e[0],
                h = {
                    destX: n - o - l[0],
                    destY: s - l[1] / 2,
                    width: l[0],
                    height: l[1]
                };
            i.push(h)
        } else {
            var l = e[0],
                h = {
                    destX: n - o - l[0],
                    destY: s - l[1],
                    width: l[0],
                    height: l[1]
                },
                l = e[1],
                d = {
                    destX: n - o - l[0],
                    destY: s,
                    width: l[0],
                    height: l[1]
                };
            i.push(h),
                i.push(d)
        }
        return i
    },
    calcTextPosTop: function(t, e, a) {
        var i = t[0],
            r = i[0],
            n = i[1],
            s = e[0];
        return [{
            destX: r - s[0] / 2,
            destY: n - a / 2 - s[1],
            width: s[0],
            height: s[1]
        }]
    },
    calcTextPosBottom: function(t, e, a) {
        var i = t[0],
            r = i[0],
            n = i[1],
            s = e[0];
        return [{
            destX: r - s[0] / 2,
            destY: n + a / 2,
            width: s[0],
            height: s[1]
        }]
    },
    updateLabel: function() {

        var t = (new Date).getTime(),
            e = this.map;
        this.labelCanvas.style.left = (0 - parseFloat(this.map.layerContainerDiv.style.left.replace("px", ""))) + "px";

        this.labelCanvas.style.top = (0 - parseFloat(this.map.layerContainerDiv.style.top.replace("px", ""))) + "px";
        var a = this.preComputeLabel(this.curViewLabels);
        if (this.clearLabel(),
            this.drawIconAndText(a),
            this.curViewLabels.length > 0) {
            // var i = (new Date).getTime(),
            //     r = new n("onvectorloaded");
            // r.drawingTime = i - t,
            //     e.dispatchEvent(r)
        }
    },
    getIconVersionInfo: function() {
        if (this.iconVersionInfo)
            return this.iconVersionInfo;
        // var t = "undefined" != typeof MSV ? MSV.mapstyle : {},
        //     e = t.version ? t.version : "001",
        //     a = t.updateDate ? t.updateDate : "20150621";
        return this.iconVersionInfo = {
                // ver: e,
                // udt: a
                ver: "001",
                udt: "20170118"
            },
            this.iconVersionInfo
    },
    getIconUrl: function(t) {
        var e = this.iconURLs,
            a = t.length % e.length,
            i = this.getIconVersionInfo(),
            r = i.ver,
            n = i.udt;
        return this.iconURLs[a] + t + ".png?v=" + r + "&udt=" + n
    },
    getIconUrl: function(t) {
        var e = this.iconURLs,
            a = t.length % e.length,
            i = this.getIconVersionInfo(),
            r = i.ver,
            n = i.udt;
        return this.iconURLs[a] + t + ".png?v=" + r + "&udt=" + n
    },
    preComputeLabel: function(t) {
        var e = [],
            a = this.map,
            i = a.getCenter(),
            r = a.getZoom(),
            n = a.getSize(),
            s = n.w,
            o = n.h,
            l = i.lon,
            h = i.lat,
            d = this.mapType.getZoomUnits(r),
            f = this.tileSize.w,
            v = d * f,
            c = (this.ratio,
                0);
        5 === r && (c = 1),
            t.sort(function(t, e) {
                return t.x * t.y < e.x * e.y ? -1 : 1
            });
        for (var u = 0, p = t.length; p > u; u++)
            for (var g = t[u], w = g.x, m = g.y, b = (g.z,
                    w * v), y = (m + 1) * v, x = (b - l) / d + s / 2, T = (h - y) / d + o / 2, C = 0, L = g.length; L > C; C++) {
                {
                    var P = g[C],
                        I = void 0,
                        S = void 0,
                        X = void 0,
                        Y = void 0;
                    P.baseDrawX = x + P.baseX,
                        P.baseDrawY = T + P.baseY
                }
                if ("fixed" === P.type) {
                    var _ = P.iconPos,
                        D = P.textPos;
                    if (_ && (_.drawX = x + _.destX,
                            _.drawY = T + _.destY,
                            I = _.drawX,
                            S = _.drawY,
                            X = _.drawX + _.width,
                            Y = _.drawY + _.height),
                        D) {
                        var M = D[0];
                        if (M.drawX = x + M.destX,
                            M.drawY = T + M.destY,
                            void 0 != I ? (M.drawX < I && (I = M.drawX),
                                M.drawY < S && (S = M.drawY),
                                M.drawX + M.width > X && (X = M.drawX + M.width),
                                M.drawY + M.height > Y && (Y = M.drawY + M.height)) : (I = M.drawX,
                                S = M.drawY,
                                X = M.drawX + M.width,
                                Y = M.drawY + M.height),
                            2 == D.length) {
                            var k = D[1];
                            k.drawX = x + k.destX,
                                k.drawY = T + k.destY,
                                k.drawX < I && (I = k.drawX),
                                k.drawY < S && (S = k.drawY),
                                k.drawX + k.width > X && (X = k.drawX + k.width),
                                k.drawY + k.height > Y && (Y = k.drawY + k.height)
                        }
                    }
                } else if ("line" === P.type)
                    P.tileX = x,
                    P.tileY = T,
                    I = x + P._minX,
                    S = T + P._minY,
                    X = x + P._maxX,
                    Y = T + P._maxY;
                else if ("biaopai" === P.type) {
                    var O = P.pos;
                    O.drawX = x + O.destX,
                        O.drawY = T + O.destY,
                        I = O.drawX,
                        S = O.drawY,
                        X = O.drawX + O.width,
                        Y = O.drawY + O.height
                }
                void 0 != I && (P.minX = I,
                    P.minY = S,
                    P.maxX = X,
                    P.maxY = Y,
                    e.push(P))
            }
        e.sort(function(t, e) {
            return e.rank - t.rank
        });
        for (var u = 0, p = e.length; p > u; u++) {
            var V = e[u];
            for (V.isDel = !1,
                V.arrIntersectIndex = [],
                C = u + 1; p > C; C++) {
                var F = e[C];
                V.maxX - c < F.minX || V.minX > F.maxX - c || V.maxY - c < F.minY || V.minY > F.maxY - c || V.arrIntersectIndex.push(C)
            }
        }
        for (var u = 0, p = e.length; p > u; u++) {
            var z = e[u];
            if (0 == z.isDel)
                for (var R = z.arrIntersectIndex, C = 0, L = R.length; L > C; C++) {
                    var B = e[R[C]];
                    B.isDel = !0
                }
        }
        return e
    },
    resetImages: function(minRow, maxRow, minCol, maxCol) {
        for (var k in this.images) {
            var zxy = k.split(',');
            var x = parseInt(zxy[1]);
            var y = parseInt(zxy[2]);
            if (x < minRow || x > maxRow || y < minCol || y > maxCol) {
                this.images[k] = null;
                delete this.images[k];
            }
        }
    },
    clearImages: function() {
        for (var k in this.images) {
            this.images[k] = null;
        }
        this.images = {};
    },
    CLASS_NAME: "OpenLayers.Layer.Baidu"
});
