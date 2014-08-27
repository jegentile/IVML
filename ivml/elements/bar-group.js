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

