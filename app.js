drag = function(ev){
    console.log('drag')
}

angular.module("ivmlexample",['ivml'])
    .controller("mainCtrl", function($scope){

        $scope.count = 4

        $scope.opacity = function(d,i){
            return $scope.oscale(i);
        }

        $scope.fill = function(d,i){
            return $scope.fscale(i);
        }

        $scope.radius = function(d,i){
            return $scope.rscale(i);
        }

        $scope.up = function(d,i){
            return 1- d.y;
        }

        $scope.v_var = function(d,i){
            return Math.random()
        }

        $scope.h = function(d,i){
            return 5;
        }

        $scope.odomain = ['A','B','C','D']



   //     65+


        $scope.click = function(){


            $scope.odomain = []
            for(var i = 0; i<$scope.count; ++i){
                $scope.odomain.push(String.fromCharCode(65+i))

            }
            console.log('odomain',$scope.odomain)

            $scope.oscale = d3.scale.linear().domain([0,$scope.count]).range([0.2, 0.9]);
            $scope.fscale = d3.scale.linear().domain([0,$scope.count]).range(['blue', 'green']);
            $scope.rscale = d3.scale.linear().domain([0,$scope.count]).range([3, 10]);

            $scope.data1 = [];
            $scope.data2 = [];
            $scope.line_data = [];
            $scope.odata = []

            for(var i in $scope.odomain){
                $scope.odata.push({o:$scope.odomain[i],m:Math.random()})
            }

            for(var i = 0; i < $scope.count; i+=1){
                $scope.data1.push({x:Math.random(),y:Math.random()});
                $scope.data2.push({x:Math.random(),y:Math.random()});
                $scope.line_data.push({x1:Math.random(),y1:Math.random(),x2:Math.random(),y2:Math.random()})

            }

        }

        $scope.type = "grouped"


        var m = setInterval(function(){

            if($scope.type == "grouped"){
                $scope.type = "stacked";
            }
            else{
                $scope.type = "grouped";
            }
            console.log('in timeout',$scope.type)


            $scope.$apply();


        },3000);

        $scope.click()

        $scope.lcofill= function(d,i){
            console.log(d,i);
            return 'black'
        }

        $scope.neg_m = function(d,i){
            return -1*d.m
        }

        d3.json('./lcos_20.json',function( data){
            $scope.pathdata = function(d){
                return d.features;
            }
            $scope.$apply()


        })
    });
