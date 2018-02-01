OpenLayers.Popup.FramedCloud = OpenLayers.Class(OpenLayers.Popup.Framed, {

    contentDisplayClass: "olFramedCloudPopupContent",

    autoSize: true,

    panMapIfOutOfView: false,

    imageSize: new OpenLayers.Size(60, 40),

    isAlphaImage: false,

    fixedRelativePosition: true,

    relativePosition: 'tr',

    positionBlocks: {
        "tr": {
            'offset': new OpenLayers.Pixel(-60, 0),
            'padding': new OpenLayers.Bounds(0, 42, 0, 0),
            'blocks': [{ // stem
                size: new OpenLayers.Size(60, 40),
                anchor: new OpenLayers.Bounds(60, 3, null, null),
                position: new OpenLayers.Pixel(0, 0)
            }]
        }
    },
    minSize: new OpenLayers.Size(150, 60),

    maxSize: new OpenLayers.Size(1200, 660),

    setSize: function(contentSize) {
        var w = 2, //border.width*2
            h = 2; //border.height*2
        if (contentSize) {
            contentSize.w -= w;
            contentSize.h -= h;
        }
        OpenLayers.Popup.Framed.prototype.setSize.call(this, contentSize);
    },

    createBlocks: function() {
        this.blocks = [];
        var firstPosition = null;
        for (var key in this.positionBlocks) {
            firstPosition = key;
            break;
        }

        var position = this.positionBlocks[firstPosition];
        for (var i = 0; i < position.blocks.length; i++) {

            var block = {};
            this.blocks.push(block);

            var divId = this.id + '_FrameDecorationDiv_' + i;
            block.div = OpenLayers.Util.createDiv(divId,
                null, null, null, "absolute", null, "hidden", null
            );
            block.div.style.zIndex = 10000;

            var imgId = this.id + '_FrameDecorationImg_' + i;
            var imageCreator =
                (this.isAlphaImage) ? OpenLayers.Util.createAlphaImageDiv : OpenLayers.Util.createImage;

            block.image = imageCreator(imgId,
                null, this.imageSize, this.imageSrc,
                "absolute", null, null, null
            );

            block.div.appendChild(block.image);
            this.groupDiv.appendChild(block.div);
        }
    },

    initialize: function(id, lonlat, contentSize, contentHTML, anchor, closeBox,
        closeBoxCallback, positionBlock) {
        this.imageSrc = OpenLayers.Util.getImageLocation('iw_tail.png');
        this.positionBlocks = {
            "tr": {
                'offset': new OpenLayers.Pixel(-60, 0),
                'padding': new OpenLayers.Bounds(0, 42, 0, 0),
                'blocks': [{ // stem
                    size: new OpenLayers.Size(60, 40),
                    anchor: new OpenLayers.Bounds(60, 3, null, null),
                    position: new OpenLayers.Pixel(0, 0)
                }]
            }
        };
        if (positionBlock) {
            if (positionBlock.offset) {
                this.positionBlocks["tr"]["offset"] = positionBlock.offset;
            }
            if (positionBlock.padding) {
                this.positionBlocks["tr"]["padding"] = positionBlock.padding;
            }
            if (positionBlock.blocks) {
                this.positionBlocks["tr"]["blocks"] = positionBlock.blocks;
            }
            if (positionBlock.imageSize) {
                this.imageSize = positionBlock.imageSize;
            }
            if (positionBlock.imageSrc) {
                this.imageSrc = positionBlock.imageSrc;
            }
        }
        OpenLayers.Popup.Framed.prototype.initialize.apply(this, arguments);
        this.contentDiv.className = this.contentDisplayClass;
        this.div.style.padding = '1px'; //border.width*2
    },
    setContentDom: function(dom) {

        this.contentHTML = dom.innerHTML;

        if (this.contentDiv != null) {
            while (this.contentDiv.childNodes.length > 0) {
                this.contentDiv.removeChild(this.contentDiv.firstChild);
            }
            this.contentDiv.appendChild(dom);
            if (this.autoSize) {
                this.registerImageListeners();
                this.updateSize();
            }
            this.prevPositon = {
                left: this.div.style.left,
                top: this.div.style.top
            }
            this.show();
        }
    },

    CLASS_NAME: "OpenLayers.Popup.FramedCloud"
});