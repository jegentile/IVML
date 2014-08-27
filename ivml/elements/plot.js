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