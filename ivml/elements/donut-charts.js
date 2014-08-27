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
