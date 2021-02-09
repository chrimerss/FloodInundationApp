// README
// =======================================
// Upload assets to FloodInundation
// Naming: place_event
// Change image property to public, at least for app
// Append set_center variable to get desired view of the panel
// Append images variable to retrieve image
// Good to go!
// Date: 2021.02.07
// Current supported events: [Harvey, 20190508_OKC]
// =======================================

// TODO:
// =======================================
// Add button to supoort downloading images in current view
// Add time slider to support instantaneous depth (not just maximum depth)
// =======================================

var palettes = require('users/gena/packages:palettes');

var set_center = {
  "Houston_Harvey": [-95.3333,29.8686],
  "Houston_Imelda": [-95.3333,29.8686],
  'SpringCreek_Harvey': [-95.45358,30.03938],
  "OKC_20190508": [-97.41125,35.47046],
  "Brazos_20040819": [-95.628930,29.518089],
  "Brazos_20061015": [-95.628930,29.518089],
  "Brazos_20080913": [-95.628930,29.518089],
  "Brazos_20100907": [-95.628930,29.518089],
  "Brazos_20130920": [-95.628930,29.518089]
  
};

var images = {
  'Houston_Harvey': retrieveImage('Houston_Harvey'),
  'Houston_Imelda': retrieveImage('Houston_Imelda'),
  'SpringCreek_Harvey': retrieveImage('SpringCreek_Harvey'),
  "OKC_20190508": retrieveImage('OKC_20190508'),
  "Brazos_20040819": retrieveImage("Brazos_20040819"),
  "Brazos_20061015": retrieveImage("Brazos_20061015"),
  "Brazos_20080913": retrieveImage("Brazos_20080913"),
  "Brazos_20100907": retrieveImage("Brazos_20100907"),
  "Brazos_20130920": retrieveImage("Brazos_20130920"),
};

// Demonstrates before/after imagery comparison with a variety of dates.
function addLayerSelector(mapToChange, rightMap, defaultValue, position) {
  var label = ui.Label('Choose an event');

  // This function changes the given map to show the selected image.
  function updateMap(selection) {
    mapToChange.layers().set(0, ui.Map.Layer(images[selection]));
    var center= set_center[selection];
    mapToChange.setCenter(center[0], center[1], 11)
    var water= ee.Image("JRC/GSW1_2/GlobalSurfaceWater").clip(images[selection].geometry());
    var visualization = {
          bands: ['occurrence'],
          min: 0.0,
          max: 100.0,
          palette: ['ffffff', 'ffbbbb', '0000ff']
            };
    rightMap.addLayer(water,visualization,"water occurence")
    
  }

  // Configure a selection dropdown to allow the user to choose between images,
  // and set the map to update when a user makes a selection.
  var select = ui.Select({items: Object.keys(images), onChange: updateMap});
  select.setValue(Object.keys(images)[defaultValue], true);

  var controlPanel =
      ui.Panel({widgets: [label, select], style: {position: position}});

  mapToChange.add(controlPanel);
}

/*
 * Configure the imagery
 */
 var palettes = require('users/gena/packages:palettes');

// These Sentinel-1 images track the major flooding in Myanmar during the 2018
// monsoon season: https://www.bbc.com/news/world-asia-44962585


// Composite the Sentinel-1 ImageCollection for 7 days (inclusive) after the
// given date.
function retrieveImage(event) {
  var fpath= ee.String('users/chrimerss/FloodInundation/').cat(event).getInfo();
  var img = ee.Image(fpath);
  // Only include the VV polarization, for consistent compositing.
  var palette = palettes.colorbrewer.Blues[9];
  var img_masked = img.mask(img.gt(0.3));
  return img_masked.visualize({min: 0.3, max: 8, palette: palette});
}



/*
 * Set up the maps and control widgets
 */
 
// Create the right map, and have it display layer 1. right map shows normal water condition with Landsat NDWI
var rightMap = ui.Map().setOptions('SATELLITE');
rightMap.setControlVisibility(false);

// Create the left map, and have it display layer 0.
var leftMap = ui.Map().setOptions('SATELLITE');
leftMap.setControlVisibility(false);
var leftSelector = addLayerSelector(leftMap,rightMap, 0, 'top-left');


// var landsat = ee.ImageCollection("LANDSAT/LC08/C01/T1_TOA").filterBounds()


/*
 * Tie everything together
 */

// Create a SplitPanel to hold the adjacent, linked maps.
var splitPanel = ui.SplitPanel({
  firstPanel: leftMap,
  secondPanel: rightMap,
  wipe: true,
  style: {stretch: 'both'}
});

// Set the SplitPanel as the only thing in the UI root.
ui.root.widgets().reset([splitPanel]);
var linker = ui.Map.Linker([leftMap, rightMap]);
// leftMap.setCenter(96.7846, 17.6623, 12);
// ==========================================================
// TODO: button to download image
// function downloadImg() {
//   var viewBounds = ee.Geometry.Rectangle(Map.getBounds());
//   var downloadArgs = {
//     name: 'ee_image',
//     crs: 'EPSG:4326',
//     scale: 10,
//     region: viewBounds.toGeoJSONString()
// };
// var url = img.getDownloadURL(downloadArgs);
// urlLabel.setUrl(url);
// urlLabel.style().set({shown: true});
// }

// var downloadButton = ui.Button('Download viewport', downloadImg);
// var urlLabel = ui.Label('Download', {shown: false});
// var panel = ui.Panel([downloadButton, urlLabel]);
// Map.add(panel);
// ==========================================================

// ==========add legend================
var palette = palettes.colorbrewer.Blues[9]
var viz= {min: 0.3, max: 8, palette: palette}
function createLegend() {
    var legend = ui.Panel({
    style: {
      position: 'bottom-left',
      padding: '8px 15px'
    }
  })

  // Create legend title
  var legendTitle = ui.Label({
    value: 'Depth (m)',
    style: {
      fontWeight: 'bold',
      fontSize: '18px',
      margin: '0 0 4px 0',
      padding: '0'
      }
  });

   // Add the title to the panel
  legend.add(legendTitle); 

  // create text on top of legend
  var panel = ui.Panel({
      widgets: [
        ui.Label(viz['max'])
      ],
    });
  legend.add(panel);

  var lon = ee.Image.pixelLonLat().select('latitude');
  var gradient = lon.multiply((viz.max-viz.min)/100.0).add(viz.min);
  var legendImage = gradient.visualize(viz);
  var thumbnail = ui.Thumbnail({
    image: legendImage, 
    params: {bbox:'0,0,10,100', dimensions:'10x200'},  
    style: {padding: '1px', position: 'bottom-center'}
  });

  // add the thumbnail to the legend
  legend.add(thumbnail);

  // create text on top of legend
  var panel = ui.Panel({
      widgets: [
        ui.Label(viz['min'])
      ],
    });

  legend.add(panel);
  return legend
}

leftMap.add(createLegend());

// Show values onClick
var panel = ui.Panel();
panel.style().set({
  width: '300px',
  position: 'bottom-right'
});
leftMap.add(panel);
leftMap.onClick(function(coords) {
  panel.clear();
  var point = ee.Geometry.Point(coords.lon, coords.lat);
  var chart = ui.Chart.image.regions(image, point, null, 30);
  chart.setOptions({title: 'Depth'});
  panel.add(chart);
});

// Add a panel for description
var table = ui.Chart(
[
  // ['<h4>Flood depth map simulated by CREST-iMAP</h2>'],
  ['<img src=https://github.com/chrimerss/allenslib/blob/master/src/logo_new.png?raw=true width="100%">'],
  ['<img src=https://github.com/chrimerss/allenslib/blob/master/src/logo_hydro.png?raw=true width="30%"></img><img src=https://github.com/chrimerss/allenslib/blob/master/src/logo_OU.png?raw=true width="30%"></img>'],
  ['<p>This app collects flood simulation results using CREST-iMAP</p>'],
  ['<p>Available images:</p>\
  <table class="blueTable">\
<thead>\
<tr>\
<th>Location</th>\
<th>Date (UTC)</th>\
<th>Resolution (m)</th>\
<th>Reference</th>\
</tr>\
</thead>\
<tfoot>\
<tr>\
<td colspan="4">\
<div class="links"><a href="#">&laquo;</a> <a class="active" href="#">1</a> <a href="#">2</a> <a href="#">3</a> <a href="#">4</a> <a href="#">&raquo;</a></div>\
</td>\
</tr>\
</tfoot>\
<tbody>\
<tr>\
<td>Houston</td>\
<td>2017/08/25-2017/09/01</td>\
<td>10</td>\
<td>Li et al., 2021</td>\
</tr>\
</tr>\
<tr>\
<td>Houston</td>\
<td>2019/09/19-2019/09/22</td>\
<td>10</td>\
<td>NA</td>\
</tr>\
<tr>\
<td>Oklahoma City</td>\
<td>20190508-20190523</td>\
<td>10</td>\
<td>NA</td>\
</tr>\
<tr>\
<td>Brazos River</td>\
<td>2004/08/18-2004/08/31</td>\
<td>90</td>\
<td>NA</td>\
</tr>\
<tr>\
<td>Brazos River</td>\
<td>2006/10/15-2006/10/30</td>\
<td>90</td>\
<td>NA</td>\
</tr>\
<tr>\
<td>Brazos River</td>\
<td>2008/09/13-2008/09/25</td>\
<td>90</td>\
<td>NA</td>\
</tr>\
<tr>\
<td>Brazos River</td>\
<td>2010/09/07-2010/09/20</td>\
<td>90</td>\
<td>NA</td>\
</tr>\
<tr>\
<td>Brazos River</td>\
<td>2013/09/20-2013/10/15</td>\
<td>90</td>\
<td>NA</td>\
</tr>\
</tbody>\
</table>'],
['<p>References:</p>'],
['<p>Contact: Allen (Zhi) Li (li1995@ou.edu)</p>']
],
'Table', {allowHtml: true});


var titlePanel = ui.Panel([table], 'flow', {width: '450px', padding: '8px', position:"top-right"});
ui.root.widgets().add(titlePanel);
// ui.root.insert(0, titlePanel);


