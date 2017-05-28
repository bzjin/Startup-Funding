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

var svg1 = d3.select("#industries").append("svg")
    .attr("id", "circles")
    .attr("width", w-400)
    .attr("height", w-400);

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

        /*by_industry.forEach(function(d){
            var thisindustry = {"name": d.key, "children":[]};
            //flare.children.push({"name": d.key, "children":[]})
            var agg = d3.nest()
            .key(function(d) { return d.state_description})
            .rollup(function(leaves) { return {"money_raised": d3.sum(leaves, function(d) {return parseFloat(d.money_raised);})}})
            .entries(d.values)

            agg.forEach(function(j){
                thisindustry.children.push({"name": j.key, "size": j.value.money_raised});
            })
            flare.children.push(thisindustry)
            console.log(JSON.stringify(flare))
        })

        console.log(JSON.stringify(flare))*/

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
        showBars();
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
        //.attr("transform", function(d){
          //  return "scale("+d.raised*20/(d.population*d.area)+")"
        //})

    

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

function showBars() {

var svgc = d3.select("#circles"),
    margin = 20,
    diameter = +svgc.attr("width"),
    g = svgc.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

 var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0, 10])
    .html(function(d) {
      return d.value;
    })

svgc.call(tip);
 
var color = d3.scaleLinear()
    .domain([-1, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl);

var pack = d3.pack()
    .size([diameter - margin, diameter - margin])
    .padding(2);

d3.json("data/flare.json", function(error, root) {
  if (error) throw error;
    
  root = d3.hierarchy(root)
      .sum(function(d) { return d.size; })
      .sort(function(a, b) { return b.value - a.value; });

  var focus = root,
      nodes = pack(root).descendants(),
      view;

  var circle = g.selectAll("circle")
    .data(nodes)
    .enter().append("circle")
      .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
      .style("fill", function(d) { return d.children ? color(d.depth) : null; })
      .on("click", function(d) { zoom(d), d3.event.stopPropagation(); })
      .on("mouseenter", function(d){
        tip.show(d);
      })

  var text = g.selectAll("text")
    .data(nodes)
    .enter().append("text")
      .attr("class", function(d) { return "label depth" + d.depth + " value" + d.value})
      .style("fill-opacity", function(d) { return d.depth === 2 ? 1 : 0; })
      //.style("display", function(d) { return d.depth === 2 ? "inline" : "none"; })
      .text(function(d) { 
        if (d.value > 50000000){
            return d.data.name.toLowerCase(); 
         } else {
            return null; 
         }
        })


  var node = g.selectAll("circle,text");

  //svgc.on("click", function(d) { zoom(d); });
  zoomTo([root.x, root.y, root.r * 2 + margin]);

  function zoom(d) {
    var focus0 = focus; 
    focus = d;
    var level = d.depth + 1; 

    var transition = d3.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween("zoom", function(d) {
          var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
          return function(t) { zoomTo(i(t)); };
        });

    d3.selectAll("text")
      .style("fill-opacity", 0)

    d3.selectAll(".depth" + level)
      .style("fill-opacity", 1)

    /*transition.selectAll("text")
      .filter(function(d) {
          if(!(d === undefined))
          {
            return d.parent === focus || this.style.display === "inline";
          }
        })
        .style("fill-opacity", function(d) {
          if(!(d === undefined))
          {
            return d.parent === focus ? 1 : 0;
          }
         })
        .each("start", function(d) {
          if(!(d === undefined))
          {
            if (d.parent === focus) this.style.display = "inline";
          }
        })
        .each("end", function(d) {
          if(!(d === undefined))
          {
            if (d.parent !== focus) this.style.display = "none";
          }
        });*/
  }

  function zoomTo(v) {
    var k = diameter / v[2]; view = v;
    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
    circle.attr("r", function(d) { return d.r * k; });
  }
});
/*
    var industries = [];
    by_industry.sort(function(a, b){
        var nameA = a.value.min_investment;
        var nameB = b.value.min_investment;
        if (nameA < nameB) { return 1; }
        if (nameA > nameB) { return -1; }
        return 0; 
    })

    by_industry.forEach(function(d){
        if (industries.indexOf(d.key) == -1){
            industries.push(d.key);
        }
    })
     console.log(by_industry)
   /*var xScale = d3.scalePoint()
                .domain(industries)
                .range([50, w - 50])

    var yScale = d3.scaleLinear()
                .domain([0, 70000000000])
                .range([400, 50])

    var yScaleH = d3.scaleLinear()
                .domain([0, 70000000000])
                .range([0, 350])

    var xAxis = d3.axisBottom(xScale).tickSize(0,0,0)
    
    svg1.append("g").attr("class", "axis")
        .attr("transform", "translate(0, 400)")
        .call(xAxis)
        .selectAll("text")
            .style("text-anchor", "end")
            .style("fill", "white")
            .style("font-size", "12px")
            .attr("transform", "rotate(-35)");

    var pinks = ["#fff7f3","#fde0dd","#fcc5c0","#fa9fb5","#f768a1","#dd3497","#ae017e","#7a0177","#49006a"];
    
    svg1.selectAll(".industry")
        .data(by_industry)
        .enter()
            .append("rect")
            .attr("x", function(d){ return xScale(d.key)})
            .attr("y", function(d){ return yScale(d.value.money_raised)})
            .attr("width", 7)
            .attr("height", function(d){ return yScaleH(d.value.money_raised)})
            .style("fill", pinks[7])

    svg1.selectAll(".industry1")
        .data(by_industry)
        .enter()
            .append("rect")
            .attr("x", function(d){ return xScale(d.key)+7})
            .attr("y", function(d){ return yScale(d.value.min_investment)})
            .attr("width", 7)
            .attr("height", function(d){ return yScaleH(d.value.min_investment)})
            .style("fill", pinks[4])

    svg1.selectAll(".industry2")
        .data(by_industry)
        .enter()
            .append("rect")
            .attr("x", function(d){ return xScale(d.key)+14})
            .attr("y", function(d){ return yScale(d.value.offered_for_sale)})
            .attr("width", 7)
            .attr("height", function(d){ return yScaleH(d.value.offered_for_sale)})
            .style("fill", pinks[1])*/
}


