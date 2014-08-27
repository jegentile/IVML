//@defining:ivml.visualElement:errorBars
//@description Error bars are a visual element which can provide a visual representation of uncertainty around measures. In IVML, these are described by a center location and values describing the uncertainty in the positive and negative x and y directions.

var ivml = ivml || {};
ivml.visualElements = ivml.visualElements || {};

ivml.visualElements.ErrorBars = function ErrorBars(controller, $timeout) {

    var ErrorBars = {
        elements: {
            controller: controller,
            $timeout: $timeout,
            xscale: null,
            yscale: null,
            svg_g: null,
            frame: null
        },
        attributes: {
            stroke: 'blue', //@s line color
            strokeWidth: 3, //@s line opacity
            strokeOpacity: 1.0  //@s line width

        },
        accessors: {
            data: [], //@ir the javascript object for this plot
            upFunction: null,  //@i accessor for data's uncertainty in the positive y direction
            downFunction: null, //@i accessor fir data's uncertainty in the negative y direction
            leftFunction: null, //@i accessor fir data's uncertainty in the positive x direction
            rightFunction: null,  //@i accessor fir data's uncertainty in the negative x direction
            xcenterFunction: null, //@ir accessor for data's function for the center x point
            ycenterFunction: null  //@ir accessor function for the center y point
        },
        events: {
            mouseOverE: null,  //@e mouse over event
            mouseOutE: null,  //@e mouse out event
            clickE: null  //@e mouse click event
        }
    }

    ErrorBars.setGraphics = function () {
        if (ErrorBars.elements.controller && !ErrorBars.elements.svg_g) {
            ErrorBars.elements.svg_g = ErrorBars.elements.controller.getMaskedLayer().append('g');
        }
    }

    ErrorBars.redraw = function () {
        if (!ErrorBars.elements.controller) return;
        var xs = ErrorBars.elements.controller.getXScale();
        var ys = ErrorBars.elements.controller.getYScale();
        if (!xs) return;
        if (!ys) return;

        ErrorBars.setGraphics();
        if (!ErrorBars.elements.svg_g) return;
        if (!ErrorBars.accessors.data) return;
        if (!ErrorBars.accessors.xcenterFunction) return;
        if (!ErrorBars.accessors.ycenterFunction) return;
        var x_cen = ErrorBars.accessors.xcenterFunction;
        var y_cen = ErrorBars.accessors.ycenterFunction;

        var right_push = 0;
        var up_push = 0;

        if (xs.rangeBand) {
            right_push += xs.rangeBand() / 2;
        }

        if (ys.rangeBand) {
            up_push += ys.rangeBand() / 2;
        }



        var up = ErrorBars.accessors.upFunction;
        var down = ErrorBars.accessors.downFunction;
        var left = ErrorBars.accessors.leftFunction;
        var right = ErrorBars.accessors.rightFunction;

        if (up) {
            var up_lines = ErrorBars.elements.svg_g.selectAll('#upbars').data(ErrorBars.accessors.data);
            up_lines.enter().append('line')
                .attr('x1', function (d, i) {
                    return xs(x_cen(d, i)) + right_push;
                })
                .attr('y1', function (d, i) {
                    return ys(y_cen(d, i)) + up_push;
                })
                .attr('x2', function (d, i) {
                    return xs(x_cen(d, i)) + right_push;
                })
                .attr('y2', function (d, i) {
                    return ys(y_cen(d, i) + up(d, i)) + up_push;
                })
                .attr('id', 'upbars')
                .attr('stroke', ErrorBars.attributes.stroke)
                .attr('stroke-width', ErrorBars.attributes.strokeWidth)
                .attr('stroke-opacity', ErrorBars.attributes.strokeOpacity);

            up_lines.transition()
                .attr('x1', function (d, i) {
                    return xs(x_cen(d, i)) + right_push;
                })
                .attr('y1', function (d, i) {
                    return ys(y_cen(d, i)) + up_push;
                })
                .attr('x2', function (d, i) {
                    return xs(x_cen(d, i)) + right_push;
                })
                .attr('y2', function (d, i) {
                    return ys(y_cen(d, i) + up(d, i)) + up_push;
                })
                .attr('id', 'upbars')
                .attr('stroke', ErrorBars.attributes.stroke)
                .attr('stroke-width', ErrorBars.attributes.strokeWidth)
                .attr('stroke-opacity', ErrorBars.attributes.strokeOpacity);


            up_lines.exit().remove()

            if (ErrorBars.events.mouseOutE) {
                up_lines.on('mouseout', function (d, i) {
                    ErrorBars.events.mouseOutE(d, i, d3.select(this));
                });
            }
            if (ErrorBars.events.mouseOverE) {
                up_lines.on('mouseover', function (d, i) {
                    ErrorBars.events.mouseOverE(d, i, d3.select(this));
                });
            }
            if (ErrorBars.events.clickE) {
                up_lines.on('click', function (d, i) {
                    ErrorBars.events.clickE(d, i, d3.select(this));
                })
            }
            
        }

        if (down) {
            var down_lines = ErrorBars.elements.svg_g.selectAll('#downbars').data(ErrorBars.accessors.data);


            down_lines.enter().append('line')
                .attr('x1', function (d, i) {
                    return xs(x_cen(d, i)) + right_push;
                })
                .attr('y1', function (d, i) {
                    return ys(y_cen(d, i)) + up_push;
                })
                .attr('x2', function (d, i) {
                    return xs(x_cen(d, i)) + right_push;
                })
                .attr('y2', function (d, i) {
                    return ys(y_cen(d, i) - down(d, i)) + up_push;
                })
                .attr('id', 'downbars')
                .attr('stroke', ErrorBars.attributes.stroke)
                .attr('stroke-width', ErrorBars.attributes.strokeWidth)
                .attr('stroke-opacity', ErrorBars.attributes.strokeOpacity);


            down_lines.transition()
                .attr('x1', function (d, i) {
                    return xs(x_cen(d, i)) + right_push;
                })
                .attr('y1', function (d, i) {
                    return ys(y_cen(d, i)) + up_push;
                })
                .attr('x2', function (d, i) {
                    return xs(x_cen(d, i)) + right_push;
                })
                .attr('y2', function (d, i) {
                    return ys(y_cen(d, i) - down(d, i)) + up_push;
                })
                .attr('id', 'downbars')
                .attr('stroke', ErrorBars.attributes.stroke)
                .attr('stroke-width', ErrorBars.attributes.strokeWidth)
                .attr('stroke-opacity', ErrorBars.attributes.strokeOpacity);


            down_lines.exit().remove()

            if (ErrorBars.events.mouseOutE) {
                down_lines.on('mouseout', function (d, i) {
                    ErrorBars.events.mouseOutE(d, i, d3.select(this));
                });
            }
            if (ErrorBars.events.mouseOverE) {
                down_lines.on('mouseover', function (d, i) {
                    ErrorBars.events.mouseOverE(d, i, d3.select(this));
                });
            }
            if (ErrorBars.events.clickE) {
                down_lines.on('click', function (d, i) {
                    ErrorBars.events.clickE(d, i, d3.select(this));
                })
            }
        }

        if (left) {
            var left_lines = ErrorBars.elements.svg_g.selectAll('#leftbars').data(ErrorBars.accessors.data);


            left_lines.enter().append('line')
                .attr('x1', function (d, i) {
                    return xs(x_cen(d, i))+right_push;
                })
                .attr('y1', function (d, i) {
                    return ys(y_cen(d, i))+up_push;
                })
                .attr('x2', function (d, i) {
                    return xs(x_cen(d, i) - left(d, i))+right_push;
                })
                .attr('y2', function (d, i) {
                    return ys(y_cen(d, i))+up_push;
                })
                .attr('id', 'leftbars')
                .attr('stroke', ErrorBars.attributes.stroke)
                .attr('stroke-width', ErrorBars.attributes.strokeWidth)
                .attr('stroke-opacity', ErrorBars.attributes.strokeOpacity);


            left_lines.transition()
                .attr('x1', function (d, i) {
                    return xs(x_cen(d, i))+up_push;
                })
                .attr('y1', function (d, i) {
                    return ys(y_cen(d, i))+right_push;
                })
                .attr('x2', function (d, i) {
                    return xs(x_cen(d, i) - left(d, i))+up_push;
                })
                .attr('y2', function (d, i) {
                    return ys(y_cen(d, i))+right_push;
                })
                .attr('id', 'leftbars')
                .attr('stroke', ErrorBars.attributes.stroke)
                .attr('stroke-width', ErrorBars.attributes.strokeWidth)
                .attr('stroke-opacity', ErrorBars.attributes.strokeOpacity);


            left_lines.exit().remove()

            if (ErrorBars.events.mouseOutE) {
                left_lines.on('mouseout', function (d, i) {
                    ErrorBars.events.mouseOutE(d, i, d3.select(this));
                });
            }
            if (ErrorBars.events.mouseOverE) {
                left_lines.on('mouseover', function (d, i) {
                    ErrorBars.events.mouseOverE(d, i, d3.select(this));
                });
            }
            if (ErrorBars.events.clickE) {
                left_lines.on('click', function (d, i) {
                    ErrorBars.events.clickE(d, i, d3.select(this));
                })
            }
        }

        if (right) {

            var right_lines = ErrorBars.elements.svg_g.selectAll('#rightbars').data(ErrorBars.accessors.data);
            right_lines.enter().append('line')
                .attr('x1', function (d, i) {
                    return xs(x_cen(d, i))+right_push;
                })
                .attr('y1', function (d, i) {
                    return ys(y_cen(d, i))+up_push;
                })
                .attr('x2', function (d, i) {
                    return xs(x_cen(d, i) + right(d, i))+right_push;
                })
                .attr('y2', function (d, i) {
                    return ys(y_cen(d, i))+up_push;
                })
                .attr('id', 'rightbars')
                .attr('stroke', ErrorBars.attributes.stroke)
                .attr('stroke-width', ErrorBars.attributes.strokeWidth)
                .attr('stroke-opacity', ErrorBars.attributes.strokeOpacity);


            right_lines.transition()
                .attr('x1', function (d, i) {
                    return xs(x_cen(d, i))+right_push;
                })
                .attr('y1', function (d, i) {
                    return ys(y_cen(d, i))+up_push;
                })
                .attr('x2', function (d, i) {
                    return xs(x_cen(d, i) + right(d, i))+right_push;
                })
                .attr('y2', function (d, i) {
                    return ys(y_cen(d, i))+up_push;
                })
                .attr('id', 'rightbars')
                .attr('stroke', ErrorBars.attributes.stroke)
                .attr('stroke-width', ErrorBars.attributes.strokeWidth)
                .attr('stroke-opacity', ErrorBars.attributes.strokeOpacity);


            right_lines.exit().remove();

            if (ErrorBars.events.mouseOutE) {
                right_lines.on('mouseout', function (d, i) {
                    ErrorBars.events.mouseOutE(d, i, d3.select(this));
                });
            }
            if (ErrorBars.events.mouseOverE) {
                right_lines.on('mouseover', function (d, i) {
                    ErrorBars.events.mouseOverE(d, i, d3.select(this));
                });
            }
            if (ErrorBars.events.clickE) {
                right_lines.on('click', function (d, i) {
                    ErrorBars.events.clickE(d, i, d3.select(this));
                })
            }
        }


    }

    for (var i in ErrorBars.accessors) {
        ErrorBars[i] = ivml.generate_set_function_for_accessors(ErrorBars, i);
    }

    for (var i in ErrorBars.attributes) {
        ErrorBars[i] = ivml.generate_set_function_for_attributes(ErrorBars, i);
    }

    for (var i in ErrorBars.events) {
        ErrorBars[i] = ivml.generate_set_function_for_events(ErrorBars, i);
    }

    return ErrorBars;
}
