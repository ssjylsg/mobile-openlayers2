OpenLayers.Layer.TDTLayer = OpenLayers.Class(OpenLayers.Layer.Grid, {


    mapType: null,
    mirrorUrls: null,
    topLevel: null,
    bottomLevel: null,
    topLevelIndex: 0,
    bottomLevelIndex: 20,
    topTileFromX: -180,
    topTileFromY: 90,
    topTileToX: 180,
    topTileToY: -270,
    isLocalMap: false,
    type: 'png',
    initialize: function(name, url, options) {
        options.topLevel = options.topLevel ? options.topLevel : this.topLevelIndex;
        options.bottomLevel = options.bottomLevel ? options.bottomLevel : this.bottomLevelIndex;
        options.maxResolution = this.getResolutionForLevel(options.topLevel);
        options.minResolution = this.getResolutionForLevel(options.bottomLevel);
        var newArguments = [name, url, {},
            options
        ];
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);
    },

    setMap: function(map) {
        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        if (!this.isBaseLayer) {
            this.setZIndex(parseInt(this.map.baseLayer.getZIndex()) + 1);
        }
    },
    clone: function(obj) {

        if (obj == null) {
            obj = new OpenLayers.Layer.TDTLayer(this.name, this.url, this.options);
        }

        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);
        return obj;
    },
    getXYZ: function(bounds) {
        var res = this.getServerResolution();
        var x = Math.round((bounds.left - this.maxExtent.left) /
            (res * this.tileSize.w));
        var y = Math.round((this.maxExtent.top - bounds.top) /
            (res * this.tileSize.h));
        var z = this.getServerZoom();

        if (this.wrapDateLine) {
            var limit = Math.pow(2, z);
            x = ((x % limit) + limit) % limit;
        }

        return {
            'x': x,
            'y': y,
            'z': z
        };
    },


    getURL: function(bounds) {
        var level = this.getLevelForResolution(this.map.getResolution());
        var coef = 360 / Math.pow(2, level);
        var x_num = this.topTileFromX < this.topTileToX ? Math.round((bounds.left - this.topTileFromX) / coef) : Math.round((this.topTileFromX - bounds.right) / coef);
        var y_num = this.topTileFromY < this.topTileToY ? Math.round((bounds.bottom - this.topTileFromY) / coef) : Math.round((this.topTileFromY - bounds.top) / coef);
        var type = this.mapType;
        if (type == "EMap") {
            if (level >= 1 && level <= 10) {
                type = "vec_c";
            } else if (level == 11 || level == 12) {
                type = "vec_c";
            } else if (level >= 13 && level <= 18) {
                type = "vec_c";
            }
        }
        if (type == "ESatellite") {
            if (level >= 1 && level <= 10) {
                type = "cva_c";
            } else if (level == 11 || level == 12 || level == 13) {
                type = "cva_c";
            } else if (level == 14) {
                type = "cva_c";
            } else if (level >= 15 && level <= 18) {
                type = "cva_c";
            }
        }
        //以下2个已经失效
        if (type == "EDEM") {
            type = "J07098";
        }
        if (type == "EAddress") {
            type = "wfs";
        }
        var url = this.url;
        if (OpenLayers.Util.isArray(this.url)) {
            url = this.selectUrl(x_num, this.url);
        }
        if (this.mirrorUrls != null) {
            url = this.selectUrl(x_num, this.mirrorUrls);
        }
        if (url.indexOf('EzMap') > 0) {
            var path = OpenLayers.String.format(url, {
                'x': x_num,
                'y': y_num,
                'z': level
            });
            return path;
        } else {
            if (this.isLocalMap) {
                if (url.indexOf(type) < 0) {
                    return url + "/" + type + "/" + level + "/" + y_num + "/" + x_num + this.type;
                }

                var path = "" + level + "/" + y_num + "/" + x_num + "." + this.type;
                return url + path;
            } else {
                return this.getFullRequestString({
                    T: type,
                    X: x_num,
                    Y: y_num,
                    L: level
                }, url);


            }
        }
    },
    selectUrl: function(a, b) {
        return b[a % b.length]
    },
    getLevelForResolution: function(res) {
        var ratio = this.getMaxResolution() / res;
        if (ratio < 1) return 0;
        for (var level = 0; ratio / 2 >= 1;) {
            level++;
            ratio /= 2;
        }
        return level;
    },
    getResolutionForLevel: function(level) {
        return 360 / 256 / Math.pow(2, level);
    },
    getMaxResolution: function() {
        return this.getResolutionForLevel(this.topLevelIndex)
    },
    getMinResolution: function() {
        return this.getResolutionForLevel(this.bottomLevelIndex)
    },
    addTile: function(bounds, position) {
        var url = this.getURL(bounds);
        return new OpenLayers.Tile.Image(this, position, bounds, url, this.tileSize);
    },


    CLASS_NAME: "OpenLayers.Layer.TDTLayer"
});
