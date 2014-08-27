IVML, the Interactive Visualization Markup Language, is a JavaScript library that leverages popular JavaScript technologies Angular, D3 and JQuery to enable developers to quickly implement interactive data visualizations in a browser. It has predefined a collection of embeddable Angular directives that bind to underlying JavaScript objects.

# Examples

You can find a series of examples in the _examples_ directory.

# Using IVML

Including IVML and its dependencies in your document is fairly straight forward;

  1. Include D3
  2. Include Angular
  3. Include IVML
  
```html
<script type="text/javascript" src="d3-3.4.3/d3.js"></script>
<script type="text/javascript" src="angular-1.2.14/angular.js"></script>
<script type="text/javascript" src="ivml.0.0.0.js"></script>
```

  4. Reference the IVML dependency in your Angular Controller
  
```javascript
angular.module("ivmlexample", ['ivml'])
	.controller("myPlotCtrl", function ($scope ) {
	...	
	});
```

# Dependencies

IVML is built on:

  * D3
  * AngularJS
  
# License
Apache License, Version 2.0