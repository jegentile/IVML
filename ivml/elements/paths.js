//@defining:ivml.visualElement:paths
//@description Paths are visual elements that are defined by a series of points with x and y values

var ivml = ivml || {};
ivml.visualElements = ivml.visualElements || {};

ivml.visualElements.Paths = function Paths(controller, lineGroupController, $timeout) {
    var Paths = {
        elements: {
            controller: controller,
            lineGroupController: lineGroupController,
            $timeout: $timeout,
            cumulativePaths: undefined,
            svg_g: null,
            svg_gFill: null,
            svg_gLine: null
        },
        attributes: {
            stroke: 'gray',   //@s color of object's outline
            strokeWidth: 3,  //@s width of object's outline
            strokeOpacity: 1,   //@s opacity of object's outline
            strokeDasharray: 'none',//@s dashing of object's outline
            fill: 'none', //@s color opacity of object
            fillOpacity: 1, //@s fill opacity of object
            interpolate: 'linear' //@s interpolation mode of the object (https://github.com/mbostock/d3/wiki/SVG-Shapes#line_interpolate)
        },
        accessors: {
            data: [],    //@ir the javascript data object to plot
            pointsFunction: null, //@ir returns an array of JavaScript objects that represent the points of the path.
            xfunction: null,  //@ir accessor for the x value of an element of the points array
            yfunction: null  //@ir accessor for the y value of an element of the points array
        }
    };

    Paths.getAllPathsPoints = function () {
        if (Paths.elements.controller) {
            var p = Paths.accessors.pointsFunction;
            var xs = Paths.elements.controller.getXScale();
            var ys = Paths.elements.controller.getYScale();
            var xf = Paths.accessors.xfunction;
            var yf = Paths.accessors.yfunction;
            if (p && xs && ys && xf && yf && Paths.accessors.data) {
                return Paths.accessors.data.map(function (path) {
                    path = p(path).map(function (d, i) {
                        return [xf(d, i), yf(d, i)];
                    });

                    if (xs.rangeBand) {
                        path = path.filter(function (d) {
                            return xs.domain().indexOf(d[0]) >= 0;
                        });
                    }

                    if (ys.rangeBand) {
                        path = path.filter(function (d) {
                            return ys.domain().indexOf(d[1]) >= 0;
                        });
                    }

                    return path;
                });
            }
        }
        return [];
    };

    Paths.setCumulativePaths = function (paths) {
        Paths.elements.cumulativePaths = paths;
        Paths.redraw();
    }

    Paths.setGraphics = function () {
        if (Paths.elements.lineGroupController) {
            if (!(Paths.elements.svg_gFill && Paths.elements.svg_gLine )) {
                Paths.elements.svg_gFill = Paths.elements.lineGroupController.getFillGraphic().append('g');
                Paths.elements.svg_gLine = Paths.elements.lineGroupController.getLineGraphic().append('g');
            }
        }
        else if (Paths.elements.controller && !Paths.elements.svg_g) {
            Paths.elements.svg_g = Paths.elements.controller.getMaskedLayer().append('g');
        }
    }

    Paths.redraw = function () {
        if (!Paths.elements.controller) return;
        if (!Paths.accessors.data) return;
        if (!Paths.accessors.pointsFunction) return;
        if (!Paths.accessors.xfunction) return;
        if (!Paths.accessors.yfunction) return;

        var xs = Paths.elements.controller.getXScale();
        if (!xs) return;
        var ys = Paths.elements.controller.getYScale();
        if (!ys) return;

        Paths.setGraphics();

        var right_push = 0;
        if (xs.rangeBand) {
            right_push += xs.rangeBand() / 2;
        }

        var up_push = 0;
        if (ys.rangeBand) {
            up_push += ys.rangeBand() / 2;
        }

        if (Paths.elements.lineGroupController) {
            if (!Paths.elements.cumulativePaths) return;

            if (!Paths.elements.svg_gFill || !Paths.elements.svg_gLine) {
                return;
            }

            var l = d3.svg.line()
                .x(function (d) {
                    return xs(d[0]) + right_push;
                })
                .y(function (d) {
                    return ys(d[1]);
                });

            var setInterpolateForEach = ivml.isF(Paths.attributes.interpolate);

            if (!setInterpolateForEach) {
                l.interpolate(Paths.attributes.interpolate);
            }

            var fillPaths = Paths.elements.svg_gFill.selectAll('path').data(Paths.accessors.data);

            fillPaths.enter().append('path')
                .attr('d', function (d, i) {
                    if (setInterpolateForEach) {
                        l.interpolate(Paths.attributes.interpolate(d, i));
                    }
                    return l(Paths.elements.cumulativePaths[i]) || 'M0,0';
                })
                .attr('stroke', 'none')
                .attr('fill', Paths.attributes.fill)
                .attr('fill-opacity', Paths.attributes.fillOpacity);

            fillPaths
                .attr('d', function (d, i) {
                    if (setInterpolateForEach) {
                        l.interpolate(Paths.attributes.interpolate(d, i));
                    }
                    return l(Paths.elements.cumulativePaths[i]) || 'M0,0';
                })
                .attr('stroke', 'none')
                .attr('fill', Paths.attributes.fill)
                .attr('fill-opacity', Paths.attributes.fillOpacity);

            fillPaths.exit().remove();

            var linePaths = Paths.elements.svg_gLine.selectAll('path').data(Paths.accessors.data);

            linePaths.enter().append('path').attr('d', function (d, i) {
                if (setInterpolateForEach) {
                    l.interpolate(Paths.attributes.interpolate(d, i));
                }
                return l(Paths.elements.cumulativePaths[i].filter(function (p) {
                    return p[2];
                })) || 'M0,0';
            });

            linePaths
                .attr('d', function (d, i) {
                    if (setInterpolateForEach) {
                        l.interpolate(Paths.attributes.interpolate(d, i));
                    }
                    return l(Paths.elements.cumulativePaths[i].filter(function (p) {
                        return p[2];
                    })) || 'M0,0';
                })
                .attr('stroke', Paths.attributes.stroke)
                .attr('stroke-width', Paths.attributes.strokeWidth)
                .attr('stroke-opacity', Paths.attributes.strokeOpacity)
                .attr('stroke-dasharray', Paths.attributes.strokeDasharray)
                .attr('fill', 'none');

            linePaths.exit().remove();
        }
        else {
            if (!Paths.elements.svg_g) return;

            var l = d3.svg.line()
                .x(function (d) {
                    return xs(d[0]) + right_push;
                })
                .y(function (d) {
                    return ys(d[1]) + up_push;
                });

            var setInterpolateForEach = ivml.isF(Paths.attributes.interpolate);

            if (!setInterpolateForEach) {
                l.interpolate(Paths.attributes.interpolate);
            }

            var filteredPaths = Paths.getAllPathsPoints();

            var paths = Paths.elements.svg_g.selectAll('path').data(Paths.accessors.data);

            paths.enter().append('path')
                .attr('d', function (d, i) {
                    if (setInterpolateForEach) {
                        l.interpolate(Paths.attributes.interpolate(d, i));
                    }
                    return l(filteredPaths[i]) || 'M0,0';
                });

            ivml.animateSelection(paths)
                .attr('d', function (d, i) {
                    if (setInterpolateForEach) {
                        l.interpolate(Paths.attributes.interpolate(d, i));
                    }
                    return l(filteredPaths[i]) || 'M0,0';
                })
                .attr('stroke', Paths.attributes.stroke)
                .attr('stroke-width', Paths.attributes.strokeWidth)
                .attr('stroke-opacity', Paths.attributes.strokeOpacity)
                .attr('stroke-dasharray', Paths.attributes.strokeDasharray)
                .attr('fill', Paths.attributes.fill)
                .attr('fill-opacity', Paths.attributes.fillOpacity);

            paths.exit().remove();
        }
    }

    for (var i in Paths.accessors) {
        Paths[i] = ivml.generate_set_function_for_accessors(Paths, i, function () {
            if (Paths.elements.lineGroupController) {
                Paths.elements.lineGroupController.redraw();
            }
            else {
                Paths.redraw();
            }
        });
    }

    for (var i in Paths.attributes) {
        Paths[i] = ivml.generate_set_function_for_attributes(Paths, i, function () {
            if (Paths.elements.lineGroupController) {
                Paths.elements.lineGroupController.redraw();
            }
            else {
                Paths.redraw();
            }
        });
    }

    return Paths;
}
