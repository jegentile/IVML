var ivml = ivml || {};
ivml.visualElements = ivml.visualElements || {};

ivml.visualElements.Shapes = function Shapes(cntrol) {
    var controller = cntrol;

    var elements = {
        projection: null,
        svg_g: null,
        frame: null,
        shapesJson: null
    }

    var attributes = {
        fill: function () {
            return 'gold';
        },

        stroke: function () {
            return 'none';
        },
        stroke_width: function () {
            return 3;
        },
        stroke_opacity: function () {
            return 1.0;
        },
        fill_opacity: function () {
            return 1.0
        },
        classed: function () {
            return 'shape'
        }
    }

    var events = {
        mouseOver: null,
        mouseOut: null,
        click: null
    }

    var accessors = {
        path_data: null
    }

    var data = [];

    this.setFrame = function (f) {

        if (f.append) {
            elements.frame = f;
            elements.svg_g = elements.frame.append('g');
        }
    }

    this.setController = function (c) {
        controller = c;

    }

    var json_drawn = false;

    this.redraw = function () {


        if (!elements.shapesJson) return


        if (!controller) {
            return
        }

        if (!accessors.path_data) {
            return;
        }

        elements.projection = controller.getProjection()

        if (!elements.svg_g) return;

        if (!elements.projection) return;


        if (!json_drawn) {

            var path = d3.geo.path().projection(elements.projection)


            var p = elements.svg_g
                .selectAll("path")
                .data(accessors.path_data(elements.shapesJson))

            p.enter().append("path")
                .attr("d", path)
                .attr("fill", function (d, i) {
                    return attributes.fill(d, i)
                })
                .attr("stroke", function (d, i) {
                    return attributes.stroke(d, i)
                })
                .attr("fill-opacity", function (d, i) {
                    return attributes.fill_opacity(d, i)
                })
                .attr("stroke-opacity", function (d, i) {
                    return attributes.stroke_opacity(d, i)
                })
                .classed(attributes.classed(), true)

            p.attr("d", path)
                .attr("fill", function (d, i) {
                    return attributes.fill(d, i)
                })
                .attr("stroke", function (d, i) {
                    return attributes.stroke(d, i)
                })
                .attr("fill-opacity", function (d, i) {
                    return attributes.fill_opacity(d, i)
                })
                .attr("stroke-opacity", function (d, i) {
                    return attributes.stroke_opacity(d, i)
                })
                .classed(attributes.classed(), true);

            json_drawn = true;

            p.exit().remove()

            if (events.mouseOut) {
                p.on('mouseout', function (d, i) {
                    events.mouseOut(d, i)
                });
            }
            if (events.mouseOver) {
                p.on('mouseOver', function (d, i) {
                    events.mouseOut(d, i)
                });
            }
            if (events.click) {
                p.on('click', function (d, i) {
                    events.click(d, i)
                })
            }


        }
        else {
            var path = d3.geo.path().projection(elements.projection)

            var p = elements.svg_g
                .selectAll("path")

            p.attr("d", path).attr("fill", function (d, i) {
                return attributes.fill(d, i)
            })
                .attr("stroke", function (d, i) {
                    return attributes.stroke(d, i)
                })
                .attr("fill-opacity", function (d, i) {
                    return attributes.fill_opacity(d, i)
                })
                .attr("stroke-opacity", function (d, i) {
                    return attributes.stroke_opacity(d, i)
                })
                .classed(attributes.classed(), true);

            if (events.mouseOut) {
                p.on('mouseout', function (d, i) {
                    events.mouseOut(d, i, d3.select(this));
                });
            }
            if (events.mouseOver) {
                p.on('mouseover', function (d, i) {
                    events.mouseOver(d, i, d3.select(this));
                });
            }
            if (events.click) {
                p.on('click', function (d, i) {
                    events.click(d, i, d3.select(this));
                })
            }
        }
    }

    this.dat = function (_x) {
        if (!arguments.length) return data

        data = _x;


        this.redraw();
        return this;

    }

    this.generate_set_function_for_accessors = function (struct, key) {
        return function (_x) {
            if (!_x) {
                return
            } //return if _x is null


            if (typeof(_x) == "function") {
                struct[key] = _x;
            }
            else {
                struct[key] = function (d, i) {
                    return d[_x]
                }
            }
            this.redraw()
        }
    }

    this.generate_set_function_redraw = function (struct, key) {
        return function (_x) {
            if (!_x) {
                return
            } //return if _x is null

            if (typeof(_x) == "function") {
                struct[key] = _x;
            }
            else {
                struct[key] = function (d, i) {
                    return _x;
                }
            }
            this.redraw()
        }
    }

    this.shapesJson = function (val) {
        elements.shapesJson = val;
        this.redraw();
    }

    for (i in accessors) {
        this[i] = this.generate_set_function_for_accessors(accessors, i)
    }

    for (i in attributes) {
        this[i] = this.generate_set_function_redraw(attributes, i)
    }

    for (i in events) {
        this[i] = this.generate_set_function_redraw(events, i)
    }


}
