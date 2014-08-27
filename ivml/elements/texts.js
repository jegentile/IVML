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
