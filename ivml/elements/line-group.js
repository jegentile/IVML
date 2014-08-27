//@defining:ivml.visualElement:lineGroup
//@description Plots a group of {\tt <paths>} elements cumulatively as a stacked area chart.

var ivml = ivml || {};
ivml.visualElements = ivml.visualElements || {};

ivml.visualElements.LineGroup = function LineGroup(controller, lineGroupController, $timeout) {
    var LineGroup = {
        elements: {
            controller: controller,
            lineGroupController: lineGroupController,
            $timeout: $timeout,
            svg_g: null,
            svg_gFills: null,
            svg_gLines: null
        }
    };

    function setGraphics() {
        if (!LineGroup.elements.controller) return;
        if (!(LineGroup.elements.svg_g && LineGroup.elements.svg_gFills && LineGroup.elements.svg_gLines )) {
            LineGroup.elements.svg_g = LineGroup.elements.controller.getMaskedLayer().append('g');
            LineGroup.elements.svg_gFills = LineGroup.elements.svg_g.append('g');
            LineGroup.elements.svg_gLines = LineGroup.elements.svg_g.append('g');
        }
    }

    LineGroup.getFillGraphic = function () {
        setGraphics();
        return LineGroup.elements.svg_gFills;
    }

    LineGroup.getLineGraphic = function () {
        setGraphics();
        return LineGroup.elements.svg_gLines;
    }

    LineGroup.redraw = function () {
        if (!LineGroup.elements.controller || !LineGroup.elements.lineGroupController) {
            return;
        }

        var xs = LineGroup.elements.controller.getXScale();
        if (!xs) return;

        var allPaths = LineGroup.elements.lineGroupController.paths.map(function (paths) {
            return paths.getAllPathsPoints();
        });

        var allXValues = [];

        allPaths.forEach(function (paths) {
            paths.forEach(function (path) {
                path.forEach(function (d) {
                    if (allXValues.indexOf(d[0]) === -1) {
                        allXValues.push(d[0]);
                    }
                });
            });
        });

        //Sort if x scale is continuous
        if (!xs.rangeBand) {
            allXValues = allXValues.sort(d3.ascending);
        }

        var cumulativeValues = allXValues
            .map(function (x) {
                var rtrn = [x, 0];
                rtrn.lastY = 0;
                rtrn.previousStarts = false;
                rtrn.previousEnds = false;
                return rtrn;
            });

        function interpolateY(x, x0, x1, y0, y1) {
            return y0 + (x - x0) / (x1 - x0) * (y1 - y0);
        }

        function getYatX(x, sortedArr) {
            if (sortedArr.length > 0) {
                for (var i = 0; i < sortedArr.length; i++) {
                    var d = sortedArr[i];
                    if (d[0] === x) {
                        return d[1];
                    }
                    else if (i < sortedArr.length - 1) {
                        var d2 = sortedArr[i + 1];
                        if (d[0] < x && x < d2[0]) {
                            return interpolateY(x, d[0], d2[0], d[1], d2[1])
                        }
                    }
                }
            }
            return undefined;
        }

        allPaths.forEach(function (paths, index) {
            LineGroup.elements.lineGroupController.paths[index].setCumulativePaths(
                paths.map(function (path) {
                    var sorted = path.slice(0).sort(function (a, b) {
                        return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
                    });

                    var bottomLine = [];
                    var topLine = [];
                    var previousPoint = undefined;
                    cumulativeValues.forEach(function (d) {
                        var y = getYatX(d[0], sorted);
                        if (y !== undefined) {
                            if (d.previousStarts && previousPoint) {
                                //fills in the blank area cause when
                                //lower series start entirely beneath this series.
                                bottomLine.push([d[0], d.lastY, false]);
                            }
                            bottomLine.push([d[0], d[1], false]);
                            if (d.previousEnds && sorted[sorted.length - 1][0] !== d[0]) {
                                //fills in the blank area cause when
                                //lower series end entirely beneath this series.
                                bottomLine.push([d[0], d.lastY, false]);
                            }

                            if (!(d.previousStarts || d.previousEnds)) {
                                //do not want to move the bottommost point in cases where
                                //two or more series start or end at the same spot.
                                d.lastY = d[1];
                            }

                            y += d[1];
                            topLine.push([d[0], y, true]);
                            d[1] = y;
                            d.previousStarts = !previousPoint;
                            d.previousEnds = false;
                            previousPoint = d;
                        }
                        else if (previousPoint) {
                            d.previousStarts = false;
                            previousPoint.previousEnds = true;
                            previousPoint = undefined;
                        }
                    });

                    return topLine.concat(bottomLine.reverse());
                })
            );
        });
    }

    return LineGroup;
}
