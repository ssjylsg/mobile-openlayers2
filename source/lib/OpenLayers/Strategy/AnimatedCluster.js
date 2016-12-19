/* Copyright (c) 2013 by Antonio Santiago <asantiagop_at_gmail_dot_com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * The views and conclusions contained in the software and documentation are those
 * of the authors and should not be interpreted as representing official policies,
 * either expressed or implied, of OpenLayers Contributors.
 */

/**
 * @requires OpenLayers/Strategy/Cluster.js
 */

/**
 * Class: OpenLayers.Strategy.AnimatedCluster
 * Cluster strategy for vector layers with animations.
 *
 * Inherits from:
 *  - <OpenLayers.Strategy.Cluster>
 */
OpenLayers.Strategy.AnimatedCluster = OpenLayers.Class(OpenLayers.Strategy.Cluster, {

    /**
     * APIProperty: animationMethod
     * {<OpenLayers.Easing>(Function)} Easing equation used for the animation
     *     Defaultly set to OpenLayers.Easing.Expo.easeOut
     */
    animationMethod: OpenLayers.Easing.Expo.easeOut,
    /**
     * APIProperty: animationDuration
     * {Integer} The number of steps to be passed to the OpenLayers.Tween.start()
     * method when the clusters are animated.
     * Default is 20.
     */
    animationDuration: 20,

    /**
     * Property: animationTween
     * {OpenLayers.Tween} Animated panning tween object.
     */
    animationTween: null,

    /**
     * Property: previousResolution
     * {Float} The previous resolution of the map.
     */
    previousResolution: null,

    /**
     * Property: previousClusters
     * {Array(<OpenLayers.Feature.Vector>)} Clusters of features at previous
     * resolution.
     */
    previousClusters: null,

    /**
     * Property: animating
     * {Boolean} Indicates if we are in the process of clusters animation.
     */
    animating: false,

    /**
     * Property: zoomIn
     * {Boolean} Indicates if we are zooming in or zooming out.
     */
    zoomIn: true,
    maxZoom: null,
    minZoom: null,
    _clusterDataStatus: null,
    currentZoom: 0,
    clusterClickModel: null,
    index: 0,
    isAsynchronous: true,
    threshold: 2,
    _xData: [],
    timer: null,
    oldClusters: [],
    statistics: [], // 统计数组
    filterFun: null, // 过滤函数
    minClusterCount: 0, // 最少聚合点位数，当小于此数字时，不聚合
    callbackFun: null, // 异步结束之后回调
    /**
     * Constructor: OpenLayers.Strategy.AnimatedCluster
     *  Create a new animation clustering strategy.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    initialize: function(options) {
        OpenLayers.Strategy.Cluster.prototype.initialize.apply(this, arguments);

        if (options.animationMethod) {
            this.animationMethod = options.animationMethod;
        }
    },

    /**
     * Method: destroy
     * Free resources.
     */
    destroy: function() {
        if (this.animationTween) {
            this.animationTween.stop();
            this.animationTween = null;
        }
        this._clusterDataStatus = null;
    },
    binarySearch: function(srcArray, xmin, x) {
        var high = srcArray.length - 1;　　
        var xStart = 0;
        var low = 0;
        var isDrection = 0;
        while (low <= high) {
            var middle = Math.ceil((low + high) / 2);
            var index0;
            var index1;
            if (x === 'x') {
                index0 = srcArray[middle].geometry.x;
            } else {
                index0 = srcArray[middle].geometry.y;
            }
            if (index0 < xmin) {
                low = low + 1;
                if (isDrection !== 0 && isDrection !== 1) {
                    return middle;
                } else {
                    isDrection = 1;
                }
            } else if (index0 > xmin) {
                high = high - 1;
                if (isDrection !== 0 && isDrection != -1) {
                    return middle;
                } else {
                    isDrection = -1;
                }
            } else {
                return middle;
            }

        }
        if (x == 'x') {
            return xmin < srcArray[0].geometry.x ? 0 : srcArray.length - 1;
        } else {
            return xmin < srcArray[0].geometry.y ? 0 : srcArray.length - 1;
        }
    },
    /**
     * Method: cluster
     * Cluster features based on some threshold distance.
     *
     * Parameters:
     * event - {Object} The event received when cluster is called as a
     *     result of a moveend event.
     */
    cluster: function(event) {

        var resolution = this.layer.map.getResolution();
        var isPan = (event && event.type === "moveend" && !event.zoomChanged);

        // Each time clusters are animated we need to call layer.redraw to show
        // position changes. This produces layer will be redrawn and a call to 
        // cluster is made.
        // Because this, ff we are animating clusters and zoom didn't changed, simply return.
        if (this.animating && (resolution === this.resolution)) {
            return;
        }
        var isZoomChanged = false;
        if (event && event.type === "moveend" && event.zoomChanged) {
            if (this.currentZoom !== this.layer.map.getZoom()) {
                this.oldClusters = [];
                if (this.features == null) {
                    return;
                }
                isZoomChanged = true;
                this._clusterDataStatus = this.features.slice();
                // 重置 状态位 和样式
                for (var i = 0; i < this._clusterDataStatus.length; i++) {
                    this._clusterDataStatus[i]._status = false;
                    this._clusterDataStatus[i].style = null;
                }
                this.layer.clicentData.tempcluster = [];
                this.layer.removeAllFeatures();
            }
        }
        if (this.layer.map.getZoom() < this.minZoom) {
            window.clearTimeout(this.timer);
            this.layer.removeAllFeatures();
            for (var i = 0; i < this.statistics.length; i++) {
                if (this.statistics[i] && this.statistics[i].x && this.statistics[i].y && this.statistics[i].label > 0) {
                    var cluster = new OpenLayers.Feature.Vector(
                        new OpenLayers.Geometry.Point(this.statistics[i].x, this.statistics[i].y), {
                            count: this.statistics[i].label,
                            isStatistics: true
                        }
                    );
                    cluster.attributes.count = this.statistics[i].label;
                    this.layer.addFeatures([cluster], {
                        silent: true
                    });
                }
            }
            return;
        }
        //优化要显示的要素，将不显示的要素重地图中清除，避免拖拽过久而导致的要素太多影像地图性能问题
        var nowExent = this.layer.map.getExtent(),
            delFeatures = [];
        for (var i = 0, length = this.layer.features.length; i < length; i++) {
            if (!this.layer.features[i].cluster) {
                var point = this.layer.features[i].geometry;
                var isContain = nowExent.contains(point.x, point.y, true);
                if (!isContain) {
                    this.layer.features[i]._status = false;
                    this.layer.features[i].data._status = false;
                    this.layer.features[i].style = null;
                    delFeatures.push(this.layer.features[i]);
                }
            }else{
                for (var j = 0; j < this.layer.features[i].cluster.length; j++) {
                    var point = this.layer.features[i].cluster[j].geometry;
                    if(!nowExent.contains(point.x, point.y, true)){
                         delFeatures.push(this.layer.features[i]);
                         for (var k = 0; k < this.layer.features[i].cluster.length; k++){
                            this.layer.features[i].cluster[k]._status = false;
                         }
                         break;
                    }
                }
            }
        }
        this.layer.removeFeatures(delFeatures);


        var drawClusters = [];
        for (var i = 0; i < this.oldClusters.length; i++) {
            var point = this.oldClusters[i].geometry;
            if(nowExent.contains(point)){
                var c = this.oldClusters[i];
                var cs = [];
                for (var j = 0; j < this.oldClusters[i].cluster.length; j++) {
                    var p = this.oldClusters[i].cluster[j].geometry;
                    if(nowExent.contains(p)){
                        this.oldClusters[i].cluster[j]._status = true;
                        cs.push(this.oldClusters[i].cluster[j]);
                    }else{
                        this.oldClusters[i].cluster[j]._status = false;
                    }
                }
                this.oldClusters[i].cluster = cs;
                this.oldClusters[i].attributes.count = cs.length;
                drawClusters.push(this.oldClusters[i]);
            }
        }
        this.oldClusters = drawClusters;

        this.currentZoom = this.layer.map.getZoom();
        if (!this._xData || this._xData.length <= 0) {
            return;
        }
        var screenBounds = this.layer.map.getExtent();
        var xmin = screenBounds.left;
        var xmax = screenBounds.right;

        var ymin = screenBounds.bottom;
        var ymax = screenBounds.top;

        var xStart = this.binarySearch(this._xData, xmin, 'x');
        var xEnd = this.binarySearch(this._xData, xmax, 'x');
        var newXData = this._xData.slice(xStart, xEnd + 1);

        var newFeatures = [];
        for (var j = 0; j < newXData.length; j++) {
            if (newXData[j].geometry.y >= ymin && newXData[j].geometry.y <= ymax) {
                var markType = newXData[j].markType;
                if (this.layer.showMarker[markType] && (this.filterFun == null || this.filterFun(newXData[j]))) {
                    newFeatures.push(newXData[j]);
                }
            }
        }
        this._clusterDataStatus = newFeatures.slice();
        var newClusterFeatures = [];
        if ((!event || event.zoomChanged || isPan) && this._clusterDataStatus) {
            var tempcluster = this.layer.clicentData.tempcluster;
            if (tempcluster) {
                for (var i = 0; i < tempcluster.length; i++) {
                    if (tempcluster[i].data.style) {
                        tempcluster[i].style = tempcluster[i].data.style;
                    } else {
                        if (isZoomChanged) {
                            tempcluster[i].style = null;
                        }
                    }
                }
            }

            if (resolution !== this.resolution || !this.clustersExist() || isPan) {
                if (resolution !== this.resolution) {
                    this.zoomIn = (!this.resolution || (resolution <= this.resolution));
                }

                // Store previous data if we are changing zoom level
                this.previousResolution = this.resolution;
                this.previousClusters = this.clusters;
                this.resolution = resolution;

                var clusters = [];
                var feature, clustered, cluster;
                var markType;
                var isZoom = this.maxZoom && this.layer.map.getZoom() >= this.maxZoom;
                var addedClustersIndex = [];
                for (var i = 0; i < this._clusterDataStatus.length; ++i) {
                    feature = this._clusterDataStatus[i];
                    markType = feature.markType;
                    if (!this.layer.showMarker[markType]) {
                        continue;
                    }
                    if (!feature.getData()._visible) {
                        continue;
                    }
                    if (feature._status) {
                        continue;
                    }
                    if (!this.isAsynchronous) {
                        feature._status = true;
                    }
                    oldclustered = false;
                    newclustered = false;
                    newClusterFeatures.push(feature);
                    if (!isZoom && feature.geometry) {
                        for (var j = this.oldClusters.length - 1; j >= 0; --j) {
                            cluster = this.oldClusters[j];
                            if (this.shouldCluster(cluster, feature)) {
                                oldclustered = true;
                                break;
                            }
                        }
                        if (!oldclustered) {
                            for (var j = clusters.length - 1; j >= 0; --j) {
                                cluster = clusters[j];
                                if (this.shouldCluster(cluster, feature)) {
                                    newclustered = true;
                                    break;
                                }
                            }
                        }
                        if (!oldclustered && !newclustered) {
                            clusters.push(this.createCluster(this._clusterDataStatus[i]));
                        }
                    } else {
                        if (feature.cluster) {
                            Array.prototype.push.apply(clusters, feature.cluster);
                        } else {
                            var f = new OpenLayers.Feature.Vector(
                                new OpenLayers.Geometry.Point(feature.geometry.x, feature.geometry.y), {
                                    count: 0,
                                    markType: feature.markType
                                }
                            );
                            f.data = feature;
                            feature._apiObj = f;
                            //var f = this.createCluster(feature);
                            clusters.push(f);
                        }
                    }
                }

                this.clusters = clusters;
                if (this.layer.map.getZoom() < this.maxZoom) {
                    if (this.oldClusters.length === 0) {
                        for (var i = 0; i < this.clusters.length; i++) {
                            this.oldClusters.push(this.clusters[i]);
                        }
                        for (var j = 0; j < newClusterFeatures.length; j++) {
                            var toC = this.searchMinC(newClusterFeatures[j], this.clusters);
                            if (toC >= 0) {
                                this.clusters[toC].cluster.push(newClusterFeatures[j]);
                                this.clusters[toC].attributes.count++;
                            }
                        }
                    } else {
                        for (var i = 0; i < this.clusters.length; i++) {
                            this.oldClusters.push(this.clusters[i]);
                        }
                        var toCs = [];
                        for (var j = 0; j < newClusterFeatures.length; j++) {
                            var status = false;
                            var toC = this.searchMinC(newClusterFeatures[j], this.oldClusters);
                            if (toC < 0) {
                                continue;
                            }
                            for (var i = 0; i < toCs.length; i++) {
                                if (toCs[i] == toC) {
                                    status = true;
                                    break;
                                }
                            }
                            if (!status) {
                                toCs.push(toC);
                                if (this.oldClusters[toC].cluster.length === 1) {
                                    this.layer.removeFeatures(this.oldClusters[toC].cluster[0]._apiObj);
                                    this.oldClusters[toC].cluster[0]._apiObj.style = null;
                                }
                            }
                            this.oldClusters[toC].cluster.push(newClusterFeatures[j]);
                            this.oldClusters[toC].attributes.count++;
                        }
                        this.clusters = [];
                        for (var i = 0; i < toCs.length; i++) {
                            var index = toCs[i];
                            if (this.oldClusters[index].layer) {
                                this.layer.removeFeatures([this.oldClusters[index]], {
                                    silent: true
                                });
                                this.oldClusters[index].style = null;
                            }
                            this.clusters.push(this.oldClusters[index]);
                        }
                    }

                    //var clone = this.clusters.slice();
                    //this.clusters = [];
                    var clone = [];
                    var candidate;
                    for (var i = 0, len = this.oldClusters.length; i < len; ++i) {
                        candidate = this.oldClusters[i];
                        if (candidate.attributes.count < this.threshold) {
                            for (var k = candidate.cluster.length - 1; k >= 0; k--) {
                                //var candidateCluster = this.createCluster(candidate.cluster[k]);
                                var candidateCluster = new OpenLayers.Feature.Vector(
                                    new OpenLayers.Geometry.Point(candidate.cluster[k].geometry.x, candidate.cluster[k].geometry.y), {
                                        count: 1,
                                        markType: candidate.cluster[k].markType
                                    }
                                );
                                candidateCluster.cluster=[],candidateCluster.cluster.push(candidate.cluster[k]);
                                candidateCluster.data = candidate.cluster[k];
                                candidate.cluster[k]._apiObj = candidateCluster;
                                clone.push(candidateCluster);
                            }
                            // Array.prototype.push.apply(this.clusters, candidate.cluster);
                        } else {
                            clone.push(candidate);
                        }
                    }
                    this.oldClusters = clone;
                    this.clusters = [];
                    for (var i = 0; i < this.oldClusters.length; i++) {
                        if(!this.oldClusters[i].layer){
                            this.clusters.push(this.oldClusters[i]);
                        }
                    }

                    if (isZoomChanged || !event) { // 地图第一次加载时event 为undefine
                        var total = 0;
                        for (var i = this.clusters.length - 1; i >= 0; i--) {
                            total += this.clusters[i].attributes.count || 1;
                        }
                        if (total <= this.minClusterCount) {
                            var clone = this.clusters.slice();
                            this.clusters = [];
                            var candidate;
                            for (var i = 0, len = clone.length; i < len; ++i) {
                                candidate = clone[i];
                                Array.prototype.push.apply(this.clusters, candidate.cluster || [candidate]);
                            }
                            for (var i = 0; i < this.clusters.length; i++) {
                                this.clusters[i]._status = true;
                                this.clusters[i].style = null;
                            }
                            this.oldClusters = [];
                        }
                    }
                }

                // this.clusters = clusters;
                this.getMeansC(this.clusters);
                this.clustering = true;
                if (!this.isAsynchronous) {
                    this.layer.addFeatures(this.clusters, {
                        silent: true
                    });
                    if (this.callbackFun) {
                        this.callbackFun();
                        this.callbackFun = null;
                    }
                } else {
                    this.index = 0; 
                    this.timer = window.setTimeout(this.startAddFeatures.bind(this), 15);
                }
                this.clustering = false;
            }
        }
    },
    // 重新计算聚合点位
    getMeansC: function(clusterArrary) {
        for (var j = 0; j < clusterArrary.length; j++) {
            if (clusterArrary[j].cluster && clusterArrary[j].cluster.length > 0) {
                var sumX = 0;
                var sumY = 0;
                for (var i = 0; i < clusterArrary[j].cluster.length; i++) {
                    sumX += clusterArrary[j].cluster[i].geometry.x;
                    sumY += clusterArrary[j].cluster[i].geometry.y;
                }
                // var i = Math.floor(clusterArrary[j].cluster.length / 2);
                // sumX = clusterArrary[j].cluster[i].geometry.x;
                // sumY = clusterArrary[j].cluster[i].geometry.y;
                // var length = 1; 
                var length = clusterArrary[j].cluster.length;
                var x = sumX / length;
                var y = sumY / length;
                var d = 999999999999;
                var geometry = null;
                for (var i = 0; i < clusterArrary[j].cluster.length; i++) {
                    var cluster = clusterArrary[j].cluster[i];
                    var temp = (x - cluster.geometry.x) * (x - cluster.geometry.x) + (y - cluster.geometry.y) * (y - cluster.geometry.y);
                    if (temp < d) {
                        d = temp;
                        geometry = cluster.geometry;
                    }
                }
                clusterArrary[j].geometry.x = geometry.x;
                clusterArrary[j].geometry.y = geometry.y;
                // clusterArrary[j].geometry.x = sumX / length;
                // clusterArrary[j].geometry.y = sumY / length;
            }
        }
    },
    getE: function(classes, means) {
        var sum = 0;
        for (var i = 0; i < classes.length; i++) {
            var v = classes[i];
            if (!v.cluster) {
                continue;
            }
            for (var j = 0; j < v.cluster.length; j++) {
                var p = v.cluster[j];
                sum += (p.geometry.x - means[i].geometry.x) * (p.geometry.x - means[i].geometry.x) + (p.geometry.y - means[i].geometry.y) * (p.geometry.y - means[i].geometry.y);
            }
        }
        return sum;
    },
    searchMinC: function(t, means) {
        var c = -1;
        var d = 999999999999;
        for (var i = 0; i < means.length; i++) {
            if (t.markType !== means[i].data.markType) {
                continue;
            }
            var temp = (t.geometry.x - means[i].geometry.x) * (t.geometry.x - means[i].geometry.x) + (t.geometry.y - means[i].geometry.y) * (t.geometry.y - means[i].geometry.y);
            if (temp < d) {
                c = i;
                d = temp;
            }
        }
        return c;
    },
    startAddFeatures: function() {
        if (this.clusters && this.clusters[this.index]) {
            var drawData = this.clusters[this.index];
            if (this.layer.showMarker[drawData.data.markType]) {
                this.layer.addFeatures([drawData], {
                    silent: true
                });
                if (drawData.cluster) {
                    for (var i = 0; i < drawData.cluster.length; i++) {
                        drawData.cluster[i]._status = true;
                    }
                } else {
                    drawData.data._status = true;
                }
            }
            this.index++;
            this.timer = window.setTimeout(this.startAddFeatures.bind(this), 10);
        } else {
            if (this.callbackFun) {
                this.callbackFun();
                this.callbackFun = null;
            }
        }

    },
    cacheFeatures: function(event) {
        var propagate = true;
        if (!this.clustering) {
            this.clearCache();
            this.features = event.features;
            this._clusterDataStatus = this.features.slice();
            this._xData =
                this._clusterDataStatus.slice().sort(function(f, f1) {
                    return f.geometry.x > f1.geometry.x ? 1 : -1;
                });
            this.cluster();
            propagate = false;
        }
        return propagate;
    },
    clearCache: function(e) {
        if (!this.clustering) {
            this.features = null;
            this.oldClusters = [];
            if (e) {}
        }
    },
    /**
     * Method: findFeaturesInClusters
     * Given a set of features and an array of clusters returns the cluster
     * where the features are located.
     *
     * Parameters:
     * features - {Array} An array of <OpenLayers.Feature.Vector>.
     * clusters - A cluster as an array of <OpenLayers.Feature.Vector>.
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>} The cluster where the first feature of
     * the feature array is found.
     */
    findFeaturesInClusters: function(features, clusters) {
        for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            for (var j = 0; j < clusters.length; j++) {
                var cluster = clusters[j];
                // if cluster is really cluster not a feature
                if (cluster.attributes.count) {
                    var clusterFeatures = clusters[j].cluster;
                    for (var k = 0; k < clusterFeatures.length; k++) {
                        if (feature.id === clusterFeatures[k].id) {
                            return cluster;
                        }
                    }
                }
            }
        }
        return null;
    },
    /** 
     * APIMethod: animate
     * Animates the clusters changing its position.
     *
     * Parameters:
     * delta - {Object} Object with x-y values with the new increments to
     * be applied.
     */
    animate: function(delta) {
        var clusters = this.zoomIn ? this.clusters : this.previousClusters;
        for (var i = 0; i < clusters.length; i++) {
            if (!clusters[i]._geometry) continue;

            var dx = (clusters[i]._geometry.destx - clusters[i]._geometry.origx) * delta.x;
            var dy = (clusters[i]._geometry.desty - clusters[i]._geometry.origy) * delta.y;

            clusters[i].geometry.x = clusters[i]._geometry.origx + dx;
            clusters[i].geometry.y = clusters[i]._geometry.origy + dy;
        }
        this.layer.redraw();
    },

    /**
     * Method: shouldCluster
     * Determine whether to include a feature in a given cluster.
     *
     * Parameters:
     * cluster - {<OpenLayers.Feature.Vector>} A cluster.
     * feature - {<OpenLayers.Feature.Vector>} A feature.
     * previousResolution - {Boolean} Indicates if the check must be made with
     * the current or previous resolution value.
     *
     * Returns:
     * {Boolean} The feature should be included in the cluster.
     */
    shouldCluster: function(cluster, feature, previousResolution) {
        var clusterData = cluster.data.markType;
        var featureData = feature.markType;
        if (clusterData !== featureData) {
            return false;
        }
        var res = previousResolution ? this.previousResolution : this.resolution;
        var cc = cluster.geometry.getBounds().getCenterLonLat();
        var fc = feature.geometry;
        var distance = (
            Math.sqrt(
                Math.pow((cc.lon - fc.x), 2) + Math.pow((cc.lat - fc.y), 2)
            ) / res
        );
        return (distance <= this.distance);
    },

    /**
     * Method: createCluster
     * Given a feature, create a cluster.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>} A cluster.
     */
    createCluster: function(feature) {
        var center = feature.geometry;
        var markType = feature.markType;
        var cluster = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.Point(center.x, center.y), {
                count: 0,
                markType: markType,
                feature: feature
            }
        );
        //cluster.cluster = [feature];
        cluster.cluster = [];
        cluster.sx = feature.geometry.x;
        cluster.sy = feature.geometry.y;
        return cluster;
    },
    // 当隐藏某一组数据时，需要将其从集合中删除
    afterhidenMarkers: function(features) {

    },
    setStatistics: function(statistics) {
        this.statistics = statistics;
        if (this.layer.map.getZoom() < this.minZoom) {
            this.layer.removeAllFeatures();
            for (var i = 0; i < this.statistics.length; i++) {
                if (this.statistics[i] && this.statistics[i].x && this.statistics[i].y && this.statistics[i].label > 0) {
                    var cluster = new OpenLayers.Feature.Vector(
                        new OpenLayers.Geometry.Point(this.statistics[i].x, this.statistics[i].y), {
                            count: this.statistics[i].label,
                            isStatistics: true
                        }
                    );
                    this.layer.addFeatures([cluster], {
                        silent: true
                    });
                }
            }
        }
    },
    addClusterMarker: function(markers) {
        window.clearTimeout(this.timer);
        if (this.layer.map.getZoom() < this.minZoom) {
            return;
        }
        var isZoom = this.maxZoom && this.layer.map.getZoom() >= this.maxZoom;
        var clusters = [];
        var clustered = false;
        var cluster = null;
        for (var i = 0; i < markers.length; i++) {
            // var feature = markers[i]._apiObj;
            // this._clusterDataStatus.push(feature);
            var geo = markers[i].geometry;
            if (this.layer && this.layer.map) {
                var screenBounds = this.layer.map.getExtent();
                if (!screenBounds.contains(geo.x, geo.y, true)) {
                    continue;
                }
                // if (!screenBounds.intersectsBounds(featureBounds)) {
                //     continue;
                // }
            }
            markers[i]._status = true;
            if (!isZoom && markers[i].geometry) {
                // Cluster for the current resolution
                clustered = false;
                for (var j = clusters.length - 1; j >= 0; --j) {
                    cluster = clusters[j];
                    if (this.shouldCluster(cluster, markers[i])) {
                        //this.addToCluster(cluster, markers[i]);
                        cluster.attributes.count++;
                        cluster.cluster.push(markers[i]);
                        clustered = true;
                        break;
                    }
                }
                if (!clustered) {
                    clusters.push(this.createCluster(markers[i]));
                }
            } else {
                var feature = new OpenLayers.Feature.Vector(
                    new OpenLayers.Geometry.Point(geo.x, geo.y), {
                        count: 1,
                        markType: markers[i].markType
                    }
                );
                feature.data = markers[i];
                markers[i]._apiObj = feature;
                // if (feature.cluster) {
                //     Array.prototype.push.apply(clusters, feature.cluster);
                // } else {
                clusters.push(feature);
                // }
            }
        }
        this.getMeansC(clusters);
        var clone = clusters.slice();
        clusters = [];
        var candidate;
        for (var i = 0, len = clone.length; i < len; ++i) {
            candidate = clone[i];
            if (candidate.attributes.count < this.threshold && candidate.cluster) {
                for (var m = 0; m < candidate.cluster.length; m++) {
                    var g = candidate.cluster[m].geometry;
                    var f = new OpenLayers.Feature.Vector(
                        new OpenLayers.Geometry.Point(g.x, g.y), {
                            count: 1,
                            markType: markers[i].markType
                        }
                    );
                    f.data = candidate.cluster[m];
                    candidate.cluster[m]._apiObj = f;
                    clusters.push(f);
                }
                //Array.prototype.push.apply(clusters, candidate.cluster);
            } else {
                clusters.push(candidate);
            }
        }
        this.layer.addFeatures(clusters, {
            silent: true
        });
    },
    createNewCluster: function(feature) {
        var center = feature.geometry.getBounds().getCenterLonLat();
        var markType = feature.data.markType;
        var cluster = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.Point(center.lon, center.lat), {
                count: 1,
                markType: markType
            }
        );
        cluster.cluster = [feature];
        cluster.sx = feature.geometry.x;
        cluster.sy = feature.geometry.y;
        return cluster;
    },
    filterClusterMarks: function(filterFun) {
        if (this.layer.map.getZoom() < this.minZoom) {
            this.filterFun = filterFun;
            return;
        }
        var newList = [];
        this.layer.removeFeatures(this.layer.features, {
            silent: true
        });
        // 根据可视区域重新计算聚合点
        var screenBounds = this.layer.map.getExtent();
        var xmin = screenBounds.left;
        var xmax = screenBounds.right;

        var ymin = screenBounds.bottom;
        var ymax = screenBounds.top;

        var xStart = this.binarySearch(this._xData, xmin, 'x');
        var xEnd = this.binarySearch(this._xData, xmax, 'x');
        var newXData = this._xData.slice(xStart, xEnd + 1);
        this._clusterDataStatus = newXData.slice();

        for (var i = this._clusterDataStatus.length - 1; i >= 0; i--) {
            var f = this._clusterDataStatus[i].data;
            if (filterFun(f)) {
                newList.push(f);
            }
        }
        this._clusterDataStatus = [];
        this.addClusterMarker(newList);
        this.filterFun = filterFun;
    },
    CLASS_NAME: "OpenLayers.Strategy.AnimatedCluster"
});