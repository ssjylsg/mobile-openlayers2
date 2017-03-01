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
    clone: function(obj) {
        if (obj == null) {
            obj = new OpenLayers.Layer.gaode(this.name, this.url, this.options);
        }
        return OpenLayers.Layer.TMS.prototype.clone.apply(this, [obj]);
    },
    CLASS_NAME: "OpenLayers.Layer.gaode"
});
