var ivml = ivml || {};

angular.module('ivml', ['ivml.chart']);

ivml.isF = function (_x) {
    return typeof(_x) == 'function';
}

ivml.animation = {
    duration: 250
};

ivml.textCalculation = {};

/*
 * Constraints for rendering, layout, etc.
 */
ivml.limits = {
    ticks: 100
};

/*
 * Constrain the number of tick marks on a graph.
 */
ivml.clampIntegerToTicks = function (i) {
    if (isNaN(parseInt(i))) {
        return 0;
    }
    var pi = parseInt(i);

    if (pi < 0) {
        pi = 0;
    }
    else if (pi > ivml.limits.ticks) {
        pi = ivml.limits.ticks;
    }

    return pi;
}

ivml.getTextWidthInPixels = function (text, fontFamily, fontSize) {
    if (!ivml.textCalculation.textCheckElement) {
        ivml.textCalculation.textCheckElement = d3.select(document.body)
            .append('svg')
            .attr('height', 0)
            .attr('width', 0)
            .style('visibility', 'hidden')
            .append('g')
            .append('text');
    }
    ivml.textCalculation.textCheckElement.style('font-family', fontFamily).style('font-size', fontSize).text(text);
    return ivml.textCalculation.textCheckElement.node().getComputedTextLength();
};

ivml.escapeNoNull = function (text) {
    if (text != null) {
        return escape(text);
    }
    return null;
}

ivml.animateSelection = function (selection) {
    if (ivml.animation.duration && ivml.animation.duration > 0) {
        return selection.transition().duration(ivml.animation.duration);
    }
    return selection;
};

ivml.buildDirectiveScopeFromElementObject = function (elementObject) {
    var rtrn = {};
    if (elementObject.accessors) {
        for (var key in elementObject.accessors) {
            rtrn[key] = '=';
        }
    }

    if (elementObject.attributes) {
        for (var key in elementObject.attributes) {
            rtrn[key] = '=';
        }
    }

    if (elementObject.events) {
        for (var key in elementObject.events) {
            rtrn[key] = '=';
        }
    }
    return rtrn;
};

ivml.addElementObjectAttributeWatchesToScope = function (elementObject, scope) {
    if (elementObject.accessors) {
        for (var key in elementObject.accessors) {
            scope.$watch(key, elementObject[key], true);

        }
    }

    if (elementObject.attributes) {
        for (var key in elementObject.attributes) {
            scope.$watch(key, elementObject[key]);
        }
    }

    if (elementObject.events) {
        for (var key in elementObject.events) {
            scope.$watch(key, elementObject[key]);
        }
    }
};

ivml.timeoutRedraw = function (elementObject, redrawFunction) {
    //using $timeout allows all accessor/attribute/event changes
    //to occur within the angular digest cycle before elements are repainted.
    //This way, even if many accessor/attribute/event changes are logged in a
    //single angular digest cycle, the elements are only redrawn once instead of many times.
    if (elementObject.elements.$timeout) {
        if (!elementObject.elements.redrawOrdered) {
            elementObject.elements.redrawOrdered = true;
            elementObject.elements.$timeout(function () {
                if (redrawFunction) {
                    redrawFunction();
                }
                else {
                    elementObject.redraw();
                }
                elementObject.elements.redrawOrdered = false;
            });
        }
    }
    else {
        if (redrawFunction) {
            redrawFunction();
        }
        else {
            elementObject.redraw();
        }
    }
};

ivml.generate_set_function_for_accessors = function (elementObject, accessorKey, redrawFunction) {
    return function (_x) {

        if (_x == null) return; //return if _x is null or undefined


        //can pass in a string (prefixed with .) which is used as a key on the data object
        //for d3 callback functions.

        if (typeof(_x) == "string" && _x.length > 1 && _x.charAt(0) === '/') {
            var key = _x.substring(1);
            elementObject.accessors[accessorKey] = function (d) {
                return d[key]
            }
        }
        else {
            elementObject.accessors[accessorKey] = _x;
        }

        ivml.timeoutRedraw(elementObject, redrawFunction);
    }
};

ivml.generate_set_function_for_attributes = function (elementObject, attributeKey, redrawFunction) {
    return function (_x) {
        if (_x == null) return; //return if _x is null or undefined

        //can pass in a string (prefixed with .) which is used as a key on the data object
        //for d3 callback functions.
        if (typeof(_x) == "string" && _x.length > 1 && _x.charAt(0) === '/') {
            var key = _x.substring(1);
            elementObject.attributes[attributeKey] = function (d) {
                return d[key]
            }
        }
        else {
            elementObject.attributes[attributeKey] = _x;
        }

        ivml.timeoutRedraw(elementObject, redrawFunction);
    }
};

ivml.generate_set_function_for_events = function (elementObject, attributeKey, redrawFunction) {
    return function (_x) {
        if (typeof(_x) != "function") return; //only accepts functions

        elementObject.events[attributeKey] = _x;

        ivml.timeoutRedraw(elementObject, redrawFunction);
    }
};

angular.module('ivml.chart', [])
    .directive('lineGroup', function ($timeout) {
        return {
            restrict: 'E',
            require: ['^plot', '^lineGroup'],
            controller: function () {
                this.paths = [];
                this.addPath = function (path) {
                    this.paths.push(path);
                };
                this.lineGroupObject = undefined;
                this.redraw = function () {
                    if (this.lineGroupObject) {
                        this.lineGroupObject.redraw();
                    }
                };
                this.getFillGraphic = function () {
                    if (this.lineGroupObject) {
                        return this.lineGroupObject.getFillGraphic();
                    }
                    return null;
                };
                this.getLineGraphic = function () {
                    if (this.lineGroupObject) {
                        return this.lineGroupObject.getLineGraphic();
                    }
                    return null;
                }
            },
            scope: {
            },
            link: function (scope, element, attr, controller) {
                var lineGroup = new ivml.visualElements.LineGroup(controller[0], controller[1], $timeout);
                controller[0].addElement(lineGroup);
                controller[1].lineGroupObject = lineGroup;
            }
        }
    })
    .directive('paths', function ($timeout) {
        return {
            restrict: 'E',
            require: ['^plot', '?^lineGroup'],
            scope: ivml.buildDirectiveScopeFromElementObject(ivml.visualElements.Paths(null, null)),
            link: function (scope, element, attr, controller) {
                var paths = ivml.visualElements.Paths(controller[0], controller[1], $timeout);
                if (controller[1]) {
                    controller[1].addPath(paths);
                }
                else {
                    //Only add path to controller when it is not part of a line group
                    controller[0].addElement(paths);
                }

                ivml.addElementObjectAttributeWatchesToScope(paths, scope);
            }
        }
    })
    .directive('plot', function ($timeout) {
        return {
            restrict: 'E',
            require: '^plot',
            controller: function () {
                this.plotObject = null;
                this.elements = [];
                this.addElement = function (e) {
                    this.elements.push(e);
                    return this.elements.length - 1
                };
                this.getXScale = function () {
                    if (this.plotObject) {
                        return this.plotObject.elements.xScale;
                    }
                    return null;
                };
                this.getYScale = function () {
                    if (this.plotObject) {
                        return this.plotObject.elements.yScale;
                    }
                    return null;
                };
                this.getUnmaskedLayer = function () {
                    if (this.plotObject) {
                        return this.plotObject.elements.layers.overMargin;
                    }
                    return null;
                };
                this.getMaskedLayer = function () {
                    if (this.plotObject) {
                        return this.plotObject.elements.layers.underMargin;
                    }
                    return null;
                };
                this.redraw = function () {
                    this.elements.forEach(function (e) {
                        e.redraw();
                    })
                }
            },
            scope: ivml.buildDirectiveScopeFromElementObject(ivml.visualElements.Plot()),
            link: function (scope, element, attr, controller) {
                controller.plotObject = ivml.visualElements.Plot(element[0], controller, $timeout);
                ivml.addElementObjectAttributeWatchesToScope(controller.plotObject, scope);
                ivml.timeoutRedraw(controller.plotObject);
            }
        }
    })
    .directive('points', function ($timeout) {
        return {
            restrict: 'E',
            require: '^plot',
            scope: ivml.buildDirectiveScopeFromElementObject(new ivml.visualElements.Points(null)),
            link: function (scope, element, attr, controller) {
                var points = new ivml.visualElements.Points(controller, $timeout);
                controller.addElement(points);
                ivml.addElementObjectAttributeWatchesToScope(points, scope);
            }
        }
    })
    .directive('cylinders', function ($timeout) {
        return {
            restrict: 'E',
            require: '^plot',
            scope: ivml.buildDirectiveScopeFromElementObject(new ivml.visualElements.Cylinders(null)),
            link: function (scope, element, attr, controller) {
                var cylinders = new ivml.visualElements.Cylinders(controller, $timeout);
                controller.addElement(cylinders);
                ivml.addElementObjectAttributeWatchesToScope(cylinders, scope);
            }
        }
    })
    .directive('lineSegments', function ($timeout) {
        return {
            restrict: 'E',
            require: '^plot',
            scope: ivml.buildDirectiveScopeFromElementObject(new ivml.visualElements.LineSegments(null)),
            link: function (scope, element, attr, controller) {
                var lines = new ivml.visualElements.LineSegments(controller, $timeout);
                controller.addElement(lines);
                ivml.addElementObjectAttributeWatchesToScope(lines, scope);
            }
        }
    })
    .directive('errorBars', function ($timeout) {
        return {
            restrict: 'E',
            require: '^plot',
            scope: ivml.buildDirectiveScopeFromElementObject(new ivml.visualElements.ErrorBars(null)),
            link: function (scope, element, attr, controller) {
                var errorBars = new ivml.visualElements.ErrorBars(controller, $timeout);
                controller.addElement(errorBars);
                ivml.addElementObjectAttributeWatchesToScope(errorBars, scope);
            }
        }
    })
    .directive('rectangles', function ($timeout) {
        return {
            restrict: 'E',
            require: '^plot',
            scope: ivml.buildDirectiveScopeFromElementObject(new ivml.visualElements.Rectangles(null)),
            link: function (scope, element, attr, controller) {
                var rects = new ivml.visualElements.Rectangles(controller, $timeout);
                controller.addElement(rects);
                ivml.addElementObjectAttributeWatchesToScope(rects, scope);
            }
        }
    })
    .directive('texts', function ($timeout) {
        return {
            restrict: 'E',
            require: '^plot',
            scope: ivml.buildDirectiveScopeFromElementObject(new ivml.visualElements.Texts(null)),
            link: function (scope, element, attr, controller) {
                var texts = new ivml.visualElements.Texts(controller, $timeout);
                controller.addElement(texts);
                ivml.addElementObjectAttributeWatchesToScope(texts, scope);
            }
        }
    })
    .directive('donutCharts', function ($timeout) {
        return {
            restrict: 'E',
            require: '^plot',
            scope: ivml.buildDirectiveScopeFromElementObject(new ivml.visualElements.DonutCharts(null)),
            link: function (scope, element, attr, controller) {
                var donutCharts = new ivml.visualElements.DonutCharts(controller, $timeout);
                controller.addElement(donutCharts);
                ivml.addElementObjectAttributeWatchesToScope(donutCharts, scope);
            }
        }
    })
    .directive('bars', function ($timeout) {
        return {
            restrict: 'E',
            require: ['^plot', '^barGroup'],
            scope: ivml.buildDirectiveScopeFromElementObject(new ivml.visualElements.Bars(null)),
            link: function (scope, element, attr, controllers) {
                var chartController = controllers[0];
                var barController = controllers[1];
                barController.setChartController(chartController);
                var e = new ivml.visualElements.Bars(chartController, barController, $timeout);
                var index = barController.addElement(e);
                e.setIndex(index);
                ivml.addElementObjectAttributeWatchesToScope(e, scope);


            }
        }
    })
    .directive('barGroup', function () {
        return {
            restrict: 'E',
            replace: true,

            controller: function () {

                this.elements = [];
                this.groupObject = null;
                this.addElement = function (b) {
                    this.elements.push(b);
                    return this.elements.length - 1
                };
                this.chartController = null;
                this.setChartController = function (c) {
                    if (!this.chartController) {
                        this.chartController = c;
                        this.chartController.addElement(this)
                    }

                };

                this.redraw = function (d) {

                    if (!this.elements.length) {
                        return;
                    }
                    this.offsets = {};

                    if (this.getType() == 'grouped') {
                        var e = this.calculateWidths();
                        if (e == -1) {
                            return;
                        }

                    }

                    for (var e in this.elements) {
                        this.elements[e].redraw()
                    }
                };

                this.setGroupObject = function (o) {
                    this.groupObject = o;
                };
                this.getType = function () {
                    if (this.groupObject) {
                        return this.groupObject.type()
                    }
                };
                this.getArrangement = function () {
                    if (this.groupObject) {
                        return this.groupObject.arrangement()
                    }
                };

                this.getPadding = function () {
                    if (this.groupObject) {
                        return this.groupObject.padding();
                    }
                };

                this.offset = function (key, val, sign) {

                    if (!this.offsets[key]) {
                        this.offsets[key] = {};
                        this.offsets[key].up = 0;
                        this.offsets[key].down = 0
                    }
                    if (sign >= 0) {
                        this.offsets[key].up += val;
                    }
                    else {
                        this.offsets[key].down += val;
                    }


                };


                this.getOffset = function (key, sign) {

                    if (!this.offsets[key]) {
                        return 0;
                    }

                    if (sign >= 0) {
                        return this.offsets[key].up;
                    }
                    else {
                        return this.offsets[key].down;
                    }
                };

                this.calculateWidths = function () {

                    if (!this.elements.length) {
                        return;
                    }

                    if (this.getArrangement() == "vertical") {

                        this.positionScale = this.chartController.getXScale();
                    }
                    else {
                        this.positionScale = this.chartController.getYScale();
                    }

                    this.widths = {};
                    this.onwidth = {};


                    for (var e in this.elements) {
                        var e = this.elements[e].calculateWidths()
                        if (e == -1) {
                            return -1;
                        }
                    }


                };

                this.setWidth = function (key, value) {
                    if (isNaN(parseInt(value))) {
                        return;
                    }

                    if (!this.widths[key]) {
                        this.widths[key] = parseInt(value);
                        this.onwidth[key] = 0;
                    }
                    else {
                        this.widths[key] += parseInt(value) + parseInt(this.getPadding());

                    }
                };

                this.getGroupPositionOffset = function (key, index, width) {
                    var a = this.onwidth[key];
                    var parsedWidth = isNaN(parseInt(width)) ? 0 : width;

                    this.onwidth[key] += this.getPadding() + parsedWidth;


                    return Math.round(a + this.positionScale.rangeBand() / 2 - this.widths[key] / 2);


                }
            },


            scope: {
                type: '=',
                padding: '=',
                arrangement: '='
            },

            link: function (scope, element, attrs, controller) {

                var e = new ivml.visualElements.BarGroup(controller);
                controller.setGroupObject(e);

                var makeWatch = function (i) {
                    scope.$watch(i, function (newValue) {
                        e[i](newValue);
                    });
                };

                for (var i in scope) {
                    if ((i.indexOf('$') == -1) && (i != 'this') && (i != 'constructor')) {
                        if (e[i]) {
                            makeWatch(i)
                        }
                    }
                }

            }
        }

    });

//@defining:ivml.group:bar-group
//@description Group of {\tt <bars>} elements, intended for bar charts. This directive requires the data to be index by a nominal value on the axis.

var ivml = ivml || {};
ivml.visualElements = ivml.visualElements || {};

ivml.visualElements.BarGroup = function BarGroup(cntrol){
    var bargroupController = cntrol;
    var elements ={
        type: 'stacked', //@i specifies a {\tt grouped} or {\tt stacked} chart.
        arrangement: 'vertical', //@i specifies a {\tt vertical} or {\tt horizontal} chart.
        padding: 3  //@i pixel spacing between bars
    }

    this.generate_set_function = function( struct,key){
        return function(_x){
            if(!arguments.length) return struct[key];
            if(!_x){return} //return if _x is null
            struct[key] = _x;
            bargroupController.redraw();
        }
    }

    for(var i in elements){
        this[i] = this.generate_set_function(elements,i)
    }
}


//@defining:ivml.visualElement:bars
//@description Vertical or horizontal bar that is part of a group. The bar's magnitude is it's length along the independent dimension (vertical for horizontal bar charts).

var ivml = ivml || {};
ivml.visualElements = ivml.visualElements || {};

ivml.visualElements.Bars = function Bars(chartController, barController, $timeout) {

    var Bars = {
        elements: {
            chartController: chartController,
            barController: barController,
            $timeout: $timeout,
            xscale: null,
            yscale: null,
            svg_g: null,
            frame: null,
            index: -1
        },
        attributes: {
            fill: "black", //@i fill color of the bar
            fillOpacity: 1.0, //@i fill opacity of bar
            stroke: null, //@i color of the bar's outline
            strokeWidth: 1.0, //@i stroke width of the bar's line
            strokeOpacity: 1.0,  //@i opacity of the bar's outline
            thickness: 5 //@i the bar's thickness (size parallel to the dependent dimension)
        },
        accessors: {
            data: [], //@ir javascript object to plot
            positionFunction: null,//@ir accessor for the bar's  position on the nominal axis
            valueFunction: null //@ir accessor for the the bar's value (size and direction)

        },
        events: {
            mouseOverE: null, //@e mouse over event
            mouseOutE: null, //@e mouse out event
            clickE: null    //@e mouse click event
        }

    }
    Bars.index = -1;

    Bars.setIndex = function (i) {

        Bars.index = i;
    }

    Bars.setGraphics = function () {


        if (Bars.elements.chartController && !Bars.elements.svg_g) {
            Bars.elements.svg_g = Bars.elements.chartController.getMaskedLayer().append('g');
        }
    }

    Bars.redraw = function () {


        if (!Bars.elements.chartController) return;
        if(!Bars.elements.barController) return;
        var xs = Bars.elements.chartController.getXScale();
        var ys = Bars.elements.chartController.getYScale();
        if (!xs) return;
        if (!ys) return;



        Bars.setGraphics();
        if (!Bars.elements.svg_g) return;

        if (!Bars.accessors.data) return;

        if (!Bars.accessors.valueFunction) return;

        if (!Bars.accessors.positionFunction) return;

        var values_function = Bars.accessors.valueFunction;
        var position_function = Bars.accessors.positionFunction;

        var rects =  Bars.elements.svg_g.selectAll('rect').data(Bars.accessors.data);




        if ((Bars.elements.barController.getType() == 'grouped') && (Bars.elements.barController.getArrangement() == 'vertical')) {



            rects.enter().append('rect');
            rects.transition()
                .attr('x', function (d, i) {

                    var t = Bars.attributes.thickness;

                    if(Bars.attributes.thickness === 'function'){
                        t = Bars.attributes.thickness(d,i)
                    }

                    var offset = Bars.elements.barController.getGroupPositionOffset(position_function(d, i), Bars.index, t);

                    return xs(position_function(d, i)) + offset;


                })
                .attr('y', function (d, i) {
                    if (values_function(d, i) >= 0) {
                        return ys(values_function(d, i));
                    }
                    else {
                        return(ys(0))
                    }
                })
                .attr('height', function (d, i) {
                    return Math.abs(ys(0) - ys(values_function(d, i)) - 1)
                })
                .attr('fill-opacity', Bars.attributes.fillOpacity)
                .attr('stroke-width', Bars.attributes.strokeWidth)
                .attr('stroke-opacity', Bars.attributes.strokeOpacity)
                .attr('stroke', Bars.attributes.stroke)


                .attr('width', Bars.attributes.thickness)
                .attr('fill', Bars.attributes.fill)
            rects.exit().remove()

        }

        if ((Bars.elements.barController.getType() == 'stacked') && (Bars.elements.barController.getArrangement() == 'vertical')) {


            var t = Bars.attributes.thickness;

            rects.enter().append('rect');

            rects.transition().attr('x', function (d, i) {

                var t = Bars.attributes.thickness;
                if(Bars.attributes.thickness === 'function'){
                    t = Bars.attributes.thickness(d,i)
                }
                var xpush = xs.rangeBand() / 2 - t / 2;


                return xs(position_function(d, i)) + xpush
            })
                .attr('y', function (d, i) {
                    if (values_function(d, i) >= 0) {
                        var y = Bars.elements.barController.getOffset(position_function(d, i), values_function(d, i));
                        return ys(values_function(d, i)) - y;
                    }
                    else {
                        var y = Bars.elements.barController.getOffset(position_function(d, i), values_function(d, i));
                        return ys(0) + y;
                    }
                })
                .attr('height', function (d, i) {
                    if (values_function(d, i) >= 0) {
                        Bars.elements.barController.offset(position_function(d, i), ys(0) - ys(values_function(d, i)), values_function(d, i));
                        return ys(0) - ys(values_function(d, i));
                    }
                    else {
                        Bars.elements.barController.offset(position_function(d, i), ys(values_function(d, i)) - ys(0), values_function(d, i))
                        return ys(values_function(d, i)) - ys(0)
                    }


                })
                .attr('fill-opacity', Bars.attributes.fillOpacity)
                .attr('stroke-width', Bars.attributes.strokeWidth)
                .attr('stroke-opacity', Bars.attributes.strokeOpacity)
                .attr('stroke', Bars.attributes.stroke)



                .attr('width', Bars.attributes.thickness)
                .attr('fill', Bars.attributes.fill)

            rects.exit().remove()
        }

        if ((Bars.elements.barController.getType() == 'grouped') && (Bars.elements.barController.getArrangement() == 'horizontal')) {




            rects.enter().append('rect');
            rects.transition()
                .attr('y', function (d, i) {

                    var t = Bars.attributes.thickness;

                    if(Bars.attributes.thickness === 'function'){
                        t = Bars.attributes.thickness(d,i)
                    }

                    var offset = Bars.elements.barController.getGroupPositionOffset(position_function(d, i), Bars.index, t)
                    return ys(position_function(d, i)) + offset;


                })
                .attr('x', function (d, i) {
                    if (values_function(d, i) <= 0) {
                        return xs(values_function(d, i));
                    }
                    else {
                        return(xs(0))
                    }
                })
                .attr('width', function (d, i) {
                    return Math.abs(xs(0) - xs(values_function(d, i)) - 1)
                })
                .attr('fill-opacity', Bars.attributes.fillOpacity)
                .attr('stroke-width', Bars.attributes.strokeWidth)
                .attr('stroke-opacity', Bars.attributes.strokeOpacity)
                .attr('stroke', Bars.attributes.stroke)


                .attr('height', Bars.attributes.thickness)
                .attr('fill', Bars.attributes.fill)
            rects.exit().remove()

        }

        if ((Bars.elements.barController.getType() == 'stacked') && (Bars.elements.barController.getArrangement() == 'horizontal')) {



            var t = Bars.attributes.thickness;


            rects.enter().append('rect');

            rects.transition().attr('y', function (d, i) {

                var t = Bars.attributes.thickness;
                if(Bars.attributes.thickness === 'function'){
                    t = Bars.attributes.thickness(d,i)
                }
                var ypush = ys.rangeBand() / 2 - t / 2;


                return ys(position_function(d, i)) + ypush
            })
                .attr('x', function (d, i) {


                    if (values_function(d, i) >= 0) {
                        var x = Bars.elements.barController.getOffset(position_function(d, i), (d, i));
                        return xs(0) + x;
                    }
                    else {
                        var x = Bars.elements.barController.getOffset(position_function(d, i), values_function(d, i));
                        return xs(0)-(xs(-1*(values_function(d,i)))-xs(0))-x;
                    }
                })
                .attr('width', function (d, i) {
                    if (values_function(d, i) <= 0) {
                        Bars.elements.barController.offset(position_function(d, i), xs(0) - xs(values_function(d, i)), values_function(d, i));
                        return xs(0) - xs(values_function(d, i));
                    }
                    else {
                        Bars.elements.barController.offset(position_function(d, i), xs(values_function(d, i)) - xs(0), values_function(d, i))
                        return Math.abs(xs(0)-xs(values_function(d, i)))
                    }


                })
                .attr('fill-opacity', Bars.attributes.fillOpacity)
                .attr('stroke-width', Bars.attributes.strokeWidth)
                .attr('stroke-opacity', Bars.attributes.strokeOpacity)
                .attr('stroke', Bars.attributes.stroke)
                .attr('height', Bars.attributes.thickness)
                .attr('fill', Bars.attributes.fill);

            rects.exit().remove()
        }


        if (Bars.events.mouseOutE) {
            rects.on('mouseout', function (d, i) {
                Bars.events.mouseOutE(d, i, d3.select(this));
            });
        }
        if (Bars.events.mouseOverE) {
            rects.on('mouseover', function (d, i) {
                Bars.events.mouseOverE(d, i, d3.select(this));
            });
        }
        if (Bars.events.clickE) {
            rects.on('click', function (d, i) {
                Bars.events.clickE(d, i, d3.select(this));
            })
        }



    };

    Bars.calculateWidths = function () {


        if(!Bars.accessors.positionFunction){
            return -1;
        }

        if (!Bars.elements.chartController) {
            return -1;
        }




        if (!Bars.elements) return -1;



        if (!Bars.elements.svg_g) Bars.setGraphics();





        var data = Bars.accessors.data;


        if (!data) return -1;



        var xs = Bars.elements.chartController.getXScale();
        var ys = Bars.elements.chartController.getYScale();

        var position_scale;


        if (Bars.elements.barController.getArrangement() == 'vertical') {
            position_scale = xs;
        }
        else {
            position_scale = ys;
        }

        for (var i in data) {
            if(Bars.attributes.thickness === 'function'){
                Bars.elements.barController.setWidth(Bars.accessors.positionFunction(data[i],i), Bars.attributes.thickness(data[i], i))
            }
            else{
                Bars.elements.barController.setWidth(Bars.accessors.positionFunction(data[i]), Bars.attributes.thickness)
            }
        }

    };

    for (var i in Bars.accessors) {
        Bars[i] = ivml.generate_set_function_for_accessors(Bars, i,function(){Bars.elements.barController.redraw()});
    }

    for (var i in Bars.attributes) {
        Bars[i] = ivml.generate_set_function_for_attributes(Bars, i,function(){Bars.elements.barController.redraw()});
    }

    for (var i in Bars.events) {
        Bars[i] = ivml.generate_set_function_for_events(Bars, i,function(){Bars.elements.barController.redraw()});
    }

    return Bars;
}

var ivml = ivml || {};
ivml.visualElements = ivml.visualElements || {};

ivml.visualElements.Chart = function Chart(element, controller) {
    var layout = {
        width: 400,
        height: 400,
        margin: {
            left: 40,
            right: 40,
            top: 40,
            bottom: 40
        },
        lenged_font_size: 15
    }

    var animation = {
        duration: 30
    }

    var elements = {
        xscale: {},
        yscale: {},
        xlabel: {},
        ylabel: {},
        xaxis: null,
        yaxis: {},
        xticks: 8,
        yticks: 5,
        svg: null,
        frame: {},
        panel: {},
        panelWidth: null,
        panelHeight: null,
        xminimum: -1,
        xmaximum: 1,
        yminimum: -1,
        ymaximum: 1,
        controller: controller,
        xodomain: null,
        yodomain: null,
        xaxisAttribute: 'ivml_placeholder',
        duration: 1
    }


    this.updateYLabel = function () {

        var l = elements.svg.select('text.ylabel');
        l.transition().duration(animation.duration).text(elements.ylabel);
    }

    this.updateXLabel = function () {
        elements.svg.select('text.xlabel').transition()
            .attr('text-anchor', 'end')
            .attr('y', layout.height - layout.lenged_font_size)
            .attr('x', layout.width)
            .attr('dy', '0.75em')
            .text(elements.xlabel);
    }


    this.updateXAxis = function () {

        var framewidth = layout.width - layout.margin.left - layout.margin.right;
        var frameheight = layout.height - layout.margin.top - layout.margin.bottom;

        if (elements.xodomain) {
            elements.xscale = d3.scale.ordinal().domain(elements.xodomain).rangeBands([0, framewidth], 0.05)
        }
        else {
            elements.xscale = d3.scale.linear().domain([elements.xminimum, elements.xmaximum]).range([0, framewidth]);
        }
        elements.xaxis = d3.svg.axis()
            .scale(elements.xscale)
            .orient('bottom')
            .ticks(elements.xticks);

        if (!elements.frame.selectAll) {
            return;
        }

        var aX = elements.frame.selectAll('#xaxis')

        if (aX.empty()) {

            elements.frame.append('g')
                .attr('transform', 'translate(0,0)')
                .attr('class', 'axis')
                .attr('id', 'xaxis')
                .call(elements.xaxis).selectAll('text')
                .style('font-size', '8pt')

        }
        else {

            aX.transition().duration(elements.duration).call(elements.xaxis).attr('transform', 'translate(0,' + frameheight + ')')
                .selectAll('text')
                .attr('transform', 'translate(0,0)')

                .style('font-size', '8pt')

        }

        this.updateXLabel()

    }

    this.updateYAxis = function () {


        var frameheight = layout.height - layout.margin.top - layout.margin.bottom;


        if (elements.yodomain) {
            elements.yscale = d3.scale.ordinal().domain(elements.yodomain).rangeBands([0, frameheight], 0.05)
        }
        else {
            elements.yscale = d3.scale.linear().domain([elements.yminimum, elements.ymaximum]).range([frameheight, 0]);
        }

        elements.yaxis = d3.svg.axis()
            .scale(elements.yscale)
            .orient('left')
            .ticks(elements.yticks);

        if (!elements.frame.selectAll) {
            return;
        }

        var aY = elements.frame.selectAll('#yaxis')

        if (aY.empty()) {

            elements.frame.append('g')
                .attr('class', 'axis')
                .attr('id', 'yaxis')
                .call(elements.yaxis).selectAll('text')
                .style('font-size', '8pt')

        }
        else {

            aY.transition().duration(elements.duration).call(elements.yaxis).selectAll('text')
                .style('font-size', '8pt')

        }
        this.updateYLabel()

    }

    this.redraw = function () {
        if (elements.svg == null) {
            elements.svg = d3.select(element[0]).append('svg');

            elements.svg.transition().duration(animation.duration).attr({width: layout.width, height: layout.height});

            elements.svg.append('text')
                .classed('ylabel', true)
                .attr('text-anchor', 'end')
                .attr('y', 0)
                .attr('x', 0)
                .attr('dy', '0.75em')
                .attr('transform', 'rotate(-90)')
                .text('null');

            elements.svg.append('text')
                .classed('xlabel', true)
                .attr('text-anchor', 'end')
                .attr('y', layout.height - layout.lenged_font_size)
                .attr('x', layout.width)
                .attr('dy', '0.75em')
                .text('null');

            var framewidth = layout.width - layout.margin.left - layout.margin.right;
            var frameheight = layout.height - layout.margin.top - layout.margin.bottom;

            elements.panelWidth = framewidth;
            elements.panelHeight = frameheight;

            elements.frame = elements.svg.append('g')
                .attr('transform', 'translate(' + layout.margin.left + ',' + layout.margin.top + ')')
                .classed('panel', true);


            this.updateXAxis()

            this.updateYAxis()

            controller.setFrame(elements.frame);
            controller.setXScale(elements.xscale);
            controller.setYScale(elements.yscale);
            controller.redraw()
        }
        else {
            elements.svg.transition().duration(animation.duration).attr({width: layout.width, height: layout.height});

            elements.svg.select('text.ylabel').transition()
                .attr('text-anchor', 'end')
                .attr('y', 0)
                .attr('x', 0)
                .attr('dy', '0.75em')
                .attr('transform', 'rotate(-90)')
                .text('null');

            elements.svg.select('text.xlabel').transition()
                .attr('text-anchor', 'end')
                .attr('y', layout.height - layout.lenged_font_size)
                .attr('x', layout.width)
                .attr('dy', '0.75em')
                .text('null');

            var framewidth = layout.width - layout.margin.left - layout.margin.right;
            var frameheight = layout.height - layout.margin.top - layout.margin.bottom;

            elements.panelWidth = framewidth;
            elements.panelHeight = frameheight;

            elements.frame.attr('transform', 'translate(' + layout.margin.left + ',' + layout.margin.top + ')');

            this.updateXAxis();

            this.updateYAxis();

            controller.setXScale(elements.xscale);
            controller.setYScale(elements.yscale);
            controller.redraw();
        }
    }

    this.generate_set_function_redraw = function (struct, key) {
        return function (_x) {
            if (!arguments.length) return struct[key];
            if (_x == null) {
                return
            } //return if _x is null or undefined
            struct[key] = _x;
            this.redraw()
        }
    }

    for (i in elements) {
        this[i] = this.generate_set_function_redraw(elements, i)
    }

    for (i in layout) {
        this[i] = this.generate_set_function_redraw(layout, i)
    }

    this.getFrame = function () {
        return elements.frame;
    }
}

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

//@defining:ivml.visualElement:donutCharts
//@description Donut charts display data as slices of a circle or arch

var ivml = ivml || {};
ivml.visualElements = ivml.visualElements || {};

ivml.visualElements.DonutCharts = function DonutCharts(controller, $timeout) {
    var DonutCharts = {
        elements: {
            controller: controller,
            $timeout: $timeout,
            svg_g: null,
            array_of_gs: []
        },
        accessors: {
            data: [], //@ir javascript data object
            xfunction: null, //@ir x position function of the object
            yfunction: null, //@ir y position function of the object
            sliceFunction: null, //@ir function that determines the size of a slice
            fillFunction: function(d,i){      //@i function determining the fill of a slice
                var color = d3.scale.category20();
                for(var j = 0; j<20;++j){
                    color(j)
                }
                return color(i)
            }
        },
        attributes: {
            fillOpacity: 1, //@s fill opacity of slices
            stroke: 'none', //@s stroke color of slices
            strokeOpacity: 1, //@s stroke opacity of slices
            innerRadius: 5, //@s inner radius of slices
            outerRadius: 20  //@s outer radius of slices
        },
        events: {
            mouseOverE: null, //@e mouse over event
            mouseOutE: null,  //@e mouse out event
            clickE: null      //@e mouse click event
        }
    };

    DonutCharts.setGraphics = function () {
        if (DonutCharts.elements.controller && !DonutCharts.elements.svg_g) {
            DonutCharts.elements.svg_g = DonutCharts.elements.controller.getUnmaskedLayer().append('g');
        }
    }

    DonutCharts.redraw = function () {
        if (!DonutCharts.elements.controller) return;
        var xs = DonutCharts.elements.controller.getXScale();
        var ys = DonutCharts.elements.controller.getYScale();
        if (!xs) return;
        if (!ys) return;

        DonutCharts.setGraphics();


        if (!DonutCharts.elements.svg_g) return;

        if (!DonutCharts.accessors.data) return;
        if (!DonutCharts.accessors.xfunction) return;
        if (!DonutCharts.accessors.yfunction) return;
        if (!DonutCharts.accessors.sliceFunction) return;

        var xf = DonutCharts.accessors.xfunction;
        var yf = DonutCharts.accessors.yfunction;

        var right_push = 0;
        var up_push = 0;
        if (xs.rangeBand) {
            right_push += xs.rangeBand() / 2;
        }

        if (ys.rangeBand) {
            up_push += ys.rangeBand() / 2;
        }


        var on_index = 0;

        var data = DonutCharts.accessors.data;

        for(var d in data){

            var pie = d3.layout.pie().sort(null);

            var innerRadius = DonutCharts.attributes.innerRadius;
            if(DonutCharts.attributes.innerRadius === 'function'){
                innerRadius = DonutCharts.attributes.innerRadius(data[d],d);
            }

            var outerRadius = DonutCharts.attributes.outerRadius;
            if(DonutCharts.attributes.outerRadius === 'function'){
                outerRadius = DonutCharts.attributes.outerRadius(data[d],d);
            }

            var arc = d3.svg.arc().innerRadius(innerRadius)
                .outerRadius(outerRadius)
            var pie = d3.layout.pie().sort(null);

            if(!(DonutCharts.elements.array_of_gs[on_index])){
                DonutCharts.elements.array_of_gs[on_index] = DonutCharts.elements.svg_g.append('g')
            }

            var x = xs(xf(data[d],d))
            var y = ys(yf(data[d],d))

            var s = DonutCharts.accessors.sliceFunction(data[d],d);


            DonutCharts.elements.array_of_gs[on_index].attr("transform", "translate(" + (x+right_push)+ "," + (y+up_push) + ")");

            var arcs = DonutCharts.elements.array_of_gs[on_index].selectAll('paths').data(pie(s));

            arcs.enter().append("path")
                .attr('stroke-opacity',DonutCharts.attributes.strokeOpacity)
                .attr('fill-opacity',DonutCharts.attributes.fillOpacity)
                .attr('stroke',DonutCharts.attributes.stroke)
                .attr("d", arc)

             arcs.transition().attr("fill", function(d, i) {
                 return DonutCharts.accessors.fillFunction(d,i);
                })
                 .attr('stroke-opacity',DonutCharts.attributes.strokeOpacity)
                 .attr('fill-opacity',DonutCharts.attributes.fillOpacity)
                 .attr('stroke',DonutCharts.attributes.stroke)
                .attr("d", arc)

            if (DonutCharts.events.mouseOutE) {
                arcs.on('mouseout', function (d, i) {
                    DonutCharts.events.mouseOutE(d, i, d3.select(this));
                });
            }
            if (DonutCharts.events.mouseOverE) {
                arcs.on('mouseover', function (d, i) {
                    DonutCharts.events.mouseOverE(d, i, d3.select(this));
                });
            }
            if (DonutCharts.events.clickE) {
                arcs.on('click', function (d, i) {
                    DonutCharts.events.clickE(d, i, d3.select(this));
                })
            }

            arcs.exit().remove();

            on_index +=1;
        }

        for(var i = on_index; i<DonutCharts.elements.array_of_gs.length; ++i){
            DonutCharts.elements.array_of_gs[i].selectAll('path').remove();
        }

    }

    for (var i in DonutCharts.accessors) {
        DonutCharts[i] = ivml.generate_set_function_for_accessors(DonutCharts, i);
    }

    for (var i in DonutCharts.attributes) {
        DonutCharts[i] = ivml.generate_set_function_for_attributes(DonutCharts, i);
    }

    for (var i in DonutCharts.events) {
        DonutCharts[i] = ivml.generate_set_function_for_events(DonutCharts, i);
    }

    return DonutCharts;
}

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

//@defining:ivml.chart:plot
//@description Cartesian chart with x and y axes.

var ivml = ivml || {};
ivml.visualElements = ivml.visualElements || {};

ivml.visualElements.Plot = function (element, controller, $timeout) {
    var Plot = {
        elements: {
            element: element,
            controller: controller,
            $timeout: $timeout,
            svg: undefined,
            mainContainer: undefined,
            layers: {
                xGrid: undefined,
                yGrid: undefined,
                brush: undefined,
                underMargin: undefined,
                margin: undefined,
                overMargin: undefined,
                xAxis: undefined,
                yAxis: undefined
            },
            xAxisText: undefined,
            yAxisText: undefined,
            plotLabelText: undefined,
            xScale: undefined,
            yScale: undefined,
            brush: undefined
        },
        attributes: {
            background: '#FFFFFF',//@i background color of the entire element
            plotBackground: null,//@i background color of the plot area
            plotLabelText: '',//@i text for the main label of the plot
            plotLabelFontSize: '12px',//@i font size of the main label of the plot
            plotLabelFontColor: '#000000',//@i font color of the main label of the plot
            marginTop: 30,//@i size in pixels of the top margin
            marginRight: 20,//@i size in pixels of the right margin
            marginBottom: 60,//@i size in pixels of the bottom margin
            marginLeft: 60,//@i size in pixels of the left margin
            width: 500,//@i width in pixels of the plot area
            height: 500,//@i height in pixels of the plot area

            xmin: 0,//@i minimum value of the x axis
            xmax: 1,//@i maximum value of the x axis
            xticks: null,//@i number of tick marks to be shown on continuous x axis
            xtickFormatFunction: null,//@i formatter for x axis tick labels
            xodomain: null,//@i array of nominal values for discrete x axes (overrides xmin, xmax, xticks)
            xaxisVisibility: 'visible',//@i visibility value for x axis
            xaxisLabelText: '',//@i x axis label
            xaxisTextMaxWidth: null,//@i maximum width of x axis text in pixels
            xaxisTruncateEnding: '...', //@i string to append to end of x axis text truncated due to exceeding xaxis-text-max-width

            ymin: 0,//@i minimum value of the y axis
            ymax: 1,//@i maximum value of the y axis
            yticks: null,//@i number of tick marks to be shown on continuous y axis
            ytickFormatFunction: null,//@i formatter for y axis tick labels
            yodomain: null,//@i array of nominal values for discrete y axes (overrides ymin, ymax, yticks)
            yaxisVisibility: 'visible',//@i visibility value for y axis
            yaxisLabelText: '',//@i y axis label
            yaxisTextMaxWidth: null,//@i maximum width of y axis text in pixels
            yaxisTruncateEnding: '...', //@i string to append to end of y axis text truncated due to exceeding yaxis-text-max-width

            xaxisFill: 'none',//@i fill color for x axis
            xaxisStroke: '#000000',//@i stroke color for x axis
            xaxisShapeRendering: 'crispEdges',//@i shape rendering for x axis
            xaxisFontFamily: 'sans-serif',//@i font family for x axis
            xaxisFontSize: '10px',//@i font size for x axis
            xaxisFontColor: '#000000',//@i font color for x axis
            xaxisTickSize: 6, //@i tick size for x axis

            yaxisFill: 'none',//@i fill color for y axis
            yaxisStroke: '#000000',//@i stroke color for y axis
            yaxisShapeRendering: 'crispEdges',//@i shape rendering for y axis
            yaxisFontFamily: 'sans-serif',//@i font family for y axis
            yaxisFontSize: '10px',//@i font size for y axis
            yaxisFontColor: '#000000',//@i font color for y axis
            yaxisTickSize: 6, //@i tick size for x axis

            xgridlinesVisibility: 'visible',//@i visibility for x axis gridlines
            xgridlinesFill: 'none',//@i fill color for x axis gridlines
            xgridlinesStroke: '#CCC',//@i stroke color for x axis gridlines
            xgridlinesShapeRendering: 'crispEdges',//@i shape rendering for x axis gridlines
            xgridlinesOpacity: '0.4',//@i opacity for x axis gridlines

            ygridlinesVisibility: 'visible',//@i visibility for y axis gridlines
            ygridlinesFill: 'none',//@i fill color for y axis gridlines
            ygridlinesStroke: '#CCC',//@i stroke color for y axis gridlines
            ygridlinesShapeRendering: 'crispEdges',//@i shape rendering for y axis gridlines
            ygridlinesOpacity: '0.4',//@i opacity for y axis gridlines

            brushStroke: '#fff',//@i  stroke color for brush
            brushFill: '#000000',//@i  fill color for brush
            brushFillOpacity: '.125',//@i fill opacity for brush
            brushShapeRendering: 'crispEdges',//@i shape rendering brush
            brushClearOnRedraw: false//@i set to true if brush should clear when plot is redrawn
        },
        events: {
            brushstart: null,//@e function that will be called when the two dimensional brush starts.  Will pass the d3.svg.brush element of the plot as the first parameter.  Setting the function disables xbrushstart, xbrush, xbrushend, ybrushstart, ybrush, ybrushend.
            brush: null,//@e function that will be called when the two dimensional brush is brushed.  Will pass the d3.svg.brush element of the plot as the first parameter.  Setting the function disables xbrushstart, xbrush, xbrushend, ybrushstart, ybrush, ybrushend.
            brushend: null,//@e function that will be called when the two dimensional brush ends.  Will pass the d3.svg.brush element of the plot as the first parameter.  Setting the function disables xbrushstart, xbrush, xbrushend, ybrushstart, ybrush, ybrushend.
            xbrushstart: null,//@e function that will be called when the horizontal brush starts.  Will pass the d3.svg.brush element of the plot as the first parameter.  Setting the function disables ybrushstart, ybrush, ybrushend.
            xbrush: null,//@e function that will be called when the horizontal brush is brushed.  Will pass the d3.svg.brush element of the plot as the first parameter.  Setting the function disables ybrushstart, ybrush, ybrushend.
            xbrushend: null,//@e function that will be called when the horizontal brush ends.  Will pass the d3.svg.brush element of the plot as the first parameter.  Setting the function disables ybrushstart, ybrush, ybrushend.
            ybrushstart: null,//@e function that will be called when the vertical brush starts.  Will pass the d3.svg.brush element of the plot as the first parameter.
            ybrush: null,//@e function that will be called when the vertical brush is brushed.  Will pass the d3.svg.brush element of the plot as the first parameter.
            ybrushend: null//@e function that will be called when the vertical brush ends.  Will pass the d3.svg.brush element of the plot as the first parameter.
        }
    };

    Plot.redraw = function () {
        if (!Plot.elements.element || !Plot.elements.controller) {
            return;
        }

        var xScale = Plot.attributes.xodomain ?
            d3.scale.ordinal()
                .domain(Plot.attributes.xodomain)
                .rangeBands([0, Plot.attributes.width], 0.05) :
            d3.scale.linear()
                .range([0, Plot.attributes.width])
                .domain([Plot.attributes.xmin, Plot.attributes.xmax]);

        var yScale = Plot.attributes.yodomain ?
            d3.scale.ordinal()
                .domain(Plot.attributes.yodomain)
                .rangeBands([0, Plot.attributes.height], 0.05) :
            d3.scale.linear()
                .range([Plot.attributes.height, 0])
                .domain([Plot.attributes.ymin, Plot.attributes.ymax]);

        var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom')
                .tickSize(Plot.attributes.xaxisTickSize),
            xGridAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom')
                .tickSize(-Plot.attributes.height)
                .tickFormat(''),
            yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left')
                .tickSize(Plot.attributes.yaxisTickSize),
            yGridAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left')
                .tickSize(-Plot.attributes.width)
                .tickFormat('');

        Plot.elements.xScale = xScale;
        Plot.elements.yScale = yScale;

        if (Plot.attributes.xticks) {
            xAxis.ticks(ivml.clampIntegerToTicks(Plot.attributes.xticks));
            xGridAxis.ticks(ivml.clampIntegerToTicks(Plot.attributes.xticks));
        }
        if (Plot.attributes.yticks) {
            yAxis.ticks(ivml.clampIntegerToTicks(Plot.attributes.yticks));
            yGridAxis.ticks(ivml.clampIntegerToTicks(Plot.attributes.yticks));
        }

        if (Plot.attributes.xtickFormatFunction) {
            xAxis.tickFormat(Plot.attributes.xtickFormatFunction);
        }

        if (Plot.attributes.xtickFormatFunction || Plot.attributes.xaxisTextMaxWidth) {
            var textFunction = Plot.attributes.xaxisTextMaxWidth ?
                function (d) {
                    var maxWidth = Plot.attributes.xaxisTextMaxWidth;
                    var end = Plot.attributes.xaxisTruncateEnding ? Plot.attributes.xaxisTruncateEnding : '';

                    var t = Plot.attributes.xtickFormatFunction ? Plot.attributes.xtickFormatFunction(d) : d;
                    var displayString = t;
                    while (t.length && ivml.getTextWidthInPixels(displayString, Plot.attributes.xaxisFontFamily, Plot.attributes.xaxisFontSize) > maxWidth) {
                        t = t.slice(0, -1);
                        displayString = t + end;
                    }
                    return displayString;
                }
                : Plot.attributes.xtickFormatFunction;

            xAxis.tickFormat(textFunction);
        }

        if (Plot.attributes.ytickFormatFunction || Plot.attributes.yaxisTextMaxWidth) {
            var textFunction = Plot.attributes.yaxisTextMaxWidth ?
                function (d) {
                    var maxWidth = Plot.attributes.yaxisTextMaxWidth;
                    var end = Plot.attributes.yaxisTruncateEnding ? Plot.attributes.yaxisTruncateEnding : '';

                    var t = Plot.attributes.ytickFormatFunction ? Plot.attributes.ytickFormatFunction(d) : d;
                    var displayString = t;
                    while (t.length && ivml.getTextWidthInPixels(displayString, Plot.attributes.yaxisFontFamily, Plot.attributes.yaxisFontSize) > maxWidth) {
                        t = t.slice(0, -1);
                        displayString = t + end;
                    }
                    return displayString;
                }
                : Plot.attributes.ytickFormatFunction;

            yAxis.tickFormat(textFunction);
        }

        if (!Plot.elements.svg) {
            Plot.elements.svg = d3.select(Plot.elements.element).append('svg');
            Plot.elements.mainContainer = Plot.elements.svg.append('g');

            for (var layer in Plot.elements.layers) {
                Plot.elements.layers[layer] = Plot.elements.mainContainer.append('g');
            }

            Plot.elements.xAxisText = Plot.elements.mainContainer
                .append('text')
                .classed('x-axis-group-text', true)
                .attr("text-anchor", "end");

            Plot.elements.yAxisText = Plot.elements.mainContainer
                .append('text')
                .attr("text-anchor", "end");

            Plot.elements.plotLabelText = Plot.elements.mainContainer
                .append('text')
                .style('font-weight', 'bold')
                .attr("text-anchor", "start");
        }

        Plot.elements.svg
            .attr('height', Plot.attributes.height + Plot.attributes.marginTop + Plot.attributes.marginBottom)
            .attr('width', Plot.attributes.width + Plot.attributes.marginLeft + Plot.attributes.marginRight)
            .style('background', Plot.attributes.plotBackground || Plot.attributes.background);

        Plot.elements.mainContainer
            .attr('transform', 'translate(' + Plot.attributes.marginLeft + ', ' + Plot.attributes.marginTop + ')');

        var lineThicknessAdjustment = 2;

        var coverAttrs = [];

        if (Plot.attributes.marginTop > 0) {
            //top
            coverAttrs.push({x: -Plot.attributes.marginLeft, y: -Plot.attributes.marginTop, width: Plot.attributes.width + Plot.attributes.marginLeft + Plot.attributes.marginRight, height: Plot.attributes.marginTop - lineThicknessAdjustment});
        }

        if (Plot.attributes.marginLeft > 0) {
            //left
            coverAttrs.push({x: -Plot.attributes.marginLeft, y: -Plot.attributes.marginTop, width: Plot.attributes.marginLeft - lineThicknessAdjustment, height: Plot.attributes.height + Plot.attributes.marginTop + Plot.attributes.marginBottom});
        }
        if (Plot.attributes.marginBottom > 0) {
            //bottom
            coverAttrs.push({x: -Plot.attributes.marginLeft, y: Plot.attributes.height + lineThicknessAdjustment, width: Plot.attributes.width + Plot.attributes.marginLeft + Plot.attributes.marginRight, height: Plot.attributes.marginBottom - lineThicknessAdjustment});
        }
        if (Plot.attributes.marginRight > 0) {
            //right
            coverAttrs.push({x: Plot.attributes.width + lineThicknessAdjustment, y: -Plot.attributes.marginTop, width: Plot.attributes.marginRight - lineThicknessAdjustment, height: Plot.attributes.height + Plot.attributes.marginTop + Plot.attributes.marginBottom});
        }

        var plotEnter = Plot.elements.layers.margin.selectAll('rect')
            .data(coverAttrs);

        plotEnter
            .enter()
            .append('rect');

        plotEnter
            .exit()
            .remove();

        //add solid rectangles to cover the lines when rendered outside
        //of the plot area
        Plot.elements.layers.margin.selectAll('rect')
            .attr('x', function (d) {
                return d.x;
            })
            .attr('y', function (d) {
                return d.y;
            })
            .attr('width', function (d) {
                return d.width;
            })
            .attr('height', function (d) {
                return d.height;
            })
            .style('fill', Plot.attributes.background);

        Plot.elements.layers.xGrid
            .attr('transform', 'translate(0, ' + Plot.attributes.height + ')');
        Plot.elements.layers.xGrid
            .style('visibility', Plot.attributes.xgridlinesVisibility)
            .call(xGridAxis);
        Plot.elements.layers.xGrid
            .selectAll("path,line")
            .style('fill', Plot.attributes.xgridlinesFill)
            .style('stroke', Plot.attributes.xgridlinesStroke)
            .style('shape-rendering', Plot.attributes.xgridlinesShapeRendering)
            .style('opacity', Plot.attributes.xgridlinesOpacity);

        Plot.elements.layers.yGrid
            .style('visibility', Plot.attributes.ygridlinesVisibility)
            .call(yGridAxis);
        Plot.elements.layers.yGrid
            .selectAll("path,line")
            .style('fill', Plot.attributes.ygridlinesFill)
            .style('stroke', Plot.attributes.ygridlinesStroke)
            .style('shape-rendering', Plot.attributes.ygridlinesShapeRendering)
            .style('opacity', Plot.attributes.ygridlinesOpacity);

        Plot.elements.layers.xAxis
            .style('visibility', Plot.attributes.xaxisVisibility)
            .attr("transform", "translate(0," + (yScale.domain()[0] < 0 ? yScale(0) : Plot.attributes.height) + ")")
            .call(xAxis);

        Plot.elements.layers.xAxis.selectAll("path,line")
            .style('fill', Plot.attributes.xaxisFill)
            .style('stroke', Plot.attributes.xaxisStroke)
            .style('shape-rendering', Plot.attributes.xaxisShapeRendering);
        Plot.elements.layers.xAxis.selectAll("text")
            .style('font-family', Plot.attributes.xaxisFontFamily)
            .style('font-size', Plot.attributes.xaxisFontSize)
            .style('fill', Plot.attributes.xaxisFontColor);

        Plot.elements.xAxisText
            .attr('transform', 'translate(' + Plot.attributes.width + ', ' + (Plot.attributes.height + Plot.attributes.marginBottom - 10) + ')')
            .text(cleanEscape(Plot.attributes.xaxisLabelText))
            .style('font-family', Plot.attributes.xaxisFontFamily)
            .style('font-size', Plot.attributes.xaxisFontSize)
            .style('fill', Plot.attributes.xaxisFontColor);

        if (xScale.domain()[0] < 0) {
            Plot.elements.layers.yAxis.attr("transform", "translate(" + xScale(0) + ",0)");
        }
        else {
            Plot.elements.layers.yAxis.attr("transform", null);
        }

        Plot.elements.layers.yAxis.style('visibility', Plot.attributes.yaxisVisibility).call(yAxis);
        Plot.elements.layers.yAxis.selectAll("path,line")
            .style('fill', Plot.attributes.yaxisFill)
            .style('stroke', Plot.attributes.yaxisStroke)
            .style('shape-rendering', Plot.attributes.yaxisShapeRendering);
        Plot.elements.layers.yAxis.selectAll("text")
            .style('font-family', Plot.attributes.yaxisFontFamily)
            .style('font-size', Plot.attributes.yaxisFontSize)
            .style('fill', Plot.attributes.yaxisFontColor);

        Plot.elements.yAxisText
            .attr('transform', 'translate(' + (10 - Plot.attributes.marginLeft) + ', 0)rotate(-90)')
            .text(cleanEscape(Plot.attributes.yaxisLabelText))
            .style('font-family', Plot.attributes.yaxisFontFamily)
            .style('font-size', Plot.attributes.yaxisFontSize)
            .style('fill', Plot.attributes.yaxisFontColor);

        Plot.elements.plotLabelText
            .attr('transform', 'translate(0,' + (12 - Plot.attributes.marginTop) + ')')
            .style('font-size', Plot.attributes.plotLabelFontSize)
            .style('fill', Plot.attributes.plotLabelFontColor)
            .text(cleanEscape(Plot.attributes.plotLabelText));

        var lastExtent = (Plot.elements.brush && !Plot.elements.brush.empty()) ? Plot.elements.brush.extent() : null;
        var setXBrushHeight = false;
        var setYBrushWidth = false;
        if (Plot.events.brushstart || Plot.events.brush || Plot.events.brushend) {
            if (lastExtent) {
                if (lastExtent[0].length !== 2 || lastExtent[1].length !== 2) {
                    lastExtent = null;
                }
            }
            Plot.elements.brush = d3.svg.brush()
                .x(xScale)
                .y(yScale);

            if (lastExtent) {
                Plot.elements.brush.extent(lastExtent);
            }

            if (Plot.events.brushstart) {
                Plot.elements.brush.on('brushstart', function () {
                    Plot.events.brushstart(Plot.elements.brush);
                })
            }

            if (Plot.events.brush) {
                Plot.elements.brush.on('brush', function () {
                    Plot.events.brush(Plot.elements.brush);
                })
            }

            if (Plot.events.brushend) {
                Plot.elements.brush.on('brushend', function () {
                    Plot.events.brushend(Plot.elements.brush);
                })
            }
        }
        else if (Plot.events.xbrushstart || Plot.events.xbrush || Plot.events.xbrushend) {
            if (lastExtent) {
                if (lastExtent[0] instanceof  Array || lastExtent[1] instanceof  Array) {
                    lastExtent = null;
                }
            }

            Plot.elements.brush = d3.svg.brush()
                .x(xScale);

            if (lastExtent) {
                Plot.elements.brush.extent(lastExtent);
            }

            if (Plot.events.xbrushstart) {
                Plot.elements.brush.on('brushstart', function () {
                    Plot.events.xbrushstart(Plot.elements.brush);
                })
            }

            if (Plot.events.xbrush) {
                Plot.elements.brush.on('brush', function () {
                    Plot.events.xbrush(Plot.elements.brush);
                })
            }

            if (Plot.events.xbrushend) {
                Plot.elements.brush.on('brushend', function () {
                    Plot.events.xbrushend(Plot.elements.brush);
                })
            }
            setXBrushHeight = true;
        }
        else if (Plot.events.ybrushstart || Plot.events.ybrush || Plot.events.ybrushend) {
            if (lastExtent) {
                if (lastExtent[0] instanceof  Array || lastExtent[1] instanceof  Array) {
                    lastExtent = null;
                }
            }

            Plot.elements.brush = d3.svg.brush()
                .y(yScale);

            if (lastExtent) {
                Plot.elements.brush.extent(lastExtent);
            }

            if (Plot.events.ybrushstart) {
                Plot.elements.brush.on('brushstart', function () {
                    Plot.events.ybrushstart(Plot.elements.brush);
                })
            }

            if (Plot.events.ybrush) {
                Plot.elements.brush.on('brush', function () {
                    Plot.events.ybrush(Plot.elements.brush);
                })
            }

            if (Plot.events.ybrushend) {
                Plot.elements.brush.on('brushend', function () {
                    Plot.events.ybrushend(Plot.elements.brush);
                })
            }
            setYBrushWidth = true;
        }
        else {
            Plot.elements.brush = null;
        }

        if (Plot.elements.brush) {
            if (Plot.attributes.brushClearOnRedraw) {
                Plot.elements.brush.clear();
            }
            Plot.elements.layers.brush.call(Plot.elements.brush);
            Plot.elements.layers.brush
                .selectAll('.extent')
                .style('stroke', Plot.attributes.brushStroke)
                .style('fill', Plot.attributes.brushFill)
                .style('fill-opacity', Plot.attributes.brushFillOpacity)
                .style('shape-rendering', Plot.attributes.brushShapeRendering);

            if (setXBrushHeight) {
                Plot.elements.layers.brush
                    .selectAll("rect")
                    .attr("height", Plot.attributes.height)
            }

            if (setYBrushWidth) {
                Plot.elements.layers.brush
                    .selectAll("rect")
                    .attr("width", Plot.attributes.width)
            }
        }
        else {
            //remove brush if it exists
            Plot.elements.layers.brush
                .selectAll('rect')
                .remove();
        }

        Plot.elements.controller.redraw();
    }

    for (var i in Plot.attributes) {
        Plot[i] = ivml.generate_set_function_for_attributes(Plot, i);
    }

    for (var i in Plot.events) {
        Plot[i] = ivml.generate_set_function_for_events(Plot, i);
    }

    return Plot;
}

function cleanEscape(component) {
	return component.replace(/</, "&lt;").replace(/>/, "&gt;");
}
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

var ivml = ivml || {};
ivml.visualElements = ivml.visualElements || {};

ivml.visualElements.Texts = function Texts(controller, $timeout) {
    var Texts = {
        elements: {
            controller: controller,
            $timeout: $timeout,
            svg_g: null
        },
        attributes: {
            fontFamily: 'sans-serif', //@s font face
            textAnchor: 'middle', //@s text box's anchor point
            dominantBaseline: 'auto', //@i defining the text's baseline
            fontSize: '10px',  //@s font size
            makeVertical: false, //@s make text vertical (true or false)
            cursor: 'default', //@s hover cursor style
            yadjust: 0, //@s x adjust position in pixels
            xadjust: 0, //@s y adjust position in pixels
            fill: '#000000', //@s font fill color
            maxWidth: null, //@s maximum width of text in pixels
            truncateEnding: '...' //@s string to append to end of text truncated due to exceeding max-width
        },
        accessors: {
            data: null,  //@ir the javascript data object to plot
            xfunction: null, //@ir accessor for the data's x value
            yfunction: null, //@ir accessor for the data's y value
            textFunction: null //@ir accessor for the text value

        },
        events: {
            mouseOverE: null,  //@e mouse over event}
            mouseOutE: null,  //@e mouse out event}
            clickE: null      //@e mouse click event}
        }
    };

    Texts.setGraphics = function () {
        if (Texts.elements.controller && !Texts.elements.svg_g) {
            Texts.elements.svg_g = Texts.elements.controller.getUnmaskedLayer().append('g');
        }
    }

    Texts.redraw = function () {

        if (!Texts.elements.controller) return;
        var xs = Texts.elements.controller.getXScale();
        var ys = Texts.elements.controller.getYScale();
        if (!xs) return;
        if (!ys) return;

        Texts.setGraphics();
        if (!Texts.elements.svg_g) return;

        if (!Texts.accessors.data) return;
        if (!Texts.accessors.xfunction) return;
        if (!Texts.accessors.yfunction) return;
        var xf = Texts.accessors.xfunction;
        var yf = Texts.accessors.yfunction;
        var xa = Texts.attributes.xadjust || 0;
        var ya = Texts.attributes.yadjust || 0;

        var xFunction;
        if (xs.rangeBand) {
            var right_push = xs.rangeBand() / 2;

            if (ivml.isF(xa)) {
                xFunction = function (d, i) {
                    if (xs.domain().indexOf(xf(d, i)) >= 0)
                        return xs(xf(d, i)) + xa(d, i) + right_push;
                    return null;
                };
            }
            else {
                xFunction = function (d, i) {
                    if (xs.domain().indexOf(xf(d, i)) >= 0)
                        return xs(xf(d, i)) + xa + right_push;
                    return null;
                };
            }
        }
        else {
            if (ivml.isF(xa)) {
                xFunction = function (d, i) {
                    return xs(xf(d, i)) + xa(d, i);
                };
            }
            else {
                xFunction = function (d, i) {
                    return xs(xf(d, i)) + xa;
                };
            }
        }

        var yFunction;
        if (ys.rangeBand) {
            var up_push = ys.rangeBand() / 2;
            if (ivml.isF(ya)) {
                yFunction = function (d, i) {
                    if (ys.domain().indexOf(yf(d, i)) >= 0)
                        return ys(yf(d, i)) + ya(d, i) + up_push;
                    return null;
                };
            }
            else {
                yFunction = function (d, i) {
                    if (ys.domain().indexOf(yf(d, i)) >= 0)
                        return ys(yf(d, i)) + ya + up_push;
                    return null;
                };
            }
        }
        else {
            if (ivml.isF(ya)) {
                yFunction = function (d, i) {
                    return ys(yf(d, i)) + ya(d, i);
                };
            }
            else {
                yFunction = function (d, i) {
                    return ys(yf(d, i)) + ya;
                };
            }
        }

        var texts = Texts.elements.svg_g.selectAll('text').data(Texts.accessors.data);

        var transformFunction = Texts.attributes.makeVertical ?
            function (d, i) {
                var transform = true;
                if (ivml.isF(Texts.attributes.makeVertical)) {
                    transform = Texts.attributes.makeVertical(d, i);
                }
                if (transform) {
                    var x = xFunction(d, i);
                    var y = yFunction(d, i);
                    return 'rotate(-90 ' + x + ',' + y + ')';
                }
                else {
                    return null;
                }
            } : null;

        var textFunction = Texts.attributes.maxWidth ?
            function (d, i) {
                var maxWidth = ivml.isF(Texts.attributes.maxWidth) ? Texts.attributes.maxWidth(d, i) : Texts.attributes.maxWidth;
                var end = Texts.attributes.truncateEnding ? Texts.attributes.truncateEnding : '';

                var t = Texts.accessors.textFunction(d, i);
                var displayString = t;
                while (t.length && ivml.getTextWidthInPixels(displayString, Texts.attributes.fontFamily, Texts.attributes.fontSize) > maxWidth) {
                    t = t.slice(0, -1);
                    displayString = t + end;
                }
                return displayString;
            }
            : Texts.accessors.textFunction;

        texts.enter().append('text')
            .attr('x', xFunction)
            .attr('y', yFunction)
            .attr('text-anchor', Texts.attributes.textAnchor)
            .style('dominant-baseline', Texts.attributes.dominantBaseline)
            .attr('font-family', Texts.attributes.fontFamily)
            .attr('font-size', Texts.attributes.fontSize)
            .attr('fill', Texts.attributes.fill)
            .style('cursor', Texts.attributes.cursor)
            .attr('transform', transformFunction)
            .text(textFunction);

        ivml.animateSelection(texts
            //hide texts with undefined positions
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
            .attr('text-anchor', Texts.attributes.textAnchor)
            .style('dominant-baseline', Texts.attributes.dominantBaseline)
            .attr('font-family', Texts.attributes.fontFamily)
            .attr('font-size', Texts.attributes.fontSize)
            .attr('fill', Texts.attributes.fill)
            .style('cursor', Texts.attributes.cursor)
            .attr('transform', transformFunction)
            .text(textFunction);

        texts.exit().remove();

        if (Texts.events.mouseOutE) {
            texts.on('mouseout', function (d, i) {
                Texts.events.mouseOutE(d, i, d3.select(this));
            });
        }
        if (Texts.events.mouseOverE) {
            texts.on('mouseover', function (d, i) {
                Texts.events.mouseOverE(d, i, d3.select(this));
            });
        }
        if (Texts.events.clickE) {
            texts.on('click', function (d, i) {
                Texts.events.clickE(d, i, d3.select(this));
            })
        }
    }

    Texts.setController = function (c) {
        controller = c;
    }

    for (var i in Texts.accessors) {
        Texts[i] = ivml.generate_set_function_for_accessors(Texts, i)
    }

    for (var i in Texts.attributes) {
        Texts[i] = ivml.generate_set_function_for_attributes(Texts, i)
    }
    for (var i in Texts.events) {
        Texts[i] = ivml.generate_set_function_for_events(Texts, i);
    }

    return Texts;
}
