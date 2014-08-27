# Bugs

* in indexExample.html, brushing a range raises multiple "invalid value for <rect> attribute y="NaN"" errors. Seems related to how the continuous zoom dependent graphs are showing/hiding elements. Could be related/cause of unassociated floating bars on the dependent chart.


# Questions

* For paths:
    * why does a path need to be an array of arrays?
    * why is points-function required (the one we use is an identity function - this should be the default)
    * points-function isn't called out in the documentation


* For plot:
    * an x or y ticks of greater than 10 causes odd behavior (wrong tick numbering, or every tick numbering)
