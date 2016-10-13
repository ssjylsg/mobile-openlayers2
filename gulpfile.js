var
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    minifycss = require('gulp-minify-css'),
    gulpCopy = require('gulp-file-copy'),
    fs = require('fs'),
    path = require('path'),
    jsdoc = require("gulp-jsdoc3"),
    del = require('del');

gulp.task('clean', function(cb) {
    del(['./dist/**'], cb);
});

gulp.task('minifyjs', function() {
    var lib = [
        'OpenLayers/SingleFile.js',
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
        "OpenLayers/Events/featureclick.js",
        'OpenLayers/Strategy/Cluster.js',
        'OpenLayers/Strategy/AnimatedCluster.js'
    ];
    for (var i = lib.length - 1; i >= 0; i--) {
        lib[i] = 'source/lib/' + lib[i];
    }

    gulp.src('NPMobileMap.js')
        .pipe(concat('NPMobileMap.js'))
        .pipe(rename('NPMobileMap.js'))
        //.pipe(uglify())
        .pipe(gulp.dest('./dist/'));


    return gulp.src(lib)
        .pipe(concat('OpenLayers.js'))
        .pipe(rename('OpenLayers.js'))
        //  .pipe(uglify())
        .pipe(gulp.dest('./dist/'));
});
gulp.task('watch', function() {
    fs.watchFile('NPMobileMap.js', function() {
        gulp.src('NPMobileMap.js')
            .pipe(concat('NPMobileMap.js'))
            .pipe(rename('NPMobileMap.js'))
            //.pipe(uglify())
            .pipe(gulp.dest('./dist/'));
    });
});
gulp.task('doc', function(cb) {
    del(['document'], cb);
    var lib = [
        'NPMobileMap.js'
    ];
    lib.push('README.md');
    var config = {
        "opts": {
            "destination": "document"
        },
        "templates": {
            "systemName": 'NPMobile',
            "copyright": '',
            "theme": 'cerulean',
            "includeDate": true,
            "outputSourceFiles": false,
            "outputSourcePath": false,
            "dateFormat": 'YYYY-MM-DD',
            "linenums": true
        }
    };

    gulp.src(lib, { read: false })
        .pipe(jsdoc(config, cb));
});
gulp.task('copy', function() {
    var start = 'source/img/**';
    gulp.src(start).pipe(gulp.dest('./dist/img'));
    gulp.src('source/theme/**').pipe(gulp.dest('./dist/theme'));
});

gulp.task('createFile', function() {
    var contents = ' <!DOCTYPE html>' +
        '<html lang="en">' +

        '<head>' +
        '  <meta charset="utf-8">' +
        '  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />' +
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">' +
        '  <meta name="apple-mobile-web-app-capable" content="yes">' +
        ' <link rel="stylesheet" href="theme/default/style.mobile.css" type="text/css">' +
        ' <style>' +
        ' html,' +
        ' body {' +
        '   margin: 0;' +
        '   padding: 0;' +
        '   height: 100%;' +
        '   width: 100%;' +
        ' }' +

        ' @media only screen and (max-width: 600px) {' +
        '    html,' +
        '   body {' +
        '       height: 117%;' +
        '   }' +
        '}' +

        ' .olControlAttribution {' +
        '    position: absolute;' +
        '    font-size: 10px;' +
        '    bottom: 0 !important;' +
        '    right: 0 !important;' +
        '   background: rgba(0, 0, 0, 0.1);' +
        '   font-family: Arial;' +
        '   padding: 2px 4px;' +
        '  border-radius: 5px 0 0 0;' +
        '}' +

        ' #title,' +
        ' #tags,' +
        ' #shortdesc {' +
        '    display: none;' +
        '}' +

        ' #viewerContainer {' +
        '   width: 100%;' +
        '    position: relative;' +
        '    height: 100%;' +
        '}' +
        "</style>" +

        '</head>' +
        '<body>' +
        ' <div id="viewerContainer">' +
        '</div>' +
        '<script src="OpenLayers.js"></script>' +
        '<script type="text/javascript">' +
        // initialize map when page ready
        'var map;' +


        'var fixSize = function() {' +
        '  window.scrollTo(0,0);' +
        " document.body.style.height = '100%';" +
        "    if (!(/(iphone|ipod)/.test(navigator.userAgent.toLowerCase()))) {" +
        "        if (document.body.parentNode) {" +
        "            document.body.parentNode.style.height = '100%';" +
        "       }" +
        "   }" +
        "};" +
        "setTimeout(fixSize, 700);" +
        "setTimeout(fixSize, 1500);" +


        "  map = new OpenLayers.Map({" +
        '      div: "viewerContainer",' +
        '      theme: null,' +
        '    controls: [' +
        '        new OpenLayers.Control.Attribution(),' +
        '      new OpenLayers.Control.TouchNavigation({' +
        '          dragPanOptions: {' +
        '             enableKinetic: true' +
        '         }' +
        '     }),' +
        '     new OpenLayers.Control.Zoom()' +
        ' ],' +
        '  layers: [' +
        '      new OpenLayers.Layer.OSM("OpenStreetMap", null, {' +
        "        transitionEffect: 'resize'" +
        '   })' +
        '],' +
        '  center: new OpenLayers.LonLat(742000, 5861000),' +
        ' zoom: 3' +
        ' });' +


        '</script>' +
        '</body>' +
        '</html>';
    fs.writeFileSync(path.join('dist', 'index.html'), contents);
});


gulp.task('default', ['minifycss', 'minifyjs', 'copy', 'createFile'], function() {
    gulp.start('zip');
});


gulp.task('zip', function() {
    return gulp.src('dist/**')
        .pipe(zip('NPMAP3D_V' + v + '.zip')).pipe(gulp.dest('VERSION'));
});
