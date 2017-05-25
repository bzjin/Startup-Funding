var f = d3.format(".1f");
var projection = d3.geoAlbersUsa().scale(1000);
var pathGenerator = d3.geoPath().projection(projection);
var w = $("#map").width(); 

var svg = d3.select("#map").append("svg")
    .attr("width", w)
    .attr("height", 500);

d3.csv("data/raw.csv", function(data) {
		
	
})

d3.json("data/us.json", function (error, rawMap, rawAtlas) {
    states = topojson.feature(rawMap, rawMap.objects.states);  
    showMap();
});

function showMap() {
    svg.selectAll('circle').remove();
    svg.selectAll('text').remove();
    pathGenerator = d3.geoPath().projection(projection);
    
    var paths = svg.selectAll("path.state").data(states.features);
    paths.enter()
    	.append("path")
    	.attr("class", "state")
    	.attr("d", function (state) {
	        return pathGenerator(state);
	    })
}


