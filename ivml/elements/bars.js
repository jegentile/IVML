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
