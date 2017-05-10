/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/* 
 * @requires OpenLayers/BaseTypes.js
 * @requires OpenLayers/Lang/en.js
 * @requires OpenLayers/Console.js
 */
 
/*
 * TODO: In 3.0, we will stop supporting build profiles that include
 * OpenLayers.js. This means we will not need the singleFile and scriptFile
 * variables, because we don't have to handle the singleFile case any more.
 */

(function() {
    /**
     * Before creating the OpenLayers namespace, check to see if
     * OpenLayers.singleFile is true.  This occurs if the
     * OpenLayers/SingleFile.js script is included before this one - as is the
     * case with old single file build profiles that included both
     * OpenLayers.js and OpenLayers/SingleFile.js.
     */
    var singleFile = (typeof OpenLayers == "object" && OpenLayers.singleFile);
    
    /**
     * Relative path of this script.
     */
    var scriptName = (!singleFile) ? "lib/OpenLayers.js" : "OpenLayers.js";

    /*
     * If window.OpenLayers isn't set when this script (OpenLayers.js) is
     * evaluated (and if singleFile is false) then this script will load
     * *all* OpenLayers scripts. If window.OpenLayers is set to an array
     * then this script will attempt to load scripts for each string of
     * the array, using the string as the src of the script.
     *
     * Example:
     * (code)
     *     <script type="text/javascript">
     *         window.OpenLayers = [
     *             "OpenLayers/Util.js",
     *             "OpenLayers/BaseTypes.js"
     *         ];
     *     </script>
     *     <script type="text/javascript" src="../lib/OpenLayers.js"></script>
     * (end)
     * In this example OpenLayers.js will load Util.js and BaseTypes.js only.
     */
    var jsFiles = window.OpenLayers;

    /**
     * Namespace: OpenLayers
     * The OpenLayers object provides a namespace for all things OpenLayers
     */
    window.OpenLayers = {
        /**
         * Method: _getScriptLocation
         * Return the path to this script. This is also implemented in
         * OpenLayers/SingleFile.js
         *
         * Returns:
         * {String} Path to this script
         */
        _getScriptLocation: (function() {
            var r = new RegExp("(^|(.*?\\/))(" + scriptName + ")(\\?|$)"),
                s = document.getElementsByTagName('script'),
                src, m, l = "";
            for(var i=0, len=s.length; i<len; i++) {
                src = s[i].getAttribute('src');
                if(src) {
                    m = src.match(r);
                    if(m) {
                        l = m[1];
                        break;
                    }
                }
            }
            return (function() { return l; });
        })(),
        
        /**
         * APIProperty: ImgPath
         * {String} Set this to the path where control images are stored, a path  
         * given here must end with a slash. If set to '' (which is the default) 
         * OpenLayers will use its script location + "img/".
         * 
         * You will need to set this property when you have a singlefile build of 
         * OpenLayers that either is not named "OpenLayers.js" or if you move
         * the file in a way such that the image directory cannot be derived from 
         * the script location.
         * 
         * If your custom OpenLayers build is named "my-custom-ol.js" and the images
         * of OpenLayers are in a folder "/resources/external/images/ol" a correct
         * way of including OpenLayers in your HTML would be:
         * 
         * (code)
         *   <script src="/path/to/my-custom-ol.js" type="text/javascript"></script>
         *   <script type="text/javascript">
         *      // tell OpenLayers where the control images are
         *      // remember the trailing slash
         *      OpenLayers.ImgPath = "/resources/external/images/ol/";
         *   </script>
         * (end code)
         * 
         * Please remember that when your OpenLayers script is not named 
         * "OpenLayers.js" you will have to make sure that the default theme is 
         * loaded into the page by including an appropriate <link>-tag, 
         * e.g.:
         * 
         * (code)
         *   <link rel="stylesheet" href="/path/to/default/style.css"  type="text/css">
         * (end code)
         */
        ImgPath : ''
    };

    /**
     * OpenLayers.singleFile is a flag indicating this file is being included
     * in a Single File Library build of the OpenLayers Library.
     * 
     * When we are *not* part of a SFL build we dynamically include the
     * OpenLayers library code.
     * 
     * When we *are* part of a SFL build we do not dynamically include the 
     * OpenLayers library code as it will be appended at the end of this file.
     */
    if(!singleFile) {
        if (!jsFiles) {
            jsFiles = [
        'OpenLayers/BaseTypes/Class.js',
        'OpenLayers/Util/vendorPrefix.js',
        'OpenLayers/Animation.js',
        'OpenLayers/Kinetic.js',
        'OpenLayers/BaseTypes.js',
        'OpenLayers/BaseTypes/Bounds.js',
        'OpenLayers/BaseTypes/Element.js',
        'OpenLayers/BaseTypes/LonLat.js',
        'OpenLayers/BaseTypes/Pixel.js',
        'OpenLayers/BaseTypes/Size.js',
        'OpenLayers/Console.js',
        'OpenLayers/Lang.js',
        'OpenLayers/Util.js',
        'OpenLayers/Events.js',
        'OpenLayers/Tween.js',
        'OpenLayers/Projection.js',
        'OpenLayers/Map.js',
        'OpenLayers/Layer.js',
        'OpenLayers/Layer/HTTPRequest.js',
        'OpenLayers/Tile.js',
        'OpenLayers/Tile/Image.js',
        'OpenLayers/Layer/Grid.js',
        'OpenLayers/TileManager.js',
        'OpenLayers/Control.js',
        'OpenLayers/Control/Attribution.js',
        'OpenLayers/Feature.js',
        'OpenLayers/Feature/Vector.js',
        'OpenLayers/Control/DrawFeature.js',
        'OpenLayers/Geometry.js',
        'OpenLayers/Geometry/Point.js',
        'OpenLayers/Control/Geolocate.js',
        'OpenLayers/Handler.js',
        'OpenLayers/Handler/Drag.js',
        'OpenLayers/Handler/Keyboard.js',
        'OpenLayers/Control/ModifyFeature.js',
        'OpenLayers/Events/buttonclick.js',
        'OpenLayers/Control/Panel.js',
        'OpenLayers/Handler/Feature.js',
        'OpenLayers/Renderer.js',
        'OpenLayers/Style.js',
        'OpenLayers/StyleMap.js',
        'OpenLayers/Layer/EventPane.js',
        'OpenLayers/Layer/FixedZoomLevels.js',
        'OpenLayers/Layer/TileCache.js',
        'OpenLayers/Layer/TMS.js',
        'OpenLayers/Layer/Vector.js',
        'OpenLayers/Layer/Vector/RootContainer.js',
        'OpenLayers/Control/SelectFeature.js',
        'OpenLayers/Control/DragPan.js',
        'OpenLayers/Handler/Pinch.js',
        'OpenLayers/Control/PinchZoom.js',
        'OpenLayers/Handler/Click.js',
        'OpenLayers/Control/TouchNavigation.js',
        'OpenLayers/Control/Zoom.js',
        'OpenLayers/Format.js',
        'OpenLayers/Format/JSON.js',
        'OpenLayers/Geometry/Collection.js',
        'OpenLayers/Geometry/MultiPoint.js',
        'OpenLayers/Geometry/Curve.js',
        'OpenLayers/Geometry/LineString.js',
        'OpenLayers/Geometry/MultiLineString.js',
        'OpenLayers/Geometry/LinearRing.js',
        'OpenLayers/Geometry/Polygon.js',
        'OpenLayers/Geometry/MultiPolygon.js',
        'OpenLayers/Format/GeoJSON.js',
        'OpenLayers/BaseTypes/Date.js',
        'OpenLayers/Format/XML.js',
        'OpenLayers/Request.js',
        'OpenLayers/Request/XMLHttpRequest.js',
        'OpenLayers/Format/KML.js',
        'OpenLayers/Handler/Point.js',
        'OpenLayers/Handler/Path.js',
        'OpenLayers/Handler/Polygon.js',
        'OpenLayers/Layer/XYZ.js',
        //'OpenLayers/Layer/Bing.js',
        'OpenLayers/Layer/OSM.js',
        'OpenLayers/Layer/WMS.js',
        'OpenLayers/Protocol.js',
        'OpenLayers/Protocol/HTTP.js',
        'OpenLayers/Protocol/WFS.js',
        'OpenLayers/Protocol/WFS/v1.js',
        'OpenLayers/Format/WFST.js',
        'OpenLayers/Filter.js',
        'OpenLayers/Filter/Spatial.js',
        'OpenLayers/Filter/FeatureId.js',
        'OpenLayers/Format/WFST/v1.js',
        'OpenLayers/Format/GML.js',
        'OpenLayers/Format/GML/Base.js',
        'OpenLayers/Format/GML/v2.js',
        'OpenLayers/Format/OGCExceptionReport.js',
        'OpenLayers/Format/XML/VersionedOGC.js',
        'OpenLayers/Filter/Logical.js',
        'OpenLayers/Filter/Comparison.js',
        'OpenLayers/Format/Filter.js',
        'OpenLayers/Filter/Function.js',
        'OpenLayers/Format/Filter/v1.js',
        'OpenLayers/Format/Filter/v1_0_0.js',
        'OpenLayers/Format/WFST/v1_0_0.js',
        'OpenLayers/Protocol/WFS/v1_0_0.js',
        'OpenLayers/Renderer/Canvas.js',
        'OpenLayers/Renderer/Elements.js',
        'OpenLayers/Renderer/SVG.js',
        'OpenLayers/Strategy.js',
        'OpenLayers/Layer/gaode.js',
        'OpenLayers/Layer/Baidu.js',
        'OpenLayers/Layer/TDTLayer.js',
        'OpenLayers/Layer/TMS_PGIS.js',
        'OpenLayers/Layer/ArcGISCache.js',
        'OpenLayers/Layer/QQMapLayer.js',
        "OpenLayers/Events/featureclick.js",
        'OpenLayers/Strategy/Cluster.js',
        'OpenLayers/Strategy/AnimatedCluster.js',
        'OpenLayers/Rule.js',
        'OpenLayers/Control/Measure.js',
        'OpenLayers/Control/ScaleLine.js',
        'OpenLayers/Format/WKT.js',
            ]; // etc.
        }

        // use "parser-inserted scripts" for guaranteed execution order
        // http://hsivonen.iki.fi/script-execution/
        var scriptTags = new Array(jsFiles.length);
        var host = OpenLayers._getScriptLocation() + "lib/";
        for (var i=0, len=jsFiles.length; i<len; i++) {
            scriptTags[i] = "<script src='" + host + jsFiles[i] +
                                   "'></script>"; 
        }
        if (scriptTags.length > 0) {
            document.write(scriptTags.join(""));
        }
    }
})();

/**
 * Constant: VERSION_NUMBER
 *
 * This constant identifies the version of OpenLayers.
 *
 * When asking questions or reporting issues, make sure to include the output of
 *     OpenLayers.VERSION_NUMBER in the question or issue-description.
 */
OpenLayers.VERSION_NUMBER="Release 2.13.1";
