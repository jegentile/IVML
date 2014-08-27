//@defining:ivml.visualElement:points
var ivml = ivml || {};
ivml.visualElements = ivml.visualElements || {};

ivml.visualElements.Points = function Points(controller, $timeout) {
    var Points = {
        elements: {
            controller: controller,
            $timeout: $timeout,
            svg_g: null
        },
        accessors: {
            data: [], //@ir the javascript data object to be plotted
            xfunction: null, //@ir accessor for data's x value
            yfunction: null  //@ir accessor for data's y value
        },
        attributes: {
            cursor: 'default', //@s hover cursor style
            radius: 1,       //@s point's radius
            fill: "#000000", //@s point's fill
            fillOpacity: 1, //@s  opacity of the points fill
            stroke: 'none', //@s  color of the point's outline
            strokeOpacity: 1,  //@s opacity of the point's outline
            strokeDasharray: 'none' //@s dash array for point's outline
        },
        events: {
            mouseOverE: null, //@e mouse over event
            mouseOutE: null,  //@e mouse out event
            clickE: null      //@e mouse click event
        }
    };

    Points.setGraphics = function () {
        if (Points.elements.controller && !Points.elements.svg_g) {
            Points.elements.svg_g = Points.elements.controller.getUnmaskedLayer().append('g');
        }
    }

    Points.redraw = function () {
        if (!Points.elements.controller) return;
        var xs = Points.elements.controller.getXScale();
        var ys = Points.elements.controller.getYScale();
        if (!xs) return;
        if (!ys) return;

        Points.setGraphics();
        if (!Points.elements.svg_g) return;

        if (!Points.accessors.data) return;
        if (!Points.accessors.xfunction) return;
        if (!Points.accessors.yfunction) return;
        var xf = Points.accessors.xfunction;
        var yf = Points.accessors.yfunction;

        var xFunction;
        if (xs.rangeBand) {
            var right_push = xs.rangeBand() / 2;

            xFunction = function (d, i) {
                if (xs.domain().indexOf(xf(d, i)) >= 0)
                    return xs(xf(d, i)) + right_push;
                return null;
            };
        }
        else {
            xFunction = function (d, i) {
                return xs(xf(d, i));
            };
        }

        var yFunction;
        if (ys.rangeBand) {
            var up_push = ys.rangeBand() / 2;
            yFunction = function (d, i) {
                if (ys.domain().indexOf(yf(d, i)) >= 0)
                    return ys(yf(d, i)) + up_push;
                return null;
            };
        }
        else {
            yFunction = function (d, i) {
                return ys(yf(d, i));
            };
        }

        var points = Points.elements.svg_g.selectAll('circle').data(Points.accessors.data);

        points.enter().append('circle')
            .attr('cx', xFunction)
            .attr('cy', yFunction)
            .attr('fill', Points.attributes.fill)
            .attr('r', Points.attributes.radius)
            .style('cursor', Points.attributes.cursor)
            .style('fill-opacity', Points.attributes.fillOpacity)
            .style('stroke', Points.attributes.stroke)
            .style('stroke-opacity', Points.attributes.strokeOpacity)
            .style('stroke-dasharray', Points.attributes.strokeDasharray);

        ivml.animateSelection(points
                //hide points outside of plot area
                .style('visibility', function (d, i) {
                    if (xs.rangeBand) {
                        if (xFunction(d, i) == null)
                            return 'hidden';
                    }
                    else {
                        var x = xf(d, i);
                        if (xs.domain()[0] > x || x > xs.domain()[1])
                            return 'hidden';
                    }

                    if (ys.rangeBand) {
                        if (yFunction(d, i) == null)
                            return 'hidden';
                    }
                    else {
                        var y = yf(d);
                        if (ys.domain()[0] > y || y > ys.domain()[1])
                            return 'hidden';
                    }

                    return 'visible';
                }))
            .attr('cx', xFunction)
            .attr('cy', yFunction)
            .attr('fill', Points.attributes.fill)
            .attr('r', Points.attributes.radius)
            .style('cursor', Points.attributes.cursor)
            .style('fill-opacity', Points.attributes.fillOpacity)
            .style('stroke', Points.attributes.stroke)
            .style('stroke-opacity', Points.attributes.strokeOpacity)
            .style('stroke-dasharray', Points.attributes.strokeDasharray);

        points.exit().remove();

        if (Points.events.mouseOutE) {
            points.on('mouseout', function (d, i) {
                Points.events.mouseOutE(d, i, d3.select(this));
            });
        }
        if (Points.events.mouseOverE) {
            points.on('mouseover', function (d, i) {
                Points.events.mouseOverE(d, i, d3.select(this));
            });
        }
        if (Points.events.clickE) {
            points.on('click', function (d, i) {
                Points.events.clickE(d, i, d3.select(this));
            })
        }
    }

    for (var i in Points.accessors) {
        Points[i] = ivml.generate_set_function_for_accessors(Points, i);
    }

    for (var i in Points.attributes) {
        Points[i] = ivml.generate_set_function_for_attributes(Points, i);
    }

    for (var i in Points.events) {
        Points[i] = ivml.generate_set_function_for_events(Points, i);
    }

    return Points;
}
