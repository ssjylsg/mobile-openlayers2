OpenLayers.Layer.gaode = OpenLayers.Class(OpenLayers.Layer.TMS, {
    itileOriginCorner: 'tl',

    type: 'png',
    wrapDateLine: true,
    isLocalMap: false,
    
    resolutions: [
        156543.0339,
        78271.516953125,
        39135.7584765625,
        19567.87923828125,
        9783.939619140625,
        4891.9698095703125,
        2445.9849047851562,
        1222.9924523925781,
        611.4962261962891,
        305.74811309814453,
        152.87405654907226,
        76.43702827453613,
        38.218514137268066,
        19.109257068634033,
        9.554628534317016,
        4.777314267158508,
        2.388657133579254,
        1.194328566789627,
        0.5971642833948135,
    ],

    tileOrigin: new OpenLayers.LonLat(-20037508.3427892, 20037508.3427892),

    initialize: function(name, url, options) {
        OpenLayers.Layer.TMS.prototype.initialize.apply(this, [name, url, options]);
    },

    getURL: function(bounds) {
        var res = this.map.getResolution();
        var x = parseInt((bounds.getCenterLonLat().lon - this.tileOrigin.lon) / (256 * res));
        var y = parseInt((this.tileOrigin.lat - bounds.getCenterLonLat().lat) / (256 * res));
        var z = this.map.getZoom();
        if (Math.abs(this.resolutions[z] - res) > 0.0000000000000000001) {
            for (var i = 0; i < this.resolutions.length; i++) {
                if (Math.abs(this.resolutions[i] - res) <= 0.0000000000000000001) {
                    z = i;
                    break;
                }
            }
        }

        if (!this.isLocalMap) {
            if (OpenLayers.Util.isArray(this.url)) {
                var serverNo = (x + y) % this.url.length;
                return this.url[serverNo] + "&L=" + z + "&Z=" + z + '&Y=' + y + '&X=' + x;
            } else {
                return this.url + "&Z=" + z + "&L=" + z + '&Y=' + y + '&X=' + x;
            }
        } else {
            return this.url + '/' + z + '/' + x + '/' + y + '.' + this.type;
        }

    },
    moveGriddedTiles: function(isClear) {
        this.z = this.map.getZoom();
        var resolution = this.resolutions[this.z];
        var bounds = this.map.getExtent();
        var maxExtent = 20037508.3427892;
        this.minRow = Math.floor((bounds.left + maxExtent) / (resolution * 256));
        this.maxCol = Math.ceil((maxExtent - bounds.bottom) / (resolution * 256));
        this.maxRow = Math.ceil((bounds.right + maxExtent) / (resolution * 256));
        this.minCol = Math.floor((maxExtent - bounds.top) / (resolution * 256));
        if (!isClear) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.resetImages(this.minRow, this.maxRow, this.minCol, this.maxCol);
        var center = this.map.getCenter();
        var imageDatas = [];
        for (var i = this.minRow; i < this.maxRow + 1; i++) {
            for (var j = this.minCol; j < this.maxCol + 1; j++) {
                var left = i * (resolution * 256) - maxExtent;
                var right = (i + 1) * (resolution * 256) - maxExtent;
                var top = maxExtent - j * (resolution * 256);
                var bottom = maxExtent - (j + 1) * (resolution * 256);
                var tbound = new OpenLayers.Bounds(left, bottom, right, top);
                var lt = this.map.getPixelFromLonLat(new OpenLayers.LonLat(left, top));
                var url = this.getURL(tbound);
                var tileCenter = tbound.getCenterLonLat();
                imageDatas.push({
                    bounds: tbound,
                    key: this.z + "," + i + "," + j,
                    url: url,
                    postion: lt,
                    distance: Math.pow(tileCenter.lon - center.lon, 2) +
                        Math.pow(tileCenter.lat - center.lat, 2)
                });
            }
        }
        imageDatas.sort(function(a, b) {
            return a.distance - b.distance;
        });
        for (var i = 0, ii = imageDatas.length; i < ii; ++i) {
            if (this.images[imageDatas[i].key]) {
                this.context.drawImage(this.images[imageDatas[i].key], imageDatas[i].postion.x, imageDatas[i].postion.y, 256, 256);
            } else {
                var image = new Image();
                image.src = imageDatas[i].url;
                image.setAttribute("left", imageDatas[i].postion.x);
                image.setAttribute("top", imageDatas[i].postion.y);
                image.setAttribute("key", imageDatas[i].key);
                var self = this;
                this.images[imageDatas[i].key] = image;
                image.onload = function() {
                    var zxy = this.getAttribute("key").split(',');
                    var zoom = parseInt(zxy[0]);
                    var row = parseInt(zxy[1]);
                    var col = parseInt(zxy[2]);
                    if (self.z === zoom && self.minRow - 1 < row && self.maxRow + 1 > row && self.minCol - 1 < col && self.maxCol + 1 > col) {
                        var left = parseInt(this.getAttribute("left"));
                        var top = parseInt(this.getAttribute("top"));
                        self.context.drawImage(this, left, top, 256, 256);
                    }
                }
            }
        }
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
    clone: function(obj) {
        if (obj == null) {
            obj = new OpenLayers.Layer.gaode(this.name, this.url, this.options);
        }
        return OpenLayers.Layer.TMS.prototype.clone.apply(this, [obj]);
    },
    CLASS_NAME: "OpenLayers.Layer.gaode"
});
