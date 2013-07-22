var gadgets = {
		ASCIIDataLoader: { 
    name: "ASCII Data Loader",
    fileName: "ASCIIDataLoader.html",
    description: "Create DataSets from text files formatted into columns.",
    author: "Spencer Wallace - spencerw@email.arizona.edu",
    version: "0.1" 
  },
  dataInquirer: { 
    name: "Data Inquirer",
    fileName: "dataInquirer.html",
    description: "Create DataSets from queries to web services and remote databases.",
    author: "Ian Smith - imsmith@uw.edu",
    version: "0.1" 
  },
  astroJsFitsViewer: { 
    name: "AstroJS Fits Viewer",
    fileName: "astroJsFitsViewer.html",
    description: "Display and interact with fits files. Powered by Amit Kapadia's AstroJS FITS parser.",
    author: "Amit Kapadia - amit@zooniverse.com, Spencer Wallace - spencerw@email.arizona.edu",
    version: "0.1"
  },
  skyView: {
    name: "Sky Viewer",
    fileName: "skyView.html",
    description: "Pan, zoom, and plot points across the sky with the Google Earth plugin.",
    author: "Ian Smith - imsmith@uw.edu",
    version: "0.1"
  },
  nameResolver: {
    name: "Name Resolver",
    fileName: "nameResolver.html",
    description: "Resolve a celestial object name into its coordinates.",
    author: "Ian Smith - imsmith@uw.edu",
    version: "0.1"
  },
  dataSetSelector: {
     name: "DataSet Selector",
     fileName: "dataSetSelector.html",
     description: "Change the visibility of DataSets.",
     author: "Spencer Wallace - spencerw@email.arizona.edu",
     version: "0.1"
   },
  histogramView: {
    name: "Histogram",
    fileName: "histogramView.html",
    description: "Create interactive histograms from DataSets.",
    author: "Ian Smith - imsmith@uw.edu",
    version: "0.1"
  },
  plotView: {
    name: "Scatter Plot",
    fileName: "plotView.html",
    description: "Create interactive scatter plots from DataSets.",
    author: "Ian Smith - imsmith@uw.edu",
    version: "0.1"
  },
  scalableScatter: {
    name: "Density Plot",
    fileName: "densityPlot.html",
    description: "Create interactive density plots from DataSets. Useful for visualizing many thousands of points.",
    author: "Spencer Wallace - spencerw@email.arizona.edu",
    version: "0.1"
  },
  tableView: { 
    name: "Table",
    fileName: "tableView.html",
    description: "Display DataSets as a table with movable and sortable columns.",
    author: "Ian Smith - imsmith@uw.edu",
    version: "0.1"
  },
  sciDBCoAdd: { 
    name: "SciDB CoAdd",
    fileName: "sciDBCoAdd.html",
    description: "Builds and Executes CoAdd queries against SciDB, sends results to astroJsFitsViewer in the form of a fits file",
    author: "Matthew Moyers - mmoyers@gmail.com",
    version: "0.1"
  },
  sciDBTimeseries: { 
    name: "SciDB Light Curve",
    fileName: "timeSeries.html",
    description: "Displays Timeseries graphs, connected with astroJsFitsViewer to get boundaries from SciDB CoAdds",
    author: "Matthew Moyers - mmoyers@gmail.com",
    version: "0.1"
  }
  /*
  fitsViewer_PDR: { 
    name: "Fits Viewer PDR",
    fileName: "fitsViewer_PDR.html",
    description: "Display and interact with fits files. This version fetches images from simulated LSST data.",
    author: "Diego Marcos - diego.marcos@gmail.com, Spencer Wallace - spencerw@email.arizona.edu",
    version: "0.1"
  },*/
}

module.exports.all = gadgets;
