if(!bluewave) var bluewave={};
if(!bluewave.charts) bluewave.charts={};

//******************************************************************************
//**  ScatterChart
//******************************************************************************
/**
 *   Panel used to create scatter charts
 *
 ******************************************************************************/

bluewave.charts.ScatterChart = function(parent, config) {

    var me = this;
    var defaultConfig = {
        margin: {
            top: 15,
            right: 5,
            bottom: 65,
            left: 82
        }
    };
    var svg, scatterArea;
        var xAxis, yAxis;
        var axisWidth, axisHeight;
        var x, y, xBand, yBand;
        var timeAxis;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

        config = merge(config, defaultConfig);


        if (parent instanceof d3.selection){
            svg = parent;
        }
        else if (parent instanceof SVGElement) {
            svg = d3.select(parent);
        }
        else{
            svg = d3.select(parent).append("svg");
        }

        scatterArea = svg.append("g");
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        scatterArea.selectAll("*").remove();
    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(chartConfig, data){
        me.clear();

        var parent = svg.node().parentNode;


        onRender(parent, function(){

            var width = parent.offsetWidth;
            var height = parent.offsetHeight;
            var margin = config.margin;
            axisHeight = height - margin.top - margin.bottom;
            axisWidth = width - margin.left - margin.right;
            var plotHeight = height - margin.top - margin.bottom;
            var plotWidth = width - margin.left - margin.right;
            scatterArea
                .attr("width", plotWidth)
                .attr("height", plotHeight)
                .attr(
                    "transform",
                    "translate(" + margin.left + "," + (margin.top) + ")"
                );

             // Setup:
            // Check that axis exist and are populated
            let xKey;
            let yKey;
            let xKey2;
            let yKey2;
            let group;

            if(chartConfig.xAxis===null || chartConfig.yAxis===null){
                return;
            }else{
                xKey = chartConfig.xAxis;
                yKey = chartConfig.yAxis;
                group = chartConfig.group;
            }

            if(chartConfig.xAxis2 !==null && chartConfig.yAxis2 !==null){
                xKey2 = chartConfig.xAxis2;
                yKey2 = chartConfig.yAxis2;
            }


            var data1 = data[0];
            var data2 = data[1];
            data = data1;

            if (data2!==null && data2!==undefined && xKey2 && yKey2){
                data = mergeToAxis(data1,data2,xKey,xKey2,xKey,yKey,yKey2,yKey);
            }
                let xType = typeOfAxisValue();

                var scatterData = d3.nest()
                    .key(function(d){return d[xKey];})
                    .rollup(function(d){
                        return d3.sum(d,function(g){
                            return g[yKey];
                        });
                }).entries(data);

               displayAxis("key","value",scatterData);

               let keyType = typeOfAxisValue(scatterData[0].key);
               scatterArea
                   .selectAll("dot")
                   .data(scatterData)
                   .enter()
                   .append("circle")
                      .attr("cx", function (d) {
                      if(keyType==="date"){
                        return x(new Date(d.key));
                      } else{
                        return x(d.key);
                      }})
                      .attr("cy", function (d) { return y(d["value"]); } )
                      .attr("r", 7)
                      .style("fill", "#12b84c")
                      .style("opacity", 0.3)
                      .style("stroke", "white");

        });
    };

      //**************************************************************************
      //** typeOfAxisValue
      //**************************************************************************
         var typeOfAxisValue = function(value) {
            let dataType;

            const validNumberRegex = /^[\+\-]?\d*\.?\d+(?:[Ee][\+\-]?\d+)?$/;
            switch (typeof value) {
                case "string":
                    if(value.match(validNumberRegex)){
                        dataType =  "number";
                    }else if (Date.parse(value)){
                        dataType =  "date";
                    }else{
                        dataType = "string";
                    }
                    break;
                case "number":
                    dataType = "number";
                    break;
                case "object":
                    dataType = "date";
                    break;
                default:
                    break;
            }
            return dataType;
        };

  //**************************************************************************
  //** displayAxis
  //**************************************************************************
    var displayAxis = function(xKey,yKey,chartData){
        let axisTemp = createAxisScale(xKey,'x',chartData);
        x = axisTemp.scale;
        xBand = axisTemp.band;

        axisTemp = createAxisScale(yKey,'y',chartData);
        y = axisTemp.scale;
        yBand = axisTemp.band;


        if (xAxis) xAxis.selectAll("*").remove();
        if (yAxis) yAxis.selectAll("*").remove();

        xAxis = scatterArea
            .append("g")
            .attr("transform", "translate(0," + axisHeight + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        yAxis = scatterArea
            .append("g")
            .call(d3.axisLeft(y));
    };


  //**************************************************************************
  //** createAxisScale
  //**************************************************************************
    var createAxisScale = function(key,axisName,chartData){
        let scale;
        let band;
        let type = typeOfAxisValue(chartData[0][key]);
        let max = 0;
        let timeRange;
        let axisRange;
        let axisRangePadded;
        if(axisName === "x"){
            axisRange = [0,axisWidth];
            axisRangePadded = [10,axisWidth-10];
        }else{
            axisRange = [axisHeight,0];
            axisRangePadded = [axisHeight-10,10];
        }

        switch (type) {
            case "string":
                scale = d3
                .scaleBand()
                .domain(
                    chartData.map(function (d) {
                        return d[key];
                    })
                )
                .range(axisRange)
                .padding(0.2);
                break;
            case "date":

                timeRange = [new Date(chartData[0][key]),new Date(chartData[chartData.length-1][key])];
                chartData.map((val) => {
                    val[key] = new Date(val[key]);
                    return val;
                });

                scale = d3
                    .scaleTime()
                    .domain(timeRange)
                    .rangeRound(axisRangePadded);

                band = d3
                    .scaleBand()
                    .domain(d3.timeDay.range(...scale.domain()))
                    .rangeRound(axisRangePadded)
                    .padding(0.2);

                timeAxis = axisName;
                break;
            default:

                chartData.forEach((val) => {
                    let curVal = parseFloat(val[key]);
                    if (curVal > max) {
                        max = curVal;
                    }
                });

                scale = d3
                    .scaleLinear()
                    .domain([0, max])
                    .range(axisRange);
                break;
        }
        return {
            scale,
            band
        };
    };

  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var onRender = javaxt.dhtml.utils.onRender;

    init();
};