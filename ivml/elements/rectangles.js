var ivml = ivml || {};
ivml.visualElements = ivml.visualElements || {};

ivml.visualElements.Rectangles = function Rectangles(controller, $timeout) {
    var Rects = {
        elements: {
            controller: controller,
            $timeout: $timeout,
            xscale: null,
            yscale: null,
            svg_g: null,
            frame: null
        },

        attributes: {
            stroke: 'blue', //@s color of bounding box
            strokeWidth: 3, //@s opacity of bounding box's line
            strokeOpacity: 1.0, //@s opacity of bounding box's line
            fill: 'none', //@s box color
            fillOpacity: 1.0, //@s text opacity
            height: 7.0, //@s box height
            width: 7.0,  //@s box width
            title: null, //@s box text
            cursor: 'default' //@s hover cursor type
        },
        accessors: {
            data: [], //@ir the javascript data object to plot
            heightFunction: null, //@ir height of the text box (required with [x,y][1,2]-function)
            widthFunction: null, //@ir width of the text box (required with [x,y][1,2]-function)
            xcenterFunction: null,//@ir accessor for the data's center x value (required with ycenter-function)
            ycenterFunction: null,//@ir accessor for the data's center y value (required with ycenter-function)
            x1Function: null, //@ir accessor for the data's top left corner x value (required with [x,y][1,2]-function)
            x2Function: null, //@ir accessor for the data's top left corner y value (required with [x,y][1,2]-function)
            y1Function: null, //@ir accessor for the data's bottom right x value  (required with [x,y][1,2]-function)
            y2Function: null  //@ir accessor for the data's bottom right y value (required with [x,y][1,2]-function)
        },
        events: {
            mouseOverE: null, //@e mouse over event
            mouseOutE: null, //@e mouse out event
            clickE: null    //@e mouse click event
        }
    }

    Rects.setGraphics = function () {
        if (Rects.elements.controller && !Rects.elements.svg_g) {
            Rects.elements.svg_g = Rects.elements.controller.getMaskedLayer().append('g');
        }
    }

    Rects.redraw = function () {

        if (!Rects.elements.controller) return;
        var xs = Rects.elements.controller.getXScale();
        var ys = Rects.elements.controller.getYScale();
        if (!xs) return;
        if (!ys) return;

        Rects.setGraphics();
        if (!Rects.elements.svg_g) return;

        if (!Rects.accessors.data) return;
        if (!Rects.accessors.xcenterFunction && !(Rects.accessors.x1Function && Rects.accessors.x2Function)) return;
        if (!Rects.accessors.ycenterFunction && !(Rects.accessors.y1Function && Rects.accessors.y2Function)) return;

        var x_cen = Rects.accessors.xcenterFunction;
        var x1f = Rects.accessors.x1Function;
        var x2f = Rects.accessors.x2Function;

        var y_cen = Rects.accessors.ycenterFunction;
        var y1f = Rects.accessors.y1Function;
        var y2f = Rects.accessors.y2Function;

        var rects = Rects.elements.svg_g.selectAll('rect').data(Rects.accessors.data);

        var width = Rects.attributes.width;
        var height = Rects.attributes.height;

        var xFunction;
        var wFunction;
        if (xs.rangeBand) {
            var right_push = xs.rangeBand() / 2;

            if (x_cen) {
                if (typeof width === 'function') {
                    xFunction = function (d, i) {
                        if (xs.domain().indexOf(x_cen(d, i)) >= 0)
                            return xs(x_cen(d, i)) - width(d, i) / 2 + right_push;
                        return null;
                    };
                }
                else {
                    // we use 7.0 as the default width when an unparsable value is present
                    var w = isNaN(parseFloat(width)) ? 7.0 : parseFloat(width);
                    xFunction = function (d, i) {
                        if (xs.domain().indexOf(x_cen(d, i)) >= 0)
                            return xs(x_cen(d, i)) - w / 2 + right_push;
                        return null;
                    };
                }

                wFunction = width;
            }
            else {
                xFunction = function (d, i) {
                    if (xs.domain().indexOf(x1f(d, i)) >= 0 && xs.domain().indexOf(x2f(d, i)) >= 0)
                        return xs(x1f(d, i)) + right_push;
                    return null;
                }
                wFunction = function (d, i) {
                    if (xs.domain().indexOf(x1f(d, i)) >= 0 && xs.domain().indexOf(x2f(d, i)) >= 0)
                        return xs(x2f(d, i)) - xs(x1f(d, i));
                    return null;
                }
            }
        }
        else {
            if (x_cen) {
                if (typeof width === 'function') {
                    xFunction = function (d, i) {
                        return xs(x_cen(d, i)) - width(d, i) / 2;
                    };
                }
                else {
                    // we use 7.0 as the default width when an unparsable value is present
                    var w = isNaN(parseFloat(width)) ? 7.0 : parseFloat(width);
                    xFunction = function (d, i) {
                        return xs(x_cen(d, i)) - w / 2;
                    };
                }

                wFunction = width;
            }
            else {
                xFunction = function (d, i) {
                    return xs(x1f(d, i));
                }
                wFunction = function (d, i) {
                    return xs(x2f(d, i)) - xs(x1f(d, i));
                }
            }
        }

        var yFunction;
        var hFunction;
        if (ys.rangeBand) {
            var up_push = ys.rangeBand() / 2;

            if (y_cen) {
                if (typeof height === 'function') {
                    yFunction = function (d, i) {
                        if (ys.domain().indexOf(y_cen(d, i)) >= 0)
                            return ys(y_cen(d, i)) - height(d, i) / 2 + up_push;
                        return null;
                    };
                }
                else {
                    // we use 7.0 as the default height when an unparsable value is present
                    var h = isNaN(parseFloat(height)) ? 7.0 : parseFloat(height);
                    yFunction = function (d, i) {
                        if (ys.domain().indexOf(y_cen(d, i)) >= 0)
                            return ys(y_cen(d, i)) - h / 2 + up_push;
                        return null;
                    };
                }

                hFunction = height;
            }
            else {
                yFunction = function (d, i) {
                    if (ys.domain().indexOf(y1f(d, i)) >= 0 && ys.domain().indexOf(y2f(d, i)) >= 0)
                        return ys(y1f(d, i)) + up_push;
                    return null;
                }
                hFunction = function (d, i) {
                    if (ys.domain().indexOf(y1f(d, i)) >= 0 && ys.domain().indexOf(y2f(d, i)) >= 0)
                        return ys(y2f(d, i)) - ys(y1f(d, i));
                    return null;
                }
            }
        }
        else {
            if (y_cen) {
                if (typeof height === 'function') {
                    yFunction = function (d, i) {
                        return ys(y_cen(d, i)) - height(d, i) / 2;
                    };
                }
                else {
                    // we use 7.0 as the default height when an unparsable value is present
                    var h = isNaN(parseFloat(height)) ? 7.0 : parseFloat(height);
                    yFunction = function (d, i) {
                        return ys(y_cen(d, i)) - h / 2;
                    };
                }

                hFunction = height;
            }
            else {
                yFunction = function (d, i) {
                    return ys(y1f(d, i));
                }
                hFunction = function (d, i) {
                    return ys(y2f(d, i)) - ys(y1f(d, i));
                }
            }
        }


        rects.enter().append('rect')
            .attr('x', xFunction)
            .attr('y', yFunction)
            .attr('width', wFunction)
            .attr('height', hFunction)
            .attr('stroke', Rects.attributes.stroke)
            .attr('stroke-width', Rects.attributes.strokeWidth)
            .attr('stroke-opacity', Rects.attributes.strokeOpacity)
            .attr('fill', Rects.attributes.fill)
            .attr('fill-opacity', Rects.attributes.fillOpacity)
            .style('cursor', Rects.attributes.cursor);

        ivml.animateSelection(rects
            //hide rectangles with undefined positions
            .style('visibility', function (d, i) {
                if (xFunction(d, i) == null) {
                    return 'hidden';
                }

                if (yFunction(d, i) == null) {
                    return 'hidden';
                }

                return 'visible';
            }))
            .attr('x', xFunction)
            .attr('y', yFunction)
            .attr('width', wFunction)
            .attr('height', hFunction)
            .attr('stroke', Rects.attributes.stroke)
            .attr('stroke-width', Rects.attributes.strokeWidth)
            .attr('stroke-opacity', Rects.attributes.strokeOpacity)
            .attr('fill', Rects.attributes.fill)
            .attr('fill-opacity', Rects.attributes.fillOpacity)
            .style('cursor', Rects.attributes.cursor);

        rects.selectAll('title').remove();

        if (ivml.isF(Rects.attributes.title)) {
            rects.append('title').text(function (d, i) {
                return ivml.escapeNoNull(Rects.attributes.title(d, i))
            });
        }
        else {
            rects.append('title').text(ivml.escapeNoNull(Rects.attributes.title));
        }

        rects.exit().remove()

        if (Rects.events.mouseOutE) {
            rects.on('mouseout', function (d, i) {
                Rects.events.mouseOutE(d, i, d3.select(this));
            });
        }
        if (Rects.events.mouseOverE) {
            rects.on('mouseover', function (d, i) {
                Rects.events.mouseOverE(d, i, d3.select(this));
            });
        }
        if (Rects.events.clickE) {
            rects.on('click', function (d, i) {
                Rects.events.clickE(d, i, d3.select(this));
            })
        }

    }

    for (var i in Rects.accessors) {
        Rects[i] = ivml.generate_set_function_for_accessors(Rects, i)
    }

    for (var i in Rects.attributes) {
        Rects[i] = ivml.generate_set_function_for_attributes(Rects, i)
    }

    for (var i in Rects.events) {
        Rects[i] = ivml.generate_set_function_for_events(Rects, i);
    }

    return Rects;

}
