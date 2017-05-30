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

var color = d3.scaleQuantize()
            .domain([0, 1000])
            .range(["#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#006837","#004529"])

d3.queue()
    .defer(d3.csv, "data/raw.csv")
    .defer(d3.json, "data/us.geojson")
    .defer(d3.csv, "data/statedata.csv")
    .awaitAll(function(error, results){ 
        var flare = { "name": "flare", "children": []};

        data = results[0];
        by_state = d3.nest()
        .key(function(d) { return d.state; })
        .entries(data);

        by_industry = d3.nest()
        .key(function(d) { return d.industry})
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

        states = results[1];
        statedata = results[2];

        states.features.forEach(function(d){
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

        states.features.forEach(function(d){
            by_state.forEach(function(j){
                if (d.properties.name.toUpperCase() == j.key){
                    d.count = j.values.length;
                    }                
              })
        })

        showMap();
        showBars("Agriculture");

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
        .style("fill", "white")
        .style("font-size", 12)
        .text("Dollars Raised per Person")

    for (i=0; i<7; i++){
        svg.append("rect")
            .attr("x", 10)
            .attr("y", 130 + ((i+2)*20))
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", color(i*160))

        svg.append("text")
            .attr("x", 35)
            .attr("y", 145 + ((i+2)*20))
            .style("fill", "black")
            .style("font-size", 12)
            .text(function(){
                if (i != 6) {
                    return "> $" + i*160 + "-$" + (i+1)*160;
                }else if (i == 6){
                    return "> $" + i*160
                }
            })
    }

    var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0, 10])
    .html(function(d) {
      return "<h4 style='color:#76EE00'>" + d.properties.name +"</h4><p>Money Raised: $" + f(d.raised) + "<br> Minimum Investment: $" + f(d.min_invest) + "<br> For Sale: $" + f(d.for_sale) + "<br>Money Raised per Person: $" + parseInt(d.raised/d.population) + "</p>";
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
    
    var paths = svg.selectAll("path.state").data(states.features);
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
                .style("stroke", "#76EE00")
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

    var yScale = d3.scaleLinear()
                .domain([0, d3.max(findmax)])
                .range([180, 10])

    var yScaleH = d3.scaleLinear()
                .domain([0, d3.max(findmax)])
                .range([0, 170])

    var xAxis = d3.axisBottom(xScale).tickSize(0,0,0)
    var yAxis = d3.axisLeft(yScale);

    svgs.selectAll(".states")
        .data(states.features)
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
                .style("stroke", "#76EE00")
                .style("stroke-width", 2)
        })
        .on("mouseleave", function(d){
            tip.hide(d);
            d3.selectAll("#" + d3.select(this).attr("id"))
                .style("stroke", "none")
                .style("stroke-width", 0)
        })

    svgs.selectAll(".abbrev")
        .data(states.features)
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
            .style("fill", "green")

        thisindustry.append("text")
            .attr("x", -180)
            .attr("y", 0)
            .text("Money Raised")
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
                    .domain([new Date(2015, 5, 1), new Date()])
                    .range([40, w - 40])

        var yScale = d3.scaleLinear()
                    .domain([0, d3.max(findmax)])
                    .range([280, 30])

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
            .attr('transform', 'translate(0, 280)')
            .call(xAxis)
                .selectAll('text')
                .style("font-size", 10)
                .style("fill", "black")

        thisindustry.append('g').attr('class', 'axis')
            .attr('transform', 'translate(40, 0)')
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
                .style("font-size", 10)
                .call(wrapt, 90)
    }
    })

}

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

