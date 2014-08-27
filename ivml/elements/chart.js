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
