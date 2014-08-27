//@defining:ivml.visualElement:cylinders
//@description Disks defined by a radius and height.

var ivml = ivml || {};
ivml.visualElements = ivml.visualElements || {};

ivml.visualElements.Cylinders = function Cylinders(controller, $timeout) {
    var Cylinders = {
        elements: {
            controller: controller,
            $timeout: $timeout,
            svg_g: null
        },
        accessors: {
            data: [], //@ir javascript data object
            centerxfunction: null, //@ir center function for x position
            centeryfunction: null, //@ir center function for y position
            adjustyfunction: 0, //@ir TODO
            adjustxfunction: 0, //@ir TODO
            height: 10, //@i height of the object
            width: 30  //@i width of the object
        },
        attributes: {
            radius: 1, //@s radius of the cirle
            fill: "#000000", //@s fill color
            fillOpacity: 1, //@s fill opacity
            stroke: 'none',  //@s stroke color
            strokeOpacity: 1,  //@s stroke opacity
            strokeDasharray: 'none' //@s stroke dashing
        },
        events: {
            mouseOverE: null,  //@e mouse over event
            mouseOutE: null, //@e mouse out event
            clickE: null  //@e mouse click event
        }
    };

    Cylinders.setGraphics = function () {
        if (Cylinders.elements.controller && !Cylinders.elements.svg_g) {
            Cylinders.elements.svg_g = Cylinders.elements.controller.getUnmaskedLayer().append('g');
        }
    }

    Cylinders.redraw = function () {
        if (!Cylinders.elements.controller) return;
        var xs = Cylinders.elements.controller.getXScale();
        var ys = Cylinders.elements.controller.getYScale();
        if (!xs) return;
        if (!ys) return;

        Cylinders.setGraphics();
        if (!Cylinders.elements.svg_g) return;

        if (!Cylinders.accessors.data) return;
        if (!Cylinders.accessors.centerxfunction) return;
        if (!Cylinders.accessors.centeryfunction) return;
        if (Cylinders.accessors.adjustxfunction == null) return;
        if (Cylinders.accessors.adjustyfunction == null) return;
        if (!Cylinders.accessors.height) return;
        if (!Cylinders.accessors.width) return;

        var xf = Cylinders.accessors.centerxfunction;
        var yf = Cylinders.accessors.centeryfunction;
        var xaf = Cylinders.accessors.adjustxfunction;
        var yaf = Cylinders.accessors.adjustyfunction;
        var wf = Cylinders.accessors.width;
        var hf = Cylinders.accessors.height;

        var right_push = 0;
        var up_push = 0;

        var filteredData = Cylinders.accessors.data;

        if (xs.rangeBand) {
            right_push += xs.rangeBand() / 2;
            filteredData = filteredData.filter(function (d, i) {
                return xs.domain().indexOf(xf(d, i)) >= 0;
            });
        }

        if (ys.rangeBand) {
            up_push += ys.rangeBand() / 2;
            filteredData = filteredData.filter(function (d, i) {
                return ys.domain().indexOf(yf(d, i)) >= 0;
            });
        }

        var cylinders = Cylinders.elements.svg_g.selectAll('g').data(filteredData);

        var enter = cylinders.enter().append('g');
        enter.append('ellipse');
        enter.append('rect');
        enter.append('line');
        enter.append('line');
        enter.append('ellipse');

        cylinders.exit().remove();

        cylinders = Cylinders.elements.svg_g.selectAll('g');

        cylinders.each(function (d, index) {
            var cylinder = d3.select(this);

            var x = xs(xf(d, index)) + (ivml.isF(xaf) ? xaf(d, index) : xaf) + right_push;
            var y = ys(yf(d, index)) + (ivml.isF(yaf) ? yaf(d, index) : yaf) + up_push;
            var w = ivml.isF(wf) ? wf(d, index) : wf;
            var h = ivml.isF(hf) ? hf(d, index) : hf;

            cylinder.selectAll('ellipse')
                .attr('cx', x)
                .attr('rx', w / 2)
                .attr('cy', function (d, i) {
                    if (i === 0) {
                        return y + h / 3;
                    }
                    else {
                        return y - h / 3;
                    }
                })
                .attr('ry', h / 6)
                .attr('fill', Cylinders.attributes.fill)
                .style('fill-opacity', Cylinders.attributes.fillOpacity)
                .style('stroke', Cylinders.attributes.stroke)
                .style('stroke-opacity', Cylinders.attributes.strokeOpacity)
                .style('stroke-dasharray', Cylinders.attributes.strokeDasharray);

            cylinder.selectAll('rect')
                .attr('x', x - w / 2)
                .attr('y', y - h / 3)
                .attr('height', 2 * h / 3)
                .attr('width', w)
                .attr('fill', Cylinders.attributes.fill)
                .style('fill-opacity', Cylinders.attributes.fillOpacity)
                .style('stroke', 'none');

            function xFunc(d, i) {
                return x + (i === 0 ? -w : w)/2;
            };

            cylinder.selectAll('line')
                .attr('x1', xFunc)
                .attr('x2', xFunc)
                .attr('y1', y - h / 3)
                .attr('y2', y + h / 3)
                .style('stroke', Cylinders.attributes.stroke)
                .style('stroke-opacity', Cylinders.attributes.strokeOpacity)
                .style('stroke-dasharray', Cylinders.attributes.strokeDasharray);
        });

        cylinders
            //hide cylinders outside of plot area
            .style('visibility', function (d, i) {
                if (!xs.rangeBand) {
                    var x = xf(d, i);
                    if (xs.domain()[0] > x || x > xs.domain()[1]) return 'hidden';
                }

                if (!ys.rangeBand) {
                    var y = yf(d, i);
                    if (ys.domain()[0] > y || y > ys.domain()[1]) return 'hidden';
                }

                return 'visible';
            });

        if (Cylinders.events.mouseOutE) {
            cylinders.on('mouseout', function (d, i) {
                Cylinders.events.mouseOutE(d, i, d3.select(this));
            });
        }
        if (Cylinders.events.mouseOverE) {
            cylinders.on('mouseover', function (d, i) {
                Cylinders.events.mouseOverE(d, i, d3.select(this));
            });
        }
        if (Cylinders.events.clickE) {
            cylinders.on('click', function (d, i) {
                Cylinders.events.clickE(d, i, d3.select(this));
            })
        }
    }

    for (var i in Cylinders.accessors) {
        Cylinders[i] = ivml.generate_set_function_for_accessors(Cylinders, i);
    }

    for (var i in Cylinders.attributes) {
        Cylinders[i] = ivml.generate_set_function_for_attributes(Cylinders, i);
    }

    for (var i in Cylinders.events) {
        Cylinders[i] = ivml.generate_set_function_for_events(Cylinders, i);
    }

    return Cylinders;
}
