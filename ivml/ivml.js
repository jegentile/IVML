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
