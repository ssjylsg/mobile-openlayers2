/**
 * 对自定义规则切割的图片进行拼装的类
 */
OpenLayers.Layer.Baidu = OpenLayers.Class(OpenLayers.Layer.TileCache, {
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
    },
    setMap: function(map) {
        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        if (!this.isBaseLayer) {
            this.setZIndex(parseInt(this.map.baseLayer.getZIndex()) + 1);
        }
    },
    /**
     * 按地图引擎切图规则实现的拼接方式
     */
    getURL: function(bounds) {
        var tilez = this.map.zoom - 1;
        var res = this.map.getResolution();
        // var bbox = this.map.getMaxExtent();
        var size = this.tileSize;
        var bx = Math.round((bounds.left - this.tileOrigin.lon) / (res * size.w));
        var by = Math.round((bounds.bottom - this.tileOrigin.lat) / (res * size.h));
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
    clone: function(obj) {
        if (obj == null) {
            obj = new OpenLayers.Layer.Baidu(this.name, this.url, this.options);
        }
        obj = OpenLayers.Layer.TileCache.prototype.clone.apply(this, [obj]);
        return obj;
    },
    CLASS_NAME: "OpenLayers.Layer.Baidu"
});