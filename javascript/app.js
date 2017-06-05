var f = d3.format(",");
var projection = d3.geoAlbersUsa().scale(1000).translate([600,260]);
var pathGenerator = d3.geoPath().projection(projection);
var w = $("#map").width(); 

var svg = d3.select("#map").append("svg")
    .attr("width", w)
    .attr("height", 500);

var svgs = d3.select("#states").append("svg")
    .attr("width", w)
    .attr("height", 200);

var color = d3.scaleQuantile()
            .domain([0, 26, 76, 105, 151, 251, 600, 1000])
            .range(["#ffffcc","#ffeda0","#fed976","#feb24c","#fd8d3c","#fc4e2a","#e31a1c","#bd0026","#800026"])

d3.queue()
    .defer(d3.csv, "data/raw.csv")
    .defer(d3.json, "data/us.topojson")
    .defer(d3.csv, "data/statedata.csv")
    .awaitAll(function(error, results){ 
        data = results[0];
        by_state = d3.nest()
        .key(function(d) { return d.state; })
        .entries(data);

        by_industry = d3.nest()
        .key(function(d) { return d.industry})
        .entries(data);

        var monthsort = d3.timeFormat("%b %Y");
        
        by_month = d3.nest()
        .key(function(d) { return monthsort(new Date(d.created_at))})
        .rollup(function(leaves) { return {"number": leaves.length, "total_raised": d3.sum(leaves, function(d) {return parseFloat(d.money_raised);})} })
        .entries(data);

        by_industry.sort(function(a, b){
            var a1 = a.key;
            var b1 = b.key;
            if (a.key > b.key) { return 1}
            else if (a.key < b.key) { return -1}
            else {return 0}
        })

        by_industry.forEach(function(d){
            var button = document.createElement("button");
                button.innerHTML = d.key;
                button.setAttribute('id', "b" + (by_industry.indexOf(d) + 1)); 
                button.setAttribute('class', "button"); 
                document.getElementById('buttons').appendChild(button);
        })

        by_state_total = d3.nest()
        .key(function(d) { return d.state})
        .rollup(function(leaves) { return {"money_raised": d3.sum(leaves, function(d) {return parseFloat(d.money_raised);}),
                                           "min_investment": d3.sum(leaves, function(d) {return parseFloat(d.min_investment);}),
                                           "offered_for_sale": d3.sum(leaves, function(d) {return parseFloat(d.offered_for_sale);})
                                       } })
        .entries(data);

        states = topojson.feature(results[1], results[1].objects.us).features;
        statedata = results[2];

        states.forEach(function(d){
            statedata.forEach(function(j){
                if (d.properties.name == j.STNAME){
                    //d.count = j.values.length;
                    d.population = j.POPULATION;
                    d.raised = j.RAISED;
                    d.min_invest = j.MIN_INVESTMENT;
                    d.for_sale = j.FOR_SALE;
                    d.area = j.AREA;
                    d.abbrev = j.ABBREV;
                }
              })
        })

        states.forEach(function(d){
            by_state.forEach(function(j){
                if (d.properties.name.toUpperCase() == j.key){
                    d.count = j.values.length;
                    }                
              })
        })

        showMap();
        showBars("Technology");
        //showAgg();

        d3.selectAll(".button").on("click", function(){
            d3.selectAll(".floatme").remove();
            showBars(this.innerText)
        })
})


function showMap() {
    statedata.sort(function(a, b){
        var nameA = a.RAISED/a.POPULATION;
        var nameB = b.RAISED/b.POPULATION;
        if (nameA < nameB) { return 1; }
        if (nameA > nameB) { return -1; }
        return 0; 
    })

    svg.append("text")
        .attr("x", 10)
        .attr("y", 140)
        .style("font-weight", 700)
        .style("fill", "#C43E3B")
        .style("font-size", 12)
        .text("Dollars Raised per Person")
        .call(wrapt, 100)

    var val = [0, 26, 76, 105, 151, 251, 600, 1000].reverse();
    for (i=0; i<8; i++){
        svg.append("rect")
            .attr("x", 10)
            .attr("y", 130 + ((i+2)*20))
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", color(val[i] + 1))

        svg.append("text")
            .attr("x", 35)
            .attr("y", 145 + ((i+2)*20))
            .style("fill", "black")
            .style("font-size", 12)
            .text(function(){
                if (i != 0) {
                    return "$" + val[i] + "-$" + (val[i-1]-1);
                }else if (i == 0){
                    return "> $" + val[i]
                }
            })
    }

    var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0, 10])
    .html(function(d) {
      return "<h4 style='color:#C43E3B'>" + d.properties.name +"</h4><p>Money Raised: $" + f(d.raised) + "<br> Minimum Investment: $" + f(d.min_invest) + "<br> For Sale: $" + f(d.for_sale) + "<br>Money Raised per Person: $" + parseInt(d.raised/d.population) + "</p>";
    })


    var state_names = [];
    var findmax = [];
    statedata.forEach(function(d){
        if (state_names.indexOf(d.key) == -1){
            state_names.push(d.STNAME);
        }
        findmax.push(d.RAISED/d.POPULATION);
    })

    pathGenerator = d3.geoPath().projection(projection);
    
    var paths = svg.selectAll("path.state").data(states);
    svg.call(tip); 

    paths.enter()
    	.append("path")
    	.attr("class", "state")
        .attr("id", function(d) { return d.properties.name})
    	.attr("d", function (state) {
	        return pathGenerator(state);
	    })
        .style("fill", function(d){
            return color(d.raised/d.population)
        })
        .style("opacity", 1)
        .on("mouseenter", function(d){
            tip.show(d);
            d3.selectAll("#" + d3.select(this).attr("id"))
                .style("stroke", "black")
                .style("stroke-width", 2)
        })
        .on("mouseleave", function(d){
            tip.hide(d);
            d3.selectAll("#" + d3.select(this).attr("id"))
                .style("stroke", "none")
                .style("stroke-width", 0)
        })

    var xScale = d3.scalePoint()
                .domain(state_names)
                .range([50, w - 50])

    var yScale = d3.scalePow()
                .exponent(.5)
                .domain([0, d3.max(findmax)])
                .range([180, 10])

    var yScaleH = d3.scalePow()
                .exponent(.5)
                .domain([0, d3.max(findmax)])
                .range([0, 170])

    var xAxis = d3.axisBottom(xScale).tickSize(0,0,0)
    var yAxis = d3.axisLeft(yScale);

    svgs.selectAll(".states")
        .data(states)
        .enter()
        .append("rect")
            .attr("id", function(d) { return d.properties.name})
            .attr("x", function(d){ return xScale(d.properties.name)})
            .attr("y", function(d) { return yScale(d.raised/d.population)})
            .attr("width", 10)
            .attr("height", function(d) { return yScaleH(d.raised/d.population)})
            .style("fill", function(d){
            return color(d.raised/d.population)
        })
            .on("mouseenter", function(d){
            tip.show(d);
            d3.selectAll("#" + d3.select(this).attr("id"))
                .style("stroke", "black")
                .style("stroke-width", 2)
        })
        .on("mouseleave", function(d){
            tip.hide(d);
            d3.selectAll("#" + d3.select(this).attr("id"))
                .style("stroke", "none")
                .style("stroke-width", 0)
        })

    svgs.selectAll(".abbrev")
        .data(states)
        .enter()
        .append("text")
            .attr("x", function(d){ return xScale(d.properties.name) + 5})
            .attr("y", 192)
            .style("text-anchor", "middle")
            .style("font-size", 10)
            .style("fill", "black")
            .text(function(d) {return d.abbrev})
}

function showBars(thisname) {
    by_industry.forEach(function(industry){
    if (industry.key == thisname) {
        var thisindustry = d3.select("#industries").append("svg")
            .attr('width', w)
            .attr('height', 350)
            .attr("class", "floatme")
            .style("overflow", "visible")

         var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([0, 10])
            .html(function(d) {
                if (!isNaN(d.offered_for_sale)) {
                    d.offered_for_sale = "$" + f(d.offered_for_sale);
                }
              return "<b>" + d.name + "</b><br>Money Raised: $" + f(d.money_raised) + "<br>Minimum Investment: $" + f(d.min_investment) + "<br>For Sale: " + d.offered_for_sale;
            })

        thisindustry.call(tip);

        thisindustry.append("text")
            .attr("x", 10)
            .attr("y", 20)
            .text(industry.key)
            .style("font-weight", 700)
            .style("font-size", 18)
            .style("text-transform", "uppercase")
            .style("fill", "#C43E3B")

        thisindustry.append("text")
            .attr("x", -175)
            .attr("y", 0)
            .text("Money Raised")
            .style("text-transform", "uppercase")
            .style("text-anchor", "middle")
            .style("fill", "#C43E3B")
            .style("font-weight", 700)
            .attr("transform", "rotate(-90)")

        var findmax = [];
        industry.values.forEach(function(d){
            findmax.push(+d.money_raised)
        })

        var redgreen = d3.scaleQuantize()
                .domain([0, 7000000000])
                .range(["#a50026","#d73027","#f46d43","#fdae61","#a6d96a","#66bd63","#1a9850","#006837"]);
    
        var xScale = d3.scaleLinear()
                    .domain([new Date(2015, 4, 1), new Date()])
                    .range([50, w - 40])

        var yScale = d3.scaleLinear()
                    .domain([0, d3.max(findmax)])
                    .range([300, 40])

        var rScale = d3.scaleLinear()
                    .domain([0, d3.max(findmax)])
                    .range([1, 5])

        var valueline = d3.area()
           // .curve(d3.curveBasis)
            .x(function(d) { return xScale(new Date(d.created_at)); })
            .y1(function(d) { return yScale(d.money_raised); })
            .y0(function(d) { return yScale(0); });

        var makek = d3.format(".1s");
        var month = d3.timeFormat("%b %Y")
        var xAxis = d3.axisBottom(xScale).tickValues([new Date('June 2015'), new Date('April 2017')]).tickFormat(function(e){ return month(e)});
        var yAxis = d3.axisLeft(yScale).ticks(3).tickFormat(function(e){ return makek(e)});

        thisindustry.append('g').attr('class', 'axis')
            .attr('transform', 'translate(0, 300)')
            .call(xAxis)

        thisindustry.append('g').attr('class', 'axis')
            .attr('transform', 'translate(50, 0)')
            .call(yAxis);

        thisindustry.append("path")
            .datum(industry.values)
            .style("fill", redgreen(d3.max(findmax)))
            .style("stroke", redgreen(d3.max(findmax)))
            .style("opacity", .5)
            .style("stroke-width", 3)
            .attr("d", valueline)

        thisindustry.selectAll(".industry")
            .data(industry.values)
            .enter()
                .append("circle")
                .attr("cx", function(d){ 
                    return xScale(new Date(d.created_at))})
                .attr("cy", function(d){ return yScale(d.money_raised)})
                .attr("r", function(d){ return rScale(d.money_raised)})
                .attr("fill", "white")
                .attr("stroke", function(d){ return redgreen(d3.max(findmax))})
                .attr("stroke-width", 1)
                .on("mouseenter", function(d){
                    tip.show(d);
                    d3.select(this)
                        .style("stroke-width", 3)
                })
                .on("mouseleave", function(d){
                    tip.hide(d);
                    d3.select(this)
                        .style("stroke-width", 1)
                })

        thisindustry.selectAll(".industrynames")
            .data(industry.values)
            .enter()
                .append("text")
                .attr("x", function(d){ 
                    return xScale(new Date(d.created_at)) + 7})
                .attr("y", function(d){ return yScale(d.money_raised) + 5})
                .text( function(d){ 
                    if (rScale(d.money_raised) > 2.5) {
                        return d.name;
                    }})
                .style("fill", "black")
                .style("font-size", 12)
                .call(wrapt, 150)
    }
    })

}
/*
function showAgg(){
     var thisagg = d3.select("#aggregate").append("svg")
            .attr('width', w)
            .attr('height', 400)
            .style("overflow", "visible")

     var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([0, 10])
        .html(function(d) {
          var thismo = d3.timeFormat("%b %Y")
          return thismo(new Date(d.key));
        })

    thisagg.call(tip);

    var findmax_raised = [];
    var findmax_number = [];
    by_month.forEach(function(d){
        findmax_raised.push(d.value.total_raised);
        findmax_number.push(d.value.number)
    })

    var xScale = d3.scaleLinear()
                    .domain([new Date(2015, 3, 1), new Date()])
                    .range([40, w - 40])

    var yScale = d3.scaleLinear()
                .domain([0, d3.max(findmax_raised)])
                .range([350, 30])

    var yScaleC = d3.scaleLinear()
                .domain([0, d3.max(findmax_number)])
                .range([350, 30])

    var valueline = d3.area()
       // .curve(d3.curveBasis)
        .x(function(d) { return xScale(new Date(d.key)); })
        .y1(function(d) { return yScale(d.value.total_raised); })
        .y0(function(d) { return yScale(0); });

     var valuelineC = d3.line()
       // .curve(d3.curveBasis)
        .x(function(d) { return xScale(new Date(d.key)); })
        .y(function(d) { return yScaleC(d.value.number); })

    var makek = d3.format(".1s");
    var month = d3.timeFormat("%b %Y")
    var xAxis = d3.axisBottom(xScale).tickValues([new Date('June 2015'), new Date('March 2017')]).tickFormat(function(e){ return month(e)});
    var yAxis = d3.axisLeft(yScale).ticks(3).tickFormat(function(e){ return makek(e)});

    thisagg.append('g').attr('class', 'axis')
        .attr('transform', 'translate(0, 350)')
        .call(xAxis)
            .selectAll('text')
            .style("font-size", 10)
            .style("fill", "black")

    thisagg.append('g').attr('class', 'axis')
        .attr('transform', 'translate(40, 0)')
        .call(yAxis);

    thisagg.append("path")
        .datum(by_month)
        .attr("class", "totalmoney ce")
        .style("fill", "orange")
        .style("opacity", .2)
        .attr("d", valueline)

    thisagg.selectAll(".pathcircle")
        .data(by_month)
        .enter()
            .append("circle")
            .attr("class", "totalmoney ce")
            .attr("cx", function(d) { return xScale(new Date(d.key))})
            .attr("cy", function(d) { return yScale(d.value.total_raised)})
            .attr("r", 5)
            .style("stroke", "white")
            .style("stroke-width", 2)
            .style("fill", "orange")
            .style("opacity", .2)
            .on("mouseenter", function(d){
                tip.show(d);
            })
            .on("mouseleave", function(d){
                tip.hide(d);
            })

    thisagg.selectAll(".pathtext")
        .data(by_month)
        .enter()
            .append("text")
            .attr("class", "totalmoney ce")
            .attr("x", function(d) { return xScale(new Date(d.key))})
            .attr("y", function(d) { return yScale(d.value.total_raised) - 10})
            .style("font-size", 8)
            .style("font-weight", 7002)
            .style("opacity", .2)
            .style("text-anchor", "middle")
            .text(function(d){
                return "$" + f(d.value.total_raised)
            })

    thisagg.append("path")
        .datum(by_month)
        .attr("class", "totalnum ce")
        .style("fill", "none")
        .style("stroke-width", 2)
        .style("stroke", "orange")
        .style("opacity", 1)
        .attr("d", valuelineC)

    thisagg.selectAll(".pathnum")
        .data(by_month)
        .enter()
            .append("text")
            .attr("class", "totalnum ce")
            .attr("x", function(d) { return xScale(new Date(d.key))})
            .attr("y", function(d) { return yScaleC(d.value.number) - 10})
            .style("font-size", 8)
            .style("font-weight", 700)
            .style("text-anchor", "middle")
            .text(function(d){
                return f(d.value.number) })

    thisagg.selectAll(".pathcirc")
        .data(by_month)
        .enter()
            .append("circle")
            .attr("class", "totalnum ce")
            .attr("cx", function(d) { return xScale(new Date(d.key))})
            .attr("cy", function(d) { return yScaleC(d.value.number)})
            .attr("r", 5)
            .style("stroke", "orange")
            .style("stroke-width", 2)
            .style("fill", "white")
            .on("mouseenter", function(d){
                tip.show(d);
            })
            .on("mouseleave", function(d){
                tip.hide(d);
            })

    d3.selectAll(".aggs").on("click", function(){
        thisagg.selectAll(".ce")
            .style("opacity", .2)

        d3.selectAll("." + this.getAttribute("id"))
            .style("opacity", 1)
    })
}*/

function wrapt(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
            }
        }
    });
}

