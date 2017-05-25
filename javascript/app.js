var f = d3.format(".1f");

d3.csv("data/raw.csv", function(data) {
	data.sort(function(a,b) { 
	    var nameA = a.Openings;
	    var nameB = b.Openings; 
	    if (nameA > nameB) { return -1; }
	    if (nameA < nameB) { return 1; }
	    return 0; 
	})

	margin = {top: 5, right: 20, bottom: 5, left: 20},
	    w = $("#occupations").width(),
	    h = 10000;

	summaries = [];
	summaryNames = [];
	maxEmp14 = [];
	maxEmp24 = [];
	maxPerc = [];
	maxOpenings = [];
	
	data.forEach(function(d){
		if (d.Type == "Summary"){
			summaries.push(d);
			summaryNames.push(d.Name);
			maxEmp14.push(d.Emp14);
			maxEmp24.push(d.Emp24);
			maxPerc.push(d.Dist24);
			maxOpenings.push(d.Openings);
		}
	})

	tf_alpha = 0;
	tf_14 = 0;
	tf_24 = 0; 
	tf_delta = 0;
	tf_openings = 0; 

	makeXY(data);
	makeList(data, summaryNames);
	
})

function makeXY(data){
	var xyo = d3.select("#xyoccupations").append("svg")
		.attr("id", "jobs")
		.attr("width", w)
		.attr("height", 500)

	var tip = d3.tip()
	  .attr('class', 'd3-tip')
	  .offset([0, 10])
	  .html(function(d) {
	    return d.Name + "<br># Jobs 2014: " + d.Emp14 + " (" + d.Dist14 +  "%)<br># Jobs 2024: " + d.Emp14 + " (" + d.Dist24 + "%)" + "<br><br>Job Openings by 2024: " + d.Openings;
	  })

	xyo.call(tip); 

	var y = d3.scaleLinear()
				.domain([0, d3.max(maxEmp24)])
				.range([450, 50])

	var x = d3.scaleLinear()
				.domain([0, d3.max(maxEmp24)])
				.range([50, w-50])

	var xAxis = d3.axisBottom(x).tickSize(-400, 0, 0);
	var yAxis = d3.axisLeft(y).tickSize(-w+100, 0, 0);

	xyo.append("g").attr("class", "axis")
    .attr("transform", "translate(0, 450)")
    .call(xAxis)
  
	xyo.append("g").attr("class", "axis")
    .attr("transform", "translate(50, 0)")
    .call(yAxis)

	var yp = d3.scaleLinear()
				.domain([0, d3.max(maxPerc)])
				.range([450, 50])

	var xp = d3.scaleLinear()
				.domain([0, d3.max(maxPerc)])
				.range([50, w-50])

	xyo.selectAll(".circles")
	    .data(summaries)
	    .enter()
	    .append("circle")
	    .attr("class", "circles")
	    .attr("r", 3)
	    .attr("cx", function(d) { return x(d.Emp24)})
	    .attr("cy", function(d) { return y(d.Emp14)})
	    .style("fill", "orange")
	    .on("mouseenter", function(d) {
	    	d3.select(this)
	    		.attr("r", 7)
	    	tip.show(d)})
	    .on("mouseleave", function(d) {
	    	d3.select(this)
	    		.attr("r", 3)
	    	tip.hide(d)})

	d3.select("#number").on("click", function(){
		d3.selectAll(".circles").remove();
			xyo.selectAll(".circles")
		    .data(summaries)
		    .enter()
		    .append("circle")
	    	.attr("class", "circles")
		    .attr("r", 3)
		    .attr("cx", function(d) { return x(d.Emp24)})
		    .attr("cy", function(d) { return y(d.Emp14)})
		    .style("fill", "orange")
		    .on("mouseenter", function(d) {
	    	d3.select(this)
	    		.attr("r", 7)
	    	tip.show(d)})
	    	.on("mouseleave", function(d) {
	    	d3.select(this)
	    		.attr("r", 3)
	    	tip.hide(d)})
	})

	d3.select("#percent").on("click", function(){
		d3.selectAll(".circles").remove();
			xyo.selectAll(".circles")
		    .data(summaries)
		    .enter()
		    .append("circle")
	    	.attr("class", "circles")
		    .attr("r", 3)
		    .attr("cx", function(d) { return xp(d.Dist24)})
		    .attr("cy", function(d) { return yp(d.Dist14)})
		    .style("fill", "orange")
		    .on("mouseenter", function(d) {
	    	d3.select(this)
	    		.attr("r", 7)
	    	tip.show(d)})
	    	.on("mouseleave", function(d) {
	    	d3.select(this)
	    		.attr("r", 3)
	    	tip.hide(d)})
	})

}

function makeList(data, orderednames){
	var svg = d3.select("#occupations").append("svg")
		.attr("id", "list")
		.attr("width", w)
		.attr("height", h)
		.attr("overflow-y", "scroll")

	var yScale = d3.scalePoint()
				.domain(orderednames)
				.range([50, h])

	var O0 = 440;
	var x0 = O0 + 20; 

	var xEmp = d3.scaleLinear()
				.domain([0, d3.max(maxEmp24)])
				.range([x0, 900])

	var xOpenings = d3.scaleLinear()
				.domain([0, d3.max(maxOpenings)])
				.range([O0, O0 + 100])

	svg.selectAll(".names")
	    .data(summaries)
	    .enter()
	    .append("text")
	    .text(function(d) { return d.Name})
	    .attr("class", "list")
	    .attr("x", 5)
	    .attr("y", function(d) { return yScale(d.Name)})
	    .style("fill", "black")
	    .style("font-weight", 300)
	    .call(wrapt, 300)

	svg.selectAll(".emp14")
	    .data(summaries)
	    .enter()
	    .append("rect")
	    .attr("class", "list")
	    .attr("width", function(d) { return xEmp(d.Emp14)-x0 })
	    .attr("height", 10)
	    .attr("x", x0)
	    .attr("y", function(d) { return yScale(d.Name)-15})
	    .style("fill", "orange")

	svg.selectAll(".emp24")
	    .data(summaries)
	    .enter()
	    .append("rect")
	    .attr("class", "list")
	    .attr("width", function(d) { return xEmp(d.Emp24)-x0 })
	    .attr("height", 10)
	    .attr("x", x0)
	    .attr("y", function(d) { return yScale(d.Name)-2})
	    .style("fill", "steelblue")

	svg.selectAll(".change")
	    .data(summaries)
	    .enter()
	    .append("text")
	    .text(function(d) { return f(d.ChgPerc) + "%"})
	    .attr("class", "list")
	    .attr("x", 400)
	    .attr("y", function(d) { return yScale(d.Name)})
	    .style("fill", function (d) {
	    	if (+d.ChgPerc < 0) { return "red"}
	    	else {return "green"}
	    })
	    .style("font-weight", 700)
	    .style("text-anchor", "end")

	svg.selectAll(".openings")
	    .data(summaries)
	    .enter()
	    .append("text")
	    .text(function(d) { return parseInt(d.Openings)})
	    .attr("class", "list")
	    .attr("x", O0)
	    .attr("y", function(d) { return yScale(d.Name)})
	    .style("fill", "black")
	    .style("font-weight", 700)
	    .style("text-anchor", "end")


d3.select("#alphabetize").on("click", function(){
	d3.selectAll("#list").remove();
	if (tf_alpha == 0) {
		orderednames.sort();
		tf_alpha = 1; 
	} else if (tf_alpha == 1) {
		orderednames.reverse();
		tf_alpha = 0; 
	}

    makeList(summaries, orderednames);
})

d3.select("#number14").on("click", function(){
	d3.selectAll("#list").remove();
	if (tf_14 == 0) {
		summaries.sort(function(a,b) { 
		    var nameA = +a.Emp14;
		    var nameB = +b.Emp14; 
		    if (nameA > nameB) { return -1; }
		    if (nameA < nameB) { return 1; }
		    return 0; 
		})
		tf_14 = 1; 
	} else if (tf_14 == 1) {
		summaries.sort(function(a,b) { 
		    var nameA = +a.Emp14;
		    var nameB = +b.Emp14; 
		    if (nameA < nameB) { return -1; }
		    if (nameA > nameB) { return 1; }
		    return 0; 
		})
		tf_14 = 0; 
	}
	orderednames = [];
	summaries.forEach(function(d){
		if (d.Type == "Summary"){
			orderednames.push(d.Name);
		}
	})
    makeList(summaries, orderednames);
})

d3.select("#number24").on("click", function(){
	d3.selectAll("#list").remove();
	if (tf_24 == 0) {
		summaries.sort(function(a,b) { 
		    var nameA = +a.Emp24;
		    var nameB = +b.Emp24; 
		    if (nameA > nameB) { return -1; }
		    if (nameA < nameB) { return 1; }
		    return 0; 
		})
		tf_24 = 1; 
	} else if (tf_24 == 1) {
		summaries.sort(function(a,b) { 
		    var nameA = +a.Emp24;
		    var nameB = +b.Emp24; 
		    if (nameA < nameB) { return -1; }
		    if (nameA > nameB) { return 1; }
		    return 0; 
		})
		tf_24 = 0; 
	}
	orderednames = [];
	summaries.forEach(function(d){
		if (d.Type == "Summary"){
			orderednames.push(d.Name);
		}
	})
    makeList(summaries, orderednames);
})

d3.select("#change").on("click", function(){
	d3.selectAll("#list").remove();
	if (tf_delta == 0) {
		summaries.sort(function(a,b) { 
		    var nameA = +a.ChgPerc;
		    var nameB = +b.ChgPerc; 
		    if (nameA > nameB) { return -1; }
		    if (nameA < nameB) { return 1; }
		    return 0; 
		})
		tf_delta = 1; 
	} else if (tf_delta == 1) {
		summaries.sort(function(a,b) { 
		    var nameA = +a.ChgPerc;
		    var nameB = +b.ChgPerc; 
		    if (nameA < nameB) { return -1; }
		    if (nameA > nameB) { return 1; }
		    return 0; 
		})
		tf_delta = 0; 
	}
	orderednames = [];
	summaries.forEach(function(d){
		if (d.Type == "Summary"){
			orderednames.push(d.Name);
		}
	})
    makeList(summaries, orderednames);
})

d3.select("#openings").on("click", function(){
	d3.selectAll("#list").remove();
	if (tf_openings == 0) {
		summaries.sort(function(a,b) { 
		    var nameA = +a.Openings;
		    var nameB = +b.Openings; 
		    if (nameA > nameB) { return -1; }
		    if (nameA < nameB) { return 1; }
		    return 0; 
		})
		tf_openings = 1; 
	} else if (tf_openings == 1) {
		summaries.sort(function(a,b) { 
		    var nameA = +a.Openings;
		    var nameB = +b.Openings; 
		    if (nameA < nameB) { return -1; }
		    if (nameA > nameB) { return 1; }
		    return 0; 
		})
		tf_openings = 0; 
	}
	orderednames = [];
	summaries.forEach(function(d){
		if (d.Type == "Summary"){
			orderednames.push(d.Name);
		}
	})
    makeList(summaries, orderednames);
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