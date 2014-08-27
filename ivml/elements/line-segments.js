//@defining:ivml.visualElement:lineSegments
//@description Line segments are visual elements defined with a starting and ending point.

var ivml = ivml || {};
ivml.visualElements = ivml.visualElements || {};

ivml.visualElements.LineSegments = function LineSegments(controller, $timeout) {

    var LineSegments = {
        elements: {
            controller: controller,
            $timeout: $timeout,
            xscale: null,
            yscale: null,
            svg_g: null,
            frame: null
        },

        attributes: {
            stroke: 'gray', //@s color of the line
            strokeWidth: 3, //@s width of the line
            strokeOpacity: 1.0,//@s opacity of the line
            strokeDasharray: "10" //@s dashing of the line
        },
        accessors: {
            data: [], //@ir the javascript data object to be plotted
            x1Function: null,  //@ir accessor for data's x start point
            y1Function: null,  //@ir accessor for data's y start point
            x2Function: null,  //@ir accessor for data's x end point
            y2Function: null   //@ir accessor for data's y end point
        },
        events: {
            mouseOverE: null,  //@e mouse over event
            mouseOutE: null,  //@e mouse out event
            clickE: null       //@e mouse click event
        }

    }

    LineSegments.setGraphics = function () {
        if (LineSegments.elements.controller && !LineSegments.elements.svg_g) {
            LineSegments.elements.svg_g = LineSegments.elements.controller.getMaskedLayer().append('g');
        }
    }


    LineSegments.redraw = function () {
        if (!LineSegments.elements.controller) return;
        var xs = LineSegments.elements.controller.getXScale();
        var ys = LineSegments.elements.controller.getYScale();
        if (!xs) return;
        if (!ys) return;

        LineSegments.setGraphics();
        if (!LineSegments.elements.svg_g) return;

        if (!LineSegments.accessors.data) return;

        if (!LineSegments.accessors.x1Function) return;
        if (!LineSegments.accessors.y1Function) return;

        if (!LineSegments.accessors.x2Function) return;
        if (!LineSegments.accessors.y2Function) return;

        var x1f = LineSegments.accessors.x1Function;
        var y1f = LineSegments.accessors.y1Function;
        var x2f = LineSegments.accessors.x2Function;
        var y2f = LineSegments.accessors.y2Function;

        var right_push = 0;
        var up_push = 0;

        if (xs.rangeBand) {
            right_push += xs.rangeBand() / 2;
        }

        if (ys.rangeBand) {
            up_push += ys.rangeBand() / 2;
        }

        var lines = LineSegments.elements.svg_g.selectAll('line').data(LineSegments.accessors.data);

        lines.enter().append('line')
            .attr('x1', function (d,i) {
                return xs(x1f(d,i))+right_push;
            })
            .attr('y1', function (d,i) {
                return ys(y1f(d,i))+up_push;
            })
            .attr('x2', function (d,i) {
                return xs(x2f(d,i))+right_push;
            })
            .attr('y2', function (d,i) {
                return ys(y2f(d,i))+up_push;
            })
            .attr('stroke', LineSegments.attributes.stroke)
            .attr('stroke-width', LineSegments.attributes.strokeWidth)
            .attr('stroke-opacity', LineSegments.attributes.strokeOpacity)
            .attr('stroke-dasharray', LineSegments.attributes.strokeDasharray);


        lines.transition()
            .attr('x1', function (d) {
                return xs(x1f(d))+right_push;
            })
            .attr('y1', function (d) {
                return ys(y1f(d))+up_push;
            })
            .attr('x2', function (d) {
                return xs(x2f(d))+right_push;
            })
            .attr('y2', function (d) {
                return ys(y2f(d))+up_push;
            })
            .attr('stroke', LineSegments.attributes.stroke)
            .attr('stroke-width', LineSegments.attributes.strokeWidth)
            .attr('stroke-opacity', LineSegments.attributes.strokeOpacity)
            .attr('stroke-dasharray', LineSegments.attributes.strokeDasharray);



        lines.exit().remove()

        if (LineSegments.events.mouseOutE) {
            lines.on('mouseout', function (d, i) {
                LineSegments.events.mouseOutE(d, i, d3.select(this));
            });
        }
        if (LineSegments.events.mouseOverE) {
            lines.on('mouseover', function (d, i) {
                LineSegments.events.mouseOverE(d, i, d3.select(this));
            });
        }
        if (LineSegments.events.clickE) {
            lines.on('click', function (d, i) {
                LineSegments.events.clickE(d, i, d3.select(this));
            })
        }

    }

    for (var i in LineSegments.accessors) {
        LineSegments[i] = ivml.generate_set_function_for_accessors(LineSegments, i)
    }

    for (var i in LineSegments.attributes) {
        LineSegments[i] = ivml.generate_set_function_for_attributes(LineSegments, i)
    }

    for (var i in LineSegments.events) {
        LineSegments[i] = ivml.generate_set_function_for_events(LineSegments, i);
    }

    return LineSegments;

}
