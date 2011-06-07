///////////////////////////////////////////////////////////////////			
// generateRandomData
// 
// Create a 2d array of ordered pairs of points. The x values
// increase incrementally while the y values vary randomly from
// 0 to 1.
//
// 	Parameters:
//		-numPoints: The number of points that will be placed in
//                  the array.
//
//  Returns:
//		A 2d array of ordered pairs of points
///////////////////////////////////////////////////////////////////
function generateRandomData(numPoints) {
	var data = []
	for (var i = 0; i < numPoints; i++) {
		data.push([Math.random()*1000,Math.random()]);
	}

	return data;
}

//////////////////////////////////////////////////////////////////
// getDataExtremes
// 
// Given an array of ordered pairs of values, find the minimum
// and maximum values of the domain and range
//
// 	Parameters:
//		-data: A 2d array of ordered pairs of values
//
//  Returns:
//		An object containing the minimum and maximum values of
//      both the domain and range.
///////////////////////////////////////////////////////////////////
function getDataExtremes(data) {
	var extremes = { range: {
		min: Number.MAX_VALUE,
		max: Number.MIN_VALUE
	},
	domain: {
		min: Number.MAX_VALUE,
		max: Number.MIN_VALUE
	}
	};

	// Loop through the data and find the min and max values
	for (var i = 0; i < data.length; i++) {

		// Domain
		if (data[i][0] < extremes.domain.min) {
			extremes.domain.min = data[i][0];
		}
		if (data[i][0] > extremes.domain.max) {
			extremes.domain.max = data[i][0];
		}

		// Range
		if (data[i][1] < extremes.range.min) {
			extremes.range.min = data[i][1];
		}
		if (data[i][1] > extremes.range.max) {
			extremes.range.max = data[i][1];
		}
	}

	return extremes;

}

//////////////////////////////////////////////////////////////////
// getBins
// 
// Given the boundaries of a scatter plot, the plot is broken up
// into a certain number of 'bins'. A given dataset is then iterated
// through and the values of the points that fall into each bin are
// recorded in a 3d array.
//
// 	Parameters:
//		-chart: A reference to the chart where the data is being plotted
//	 -numBinsX: The number of bins that the x-axis is broken into
//	 -numBinsY: The number of bins that the y-axis is broken into
//	 	 -data: A reference to the data set that is being plotted
//
//  Returns:
//		A 2d array containing the number of points in each bin
///////////////////////////////////////////////////////////////////
function getBins(chart,numBinsX,numBinsY,data) {

	// Get the extremes for each axis to determine the vertices of each bin
	var domainExtremes = chart.xAxis[0].getExtremes();
	var rangeExtremes = chart.yAxis[0].getExtremes();

	// Set the width and height of each box
	var binHeight = (domainExtremes.max-domainExtremes.min)/numBinsX;
	var binWidth = (rangeExtremes.max-rangeExtremes.min)/numBinsY;

	// Initalize the 2D array of bins, set inital values to 0
	var bins = new Array(numBinsX);
	for (var i = 0; i < numBinsX; i++) {
		bins[i] = new Array(numBinsY);
	}
	for (var row = 0; row < numBinsX; row++) {
		for (var col = 0; col < numBinsY; col++) {
			bins[row][col] = new Array();
		}
	}

	// Loop through the data points and place each one in the correct bin
	for (var i = 0; i < data.length; i++) {
		// Determine the correct x and y bin to place this data element into
		var xBin = Math.floor(((data[i][0] - domainExtremes.min)/
				(domainExtremes.max-domainExtremes.min))*numBinsX);
		var yBin = Math.floor(((data[i][1] - rangeExtremes.min)/
				(rangeExtremes.max-rangeExtremes.min))*numBinsY);
	
		// Push this data point onto the array of bins in the correct place
		bins[xBin][yBin].push(data[i]);

	}

	return bins;
}

//////////////////////////////////////////////////////////////////
// getIndividualPts
// 
// This function determines which points in a dataset are in a low
// enough density region to be plotted individually.
//
// 	Parameters:
//		-chart: A reference to the chart where the data is being plotted
//	 	 -data: A reference to the data set that is being plotted
//		 -bins: A 2d array of counts of the number of points falling
//              onto each section of the plot
//-maxDensity: The maximum number of points allowed to fall into the
//             same bin before the individual points are no longer shown
//
//  Returns:
//		An array of all of the points to be individually drawn
///////////////////////////////////////////////////////////////////
function getIndividualPts(chart,data,bins,maxDensity) {

	// The individual points that are sparse enough to be plotted
	var pointsToPlot = []

	// Get the extremes for each axis
	var domainExtremes = chart.xAxis[0].getExtremes();
	var rangeExtremes = chart.yAxis[0].getExtremes();

	for (var i = 0; i < data.length; i++) {
		// Figure out which bin this point belongs in
		var xBin = Math.floor(((data[i][0] - domainExtremes.min)/
				(domainExtremes.max-domainExtremes.min))*bins.length);
		var yBin = Math.floor(((data[i][1] - rangeExtremes.min)/
				(rangeExtremes.max-rangeExtremes.min))*bins[0].length);

		// Add this point to the plot list if the bin is not over the density limit
		if (bins[xBin][yBin].length < maxDensity) {
			pointsToPlot.push(data[i]);
		}
	}

	return pointsToPlot;
}

//////////////////////////////////////////////////////////////////
// drawData
// 
// This function draws colored rectangles over the scatter plot
// in areas of high density, and draws individual data points in
// areas of low density.
//
// 	Parameters:
//		-chart: A reference to the chart where the data is being plotted
//		 -bins: A reference to the array of bins that count the number
//                      of data points on each part of the plot
// -sparsePts: Points that are far enough apart to be drawn individually
//-maxDensity: The maximum number of points allowed to fall into the
//             same bin before the individual points are no longer shown
//
//  Returns:
//		An array of every primitive object that was drawn
///////////////////////////////////////////////////////////////////
function drawData(chart,bins,sparsePts,maxDensity,axisInverted) {

	// An array that stores references to all of the primitive objects created
	var primitiveObjects = []

	// Figure out how many pixels large each bin is
	var binPixelWidth = chart.plotWidth/bins.length;
	var binPixelHeight = chart.plotHeight/bins[0].length;
	
	// Find the range of densities in the graph
	var largestDensity = Number.MIN_VALUE;
	for (var i = 0; i < bins.length; i++) {
		for (var j = 0; j < bins[0].length; j++) {
			if (bins[i][j].length > largestDensity) {
				largestDensity = bins[i][j].length;
			}
		}
	}
	var densityRange = largestDensity - maxDensity;

	// Draw the rectangles over areas with high density
	for (var i = 0; i < bins.length; i++) {
		for (var j = 0; j < bins[0].length; j++) {
			if (bins[i][j].length > maxDensity) {
	
				// Scale the opacity of the fill color based on the density
				var fillColor = 'rgba(255,0,0,'+ ((bins[i][j].length - maxDensity)/densityRange) +')';
				
				var xPos = i*binPixelWidth+chart.plotLeft;
				var yPos = chart.plotHeight+chart.plotTop-binPixelHeight-j*binPixelHeight;
				
				if (axisInverted.x) {
					xPos = (chart.plotWidth+chart.plotLeft-binPixelWidth)-i*binPixelWidth;
				}
				if (axisInverted.y) {
					yPos = chart.plotTop+j*binPixelHeight;
				}
										
				primitiveObjects.push(chart.renderer.rect(xPos,yPos,binPixelWidth,binPixelHeight,0)
									.attr({stroke: 'black','stroke-width': 0,fill: fillColor,zIndex: 100}).add());
			}
		}
	}

	// Draw the individual points in areas with low density
	for (var i = 0; i < sparsePts.length; i++) {
	
		var xPos = (sparsePts[i][0]-chart.xAxis[0].getExtremes().min)/
					  (chart.xAxis[0].getExtremes().max-chart.xAxis[0].getExtremes().min)*
				     chart.plotWidth+chart.plotLeft;
		var yPos = chart.plotTop-((sparsePts[i][1]-chart.yAxis[0].getExtremes().max)/
					  (chart.yAxis[0].getExtremes().max-chart.yAxis[0].getExtremes().min)*chart.plotHeight);
					  
		if (axisInverted.x) {
			xPos = -(sparsePts[i][0]-chart.xAxis[0].getExtremes().max)/
					 (chart.xAxis[0].getExtremes().max-chart.xAxis[0].getExtremes().min)*
				    chart.plotWidth+chart.plotLeft;
		}
		if (axisInverted.y) {
			yPos = chart.plotTop+((sparsePts[i][1]-chart.yAxis[0].getExtremes().min)/
					 (chart.yAxis[0].getExtremes().max-chart.yAxis[0].getExtremes().min)*chart.plotHeight);
		}
	
		primitiveObjects.push(chart.renderer.circle(xPos,yPos,4)
							 .attr({fill: '#FCFFC5',stroke: 'black','stroke-width': 1,zIndex: 100}).add());	
	}

	return primitiveObjects;
}
