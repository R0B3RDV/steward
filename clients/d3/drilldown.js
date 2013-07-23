/* TODO:

   Monitoring:
   - if more than 5 devices in drilldown, use slider
   - values should be placed within the arc and in a contrasting color

   Control:
   - all!

 */

var actors = {}
  , tags   = {}
  , multiple_arcs = []
  ;

var home = function(state) {
  var a, actor, categories, category, chart, device, devices, div, entry, i, img, message, p, place, prop, span, tag;

  chart = document.getElementById('chart');
  while (chart.lastChild) chart.removeChild(chart.lastChild);
  chart.style.backgroundImage = '';

  message = state.message;
  place = thePlace(message);
  devices = mostDevices(message);
  tags = allTags(message);
  categories = allCategories(message);

  chart = document.getElementById('chart');

  div = document.createElement('div');
  div.setAttribute('class', 'logo');
  img = document.createElement('img');
  img.setAttribute('src', 'images/thing.sys.logo.black.svg');
  div.appendChild(img);
  chart.appendChild(div);

  div = document.createElement('div');
  div.setAttribute('class', 'status');
  div.innerHTML = 'Retrieving list of everything.';
  div.innerHTML = 'Touch a thing for more info.';
  chart.appendChild(div);

  div = document.createElement('div');
  div.setAttribute('id', 'controls-home');
  div.setAttribute('style', 'margin-top: 70px;');
  div.innerHTML = '<div class="big-instructions" style="padding-top: 0px;">We are ready.<br />'
                  + '<span style="color: #666;">Please send instructions.</span></div>'
                  + '<div class="small-instructions">'
                  + '<span style="color:' + place.status + '">' + place.name + '</span>'
                  + ' — updated ' + d3.timestamp.ago(place.updated,true) + '</div>';
  chart.appendChild(div);


  div = document.createElement('div');
  div.setAttribute('class', 'actors');
  chart.appendChild(div);

  for (a = i = 0; i < devices.length; i++) {
    device = devices[i];
    entry = entries[device.deviceType] || entries['default'];
    if ((!entry) || (!entry.img)) continue;

    if ((a > 0) && ((a % 12) === 0)) div.appendChild(document.createElement('p'));
    actor = document.createElement('div');
    actor.setAttribute('class', 'actor' + (a + 1));
    actor.innerHTML = '<p class="actor-name" style="color: ' + statusColor(device) + '">' + device.name + '</p>';
    img = document.createElement('img');
    img.setAttribute('src', entry.img);
    img.setAttribute('style', 'background-color:' + statusColor(device));
    if (!!entry.single) img.setAttribute('onclick', 'javascript:goforw(' + entry.single + ', "' + device.actor + '");');
    actor.appendChild(img);
    div.appendChild(actor);

    actors[device.actor] = device;
    a++;
  }

  div = document.createElement('div');
  div.setAttribute('class', 'tags');
  chart.appendChild(div);
  span = document.createElement('span');
  span.setAttribute('class', 'grouping');
  span.innerHTML = 'tags';
  div.appendChild(span);
  div.appendChild(document.createElement('br'));

  a = 0;
  for (prop in tags) if (tags.hasOwnProperty(prop)) {
    tag = document.createElement('span');
    tag.setAttribute('class', 'tag');
    tag.setAttribute('id', 'tag' + (a + 1));
    tag.setAttribute('onclick', 'javascript:goforw(tag_drilldown, "' + prop + '");');
    tag.innerHTML = prop;
    div.appendChild(tag);
    if (++a >= 12) break;
  }

  div = document.createElement('div');
  div.setAttribute('class', 'wrapper');
  chart.appendChild(div);
  div = document.createElement('div');
  div.setAttribute('class', 'categories');
  chart.appendChild(div);
  span = document.createElement('span');
  span.setAttribute('class', 'grouping');
  span.innerHTML = 'categories';
  div.appendChild(span);
  div.appendChild(document.createElement('br'));

  a = 0;
  for (prop in categories) if (categories.hasOwnProperty(prop)) a++;
  a = (a >= 11) ? 0 : Math.floor((12 - a) / 2);
  for (prop in categories) if (categories.hasOwnProperty(prop)) {
    entry = entries[prop] || entries['default'];
    if ((!entry) || (!entry.img)) continue;

    category = document.createElement('div');
    category.setAttribute('id', 'category' + (a + 1));
    category.setAttribute('class', 'category');
    img = document.createElement('img');
    img.setAttribute('src', entry.img);
    if (!!entry.single) img.setAttribute('onclick', 'javascript:goforw(' + entry.single + ', "' + prop + '");');
    category.appendChild(img);
    p = document.createElement('p');
    p.setAttribute('class', 'actor-name');
    p.innerHTML = prop;
    category.appendChild(p);
    div.appendChild(category);

    if (++a >= 12) break;
  }
};


var device_drilldown = function(name, devices, arcs, instructions) {
  var chart, device, div, div2, entry, i, img, trayLeft, trayPages, trayWidth;
  var iconWidth = 50; // Determine this algorithmically below
  var viewportWidth = iconWidth * 5;
  
  chart = document.getElementById('chart');
  while (chart.lastChild) chart.removeChild(chart.lastChild);
  chart.style.backgroundImage = 'url(images/thing.bkg.svg)';

  if (instructions.length) {
    instructions = '<div class="big-instructions">'
                  + '<span style="color: #666;">Send me instructions.</span>'
                  + '</div>'
                  + '<div class="small-instructions">'
                  + instructions
                  + '</div>';
  }

  div = document.createElement('div');
  div.setAttribute('style', 'position: absolute; top: 20px; left: 20px; margin-bottom: 8px; width: 44px; height: 44px; background-color: #fff;');
  img = document.createElement('img');
  img.setAttribute('src', 'actors/home.svg');
  img.setAttribute('onclick', 'javascript:goback();');
  div.appendChild(img);
  chart.appendChild(div);

  div = document.createElement('div');
  div.setAttribute('id', 'controls');
  div.setAttribute('style', 'margin-top: 40px;');
  if (devices.length > 1) {
    var actor, div3, div4, pager;
    var actorWidth = 50;
    

    multiple_arcs = arcs; //Preserve for redrawing arcs
    arcs = null;
    
    // Arrow elements for multis > 5
    if (devices.length > 5) {
		div3 = document.createElement('div');
		div3.setAttribute('id', 'left-arrow');
		div3.setAttribute('onclick', 'javascript:handleArrow(event)');
		div3.innerHTML = '&larr;';
		div.appendChild(div3);
		
		div3 = document.createElement('div');
		div3.setAttribute('id', 'right-arrow');
		div3.setAttribute('onclick', 'javascript:handleArrow(event)');
		div3.innerHTML = '&rarr;';
		div.appendChild(div3);
    }
    
    // device-viewport and image-tray needed for horizontal scrolling of icons
    div3 = document.createElement('div');
    div3.setAttribute('id', 'device-viewport');
    div3.setAttribute('style', 'position: relative; left:12px; top: 60px; overflow-x: hidden; overflow-y: hidden; width: ' + viewportWidth + 'px; height: 140px;');
    
    div4 = document.createElement('div');
    div4.setAttribute('id', 'image-tray');
    trayWidth = iconWidth * devices.length;
    if (devices.length > 5) {
       trayPages = Math.ceil(trayWidth / viewportWidth);
       trayWidth = iconWidth * 5 * trayPages;
       
       pager = document.createElement('p');
       pager.setAttribute('style', 'position: relative; top: -5px;');
       var pagerElements = '';
       for (i = 0; i < trayPages; i++) {
          if (i == 0) {
             pagerElements = "<span id='bullet" + i + "' class='bullet-on' onclick='javascript:gotoPage(event)'>&bull;</span>";
          } else {
             pagerElements += "<span id='bullet" + i + "' class='bullet-off' onclick='javascript:gotoPage(event)'>&bull;</span>";
          }
       }
       pager.innerHTML = pagerElements;

    }
    trayLeft = (viewportWidth / 2) - (trayWidth / 2);
    trayLeft = (trayLeft < 0) ? 0 : trayLeft;
    div4.setAttribute('style', 'position: relative; height: 107px; width: ' + trayWidth + 'px; left: ' + trayLeft + 'px;');
    
    for (i = 0; i < devices.length; i++) {
      device = devices[i];
      entry = entries[device.deviceType] || entries['default'];
      
      actor = document.createElement('div');
      actor.setAttribute('style', 'position: absolute; top: 10px; left: ' + (i * actorWidth) + 
        'px; text-align: center; width: ' + actorWidth + 'px; height: 107px; overflow: hidden;');
      actor.innerHTML = '<p class="actor-name" style="color: ' + statusColor(device) + '; position: relative; left: 5px; width: 40px; ">' + device.name + '</p>';
      
      img = document.createElement('img');
      img.setAttribute('src', entry.img);
      img.setAttribute('style', 'background-color:' + statusColor(device) + ';');
      img.setAttribute('class', 'actor-grouping');

      if (!!entry.single) img.setAttribute('onclick', 'javascript:goforw(' + entry.single + ', "' + device.actor + '");');
      
      actor.appendChild(img)
      div4.appendChild(actor);
    }
    
    div3.appendChild(div4);    
    div.appendChild(div3);
    
    if (pager) div.appendChild(pager);
    
    div2 = document.createElement('div');
    div2.setAttribute('class', 'multiple-instructions');
    div2.innerHTML = '<span class="actor-name" style="">' + name + '</span>'
                    + '<span>'
                    + instructions
                    + '</span>';
    div.appendChild(div2);
  } else {
    device = devices[0];
    entry = entries[device.deviceType] || entries['default'];
    div.innerHTML = '<img class="actor-big" style="background-color:' + statusColor(device) + ';" src="' + entry.img + '" /><br />'
                    + '<div class="big-instructions">'
                    + '<span class="actor-name" style="color:' + statusColor(device) + ';">' + name + '</span>'
                    + instructions
                    + '</div>';
    div3 = document.createElement('div');
    div3.setAttribute('class', 'small-instructions');
    div3.setAttribute('style', 'cursor: pointer');
    div3.setAttribute('onclick', 'javascript:showPop(' + JSON.stringify(device) + ',' + JSON.stringify(entry) + ');');
    div3.innerHTML = 'Adjust device settings...';
    div.appendChild(div3);
  }
  chart.appendChild(div);
  
  drawArcs(arcs);
}

var drawArcs = function(arcs) {
  var arcText, arcz, chart, div, i, index, limit, labels, trayLeft, values;
    
  chart = document.getElementById("chart");
  if (document.getElementById("arcCanvas")) {
     chart.removeChild(document.getElementById("labels"));
//     chart.removeChild(document.getElementById("readings"));
    chart.removeChild(document.getElementById("arcCanvas"));
  }

  div = document.createElement('div');
  div.setAttribute('id', 'labels');
  div.setAttribute('style',
                   'position: absolute; top: 52px; left: 178px; width: 200px; height: 240px; text-align: right; font-weight: normal;');
  labels = '';
//  values = '';
  arcz = [];
  if (!arcs) arcs = multiple_arcs;
  
  trayLeft = parseInt($("#image-tray").css("left"), 10);
  if (isNaN(trayLeft) | arcs.length < 5) {
    i = 0;
    limit = arcs.length;
  } else {
    i = Math.abs(trayLeft) / 50;
    limit = ((i + 5) > arcs.length) ? arcs.length : (i + 5);
  }
  
  index = 0.7; // Reassign index values for arcs subset
  for (; i < limit; i++) {
     labels += arcs[i].label + '<br />';
//     values += '<div class="label">' + arcs[i].cooked + '</div>';
    arcs[i].index = index;
    arcz.push(arcs[i]);
    index -= 0.1;
  }
  arcs = arcz;

  div.innerHTML = '<div class="labels" style="white-space: nowrap; width: 190px; overflow: hidden; -o-text-overflow: ellipsis; text-overflow: ellipsis; ">' + labels + '</div>';
  chart.appendChild(div);
// 
// Replaced by arced text below
//   div = document.createElement('div');
//   div.setAttribute('id', 'readings');
//   div.setAttribute('style',
//                    'position: absolute; top: 56px; left: 392px; font-size: 12px; font-weight: normal; text-align: left; color: #fff;');
//   div.innerHTML = '<div class="labels">' + values + '</div>';
//   chart.appendChild(div);


// Based on http://vis.stanford.edu/protovis/ex/chart.html
// with an assist from arctween.js

  var w = 758,
      h = 758,
      r = Math.min(w, h) / 1.8,
      s = 0.09,
      color = d3.scale.ordinal()                // based on Status Board palette
      .range(["#9b00c1", "#006be6", "#009e99", "#00ba00", "#fc6a00", "#ffc600", "#ff3000"]);

  
  var arc = d3.svg.arc()
      .startAngle(0)
      .endAngle(function(d) { return d.value * 2 * Math.PI; })
      .innerRadius(function(d) { return d.index * r; })
      .outerRadius(function(d) { return (d.index + s) * r; });

  var arc2 = d3.svg.arc()
      .startAngle(0)
      .endAngle(function(d) { return 1.9999 * Math.PI; })
      .innerRadius(function(d) { return d.index * r; })
      .outerRadius(function(d) { return (d.index + s) * r; });

  var vis = d3.select("#chart").append("svg")
      .attr("width", w)
      .attr("height", h)
      .attr("id", "arcCanvas")
        .append("g")
      .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

  var g = vis.selectAll("g")
      .data(function() { return arcs; })
    .enter().append("g");

// Commented code part of attempt to animate/bounce arc drawing. To be continued...
//   var path = g.selectAll("path")
//   	  .data(arcz.filter(function(d) { return d.value; }), function(d) { return d.name; });
//  
//   path.enter().append("path")
//       .transition()
//       .ease("elastic")
//       .duration(1000)
//       .attrTween("d", arcTween);
//  
//   path.transition()
//       .ease("elastic")
//       .duration(1000)
//       .attrTween("d", arcTween);
//  
//   path.exit().transition()
//       .ease("bounce")
//       .duration(1000)
//       .attrTween("d", arcTween)
//       .remove();
 
//   var path = vis.append("path")
//       .attr("id", function(d,i){return "a"+i;})
//       .attr("d", circle);
      
  g.append("path")
      .style("fill", function(d, i) { return ((!!d.color) ? d.color : color(i)); })
      .attr("d", arc);
  
  var g2 = g.append("path")
      .style("fill", "none")
      .style("stroke", "none")
      .attr("id", function(d,i){return "a"+i;})
      .attr("d", arc2);  
    
    // readings
	var text = g.append("text")
		.attr("text-anchor", "start")
		.attr("dx", 4)
		.attr("dy", 24)
		.style("font-family", "Roadgeek 2005 Series D")
		.style("font-size", "12px")
		.style("color", "#fff");
		
	text.append("textPath")
		.attr("stroke", "none")
		.attr("fill","white")
		.attr("xlink:href",function(d,i){return "#a"+i;})
		.text(function(d,i){ return convertSymbol(d.cooked) });
           
	// labels
// 	var text2 = g.append("text")
// 		.attr("text-anchor", "end")
// 		.attr("dx", 75)
// 		.attr("dy", 24)
// 		.style("font-family", "Roadgeek 2005 Series D")
// 		.style("font-size", "12px")
// 		.style("color", "#fff");
// 		
// 	text2.append("textPath")
// 		.attr("stroke","none")
// 		.attr("fill","white")
// 		.attr("startOffset", "50%")
// 		.attr("xlink:href",function(d,i){return "#a"+i;})
// 		.text(function(d,i){ return convertSymbol(d.label) });
	
    
//   function arcTween(b) {
//     var i = d3.interpolate( {value: b.start}, b);
//     return function(t) {
//       return arc(i(t));
//     };
//  }

	function convertSymbol(txt) {
		var re = /\&deg;/gi;
		txt = txt.replace(re, "°");
		re = /\<sup\>2\<\/sup\>/gi;
		txt = txt.replace(re, "²");
		re = /\<sub\>2\<\/sub\>/gi;
		txt = txt.replace(re, "₂");
		return txt;
	}

};


var single_device_drilldown = function(state, arcs, instructions) {
  var device;

  device = actors[state.actor];
  device_drilldown(device.name, [ device ], arcs || single_device_arcs(device),
                   instructions || single_device_instructions(device));
};

var single_device_arcs = function(device) {
  var arcs, brightness, color, delta, level, now;

  arcs = [];

  now = new Date().getTime();
  delta = clip2bars(now - (new Date(device.updated).getTime()), 0, 86400 * 1000);
  arcs.push({ name   : 'updated'
            , raw    : device.updated
            , label  : 'TIME'
            , cooked : d3.timestamp.ago(device.updated)
            , value  : delta
            , index  : 0.70
            });

  color = statusColor(device);
  switch (device.status) {
    case 'red':
    case 'error':
    case 'reset':
      arcs.push({ name   : 'status'
                , raw    : device.status
                , color  : color
                , label  : 'STATUS'
                , cooked : device.status
                , value  : 0.10
                , index  : 0.60
                });
     break;

    case 'indigo':
    case 'absent':
    case 'busy':
    case 'waiting':
      arcs.push({ name   : 'status'
                , raw    : device.status
                , color  : color
                , label  : 'STATUS'
                , cooked : device.status
                , value  : 0.20
                , index  : 0.60
                });
     break;

    case 'blue':
    case 'recent':
      arcs.push({ name   : 'status'
                , raw    : device.status
                , color  : color
                , label  : 'STATUS'
                , cooked : device.status
                , value  : 0.35
                , index  : 0.60
                });
     break;

    case 'off':
    case 'on':
      brightness = device.info.brightness;
      level = device.info.level || device.info.brightness;
      arcs.push({ name   : 'status'
                , raw    : device.status
                , color  : color
                , label  : (!level) ? 'STATUS' : (!brightness) ? 'LEVEL' : 'BRIGHTNESS'
                , cooked : (!!level) ? (level + '%') : device.status
                , value  : ((device.status === 'off') ? 0.0 : (!!level) ? level / 200 : 0.5)
                , index  : 0.60
                });
      break;

    case 'motion':
    case 'quiet':
      arcs.push({ name   : 'status'
                , raw    : device.status
                , color  : color
                , label  : 'STATUS'
                , cooked : device.status
                , value  : (!!device.info.lastSample) ? delta : 0.50
                , index  : 0.60
                });
      break;

    default:
      arcs.push({ name   : 'status'
                , raw    : device.status
                , color  : color
                , label  : 'STATUS'
                , cooked : device.status
                , value  : 0.50
                , index  : 0.60
                });
      break;
  }

  return arcs;
};

var single_device_instructions = function(device) {
  var instructions;

  switch (device.status) {
    case 'present':
     return 'send alert';

    case 'off':
      return 'turn on';

    case 'on':
      instructions = 'turn off';
      if (!!device.info.level) instructions += '<br/>adjust power';
      return instructions;

    default:
      return '';
  }
};


var single_gateway_drilldown   = single_device_drilldown;
var gateway_device_arcs        = single_device_arcs;
var single_indicator_drilldown = single_device_drilldown;
var indicator_device_arcs      = single_device_arcs;
var single_presence_drilldown  = single_device_drilldown;
var presence_device_arcs       = single_device_arcs;
var single_motion_drilldown    = single_device_drilldown;
var motion_device_arcs         = single_device_arcs;
var single_switch_drilldown    = single_device_drilldown;
var switch_device_arcs         = single_device_arcs;
var single_wearable_drilldown  = single_device_drilldown;
var wearable_device_arcs       = single_device_arcs;


var single_climate_drilldown = function(state) {
  var device = actors[state.actor];

  device_drilldown(device.name, [ device ], climate_device_arcs(device),
                   'show data for last week<br />' + 'show forecast for next week');
};

var climate_device_arcs = function(device) {
  var arcs, now, prop, v;

  arcs = [];

  for (prop in device.info) {
    if (!device.info.hasOwnProperty(prop)) continue;

    v = device.info[prop];
    switch (prop) {
      case 'lastSample':
        now = new Date().getTime();
        arcs.splice(0, 0, { name   : prop
                          , raw    : v
                          , label  : 'TIME'
                          , cooked : d3.timestamp.ago(v)
                          , value  : clip2bars(now - (new Date(v).getTime()), 0, 86400 * 1000)
                          , index  : 0.70
                          });
        break;

      case 'temperature':
        arcs.splice(1, 0, { name   : prop
                          , raw    : v
                          , label  : 'TEMPERATURE'
                          , cooked : v + '&deg;C' + ' / ' + ((v * 1.8) + 32).toFixed(2) + '&deg;F'
                          , value  : clip2bars(v, 18, 28)
                          , index  : 0.60
                          });
        break;

      case 'humidity':
        arcs.splice(2, 0, { name   : prop
                          , raw    : v
                          , label  : 'HUMIDITY'
                          , cooked : v + '%'
                          , value  : clip2bars(v, 21,  70)
                          , index  : 0.50
                          });
        break;

      case 'co2':
        arcs.splice(3, 0, { name   : prop
                          , raw    : v
                          , label  : 'CO<sup>2</sup>'
                          , cooked : v + 'ppm'
                          , value  : clip2bars(v,  0, 1200)
                          , index  : 0.40
                          });
        break;

      case 'noise':
        arcs.splice(4, 0, { name   : prop
                          , raw    : v
                          , label  : 'NOISE'
                          , cooked : v + 'dB'
                          , value  : clip2bars(v, 0, 70)
                          , index  : 0.30
                          });
        break;

      case 'pressure':
        arcs.splice(5, 0, { name   : prop
                          , raw    : v
                          , label  : 'PRESSURE'
                          , cooked : v + 'mb'
                          , value  : clip2bars(v, 980,  1060)
                          , index  : 0.20
                          });
        break;

      default:
        continue;
    }
  }

  return arcs;
};

var clip2bars = function(v, min, max) {
  if (v < min) v = min;
  else if (v > max) v = max;

  return ((v - min) / ((max -min) * 2));
};


// temporary...
var single_nest_drilldown = single_climate_drilldown;
var device_nest_arcs      = climate_device_arcs;


var single_lighting_drilldown = function(state) {
  var device, instructions;

  device = actors[state.actor];
  instructions = (device.status === 'off') ? 'turn on' : 'turn off';
  if (device.status === 'on') {
    if (!!device.info.brightness) instructions += '<br/>adjust brightness';
    if ((!!device.info.color) && (!device.info.color.fixed)) instructions += '<br/>adjust color';
  }

  device_drilldown(device.name, [ device ], lighting_device_arcs(device), instructions);
};

var lighting_device_arcs = single_device_arcs;



var category_drilldown = function(state, prefix) {
  var actor, device, entry, members;

  members = [];
  for (actor in actors) {
    if (!actors.hasOwnProperty(actor)) continue;

    device = actors[actor];
    if (device.deviceType.indexOf(prefix) !== 0) continue;
    entry = entries[device.deviceType] || entries['default'];
    if ((!entry) || (!entry.arcs)) continue;

    members.push(device);
  }

  multiple_drilldown(state.actor, members);
};

var category_climate_drilldown = function(state) {
  category_drilldown(state, '/device/climate/');
};

var category_gateway_drilldown = function(state) {
  category_drilldown(state, '/device/gateway');
};

var category_indicator_drilldown = function(state) {
  category_drilldown(state, '/device/indicator');
};

var category_lighting_drilldown = function(state) {
  category_drilldown(state, '/device/lighting');
};

var category_media_drilldown = function(state) {
  category_drilldown(state, '/device/media');
};

var category_motive_drilldown = function(state) {
  category_drilldown(state, '/device/motive');
};

var category_presence_drilldown = function(state) {
  category_drilldown(state, '/device/presence');
};

var category_sensor_drilldown = function(state) {
  category_drilldown(state, '/device/sensor');
};

var category_switch_drilldown = function(state) {
  category_drilldown(state, '/device/switch');
};

var category_tricorder_drilldown = function(state) {
  category_drilldown(state, '/device/tricorder');
};

var category_wearable_drilldown = function(state) {
  category_drilldown(state, '/device/wearable');
};


var tag_drilldown = function(state) {
  var device, entry, group, i, members;

  group = tags[state.actor];
  if (!group) return;

  members = [];
  for (i = 0; i < group.length; i++) {
    device = group[i];
    entry = entries[device.deviceType] || entries['default'];
    if ((!entry) || (!entry.arcs)) continue;

    members.push(device);
  }

  multiple_drilldown(state.actor, members);
};


var set_multiple_labels_and_arcs = function() {

}

var multiple_drilldown = function(name, members) {
  var arc, arcs, arcz, device, devices, entry, i, index; 

  arcs = [];
  devices = [];
  index = 0.7;
  for (i = 0; i < members.length; i++) {
    device = members[i];
    entry = entries[device.deviceType] || entries['default'];

    arcz = entry.arcs(device);

    arc = arcz[1];
    arc.id  = device.deviceType.split('/')[3] + ' ' + device.actor.split('/')[1];
    arc.label = device.name;
    arc.index = index;
    index -= 0.1;
    arcs.push(arc);

    devices.push(device);
//    if (devices.length >= 5) break;
  }

  switch (devices.length) {
    case 0:
      break;

    case 1:
      device = devices[0];
      entry = entries[device.deviceType] || entries['default'];
      if (!!entry.single) entry.single({ page: entry.single, actor: device.actor });
      break;

    default:
      device_drilldown(name, devices, arcs, 'touch a thing to manage it');
      break;
  }
};

// managing multi-drilldown icon display and control

var handleArrowVisibility = function() {
	var viewPortWidth = parseInt($("#image-tray").offsetParent().css("width"), 10);
	var trayWidth = parseInt($("#image-tray").css("width"), 10);
	var trayLeft = parseInt($("#image-tray").css("left"), 10);
    var trayPage = Math.abs(trayLeft / viewPortWidth);
    document.getElementById("bullet" + trayPage).className = "bullet-on";
    
	if (trayLeft >= "0") {
		$("#right-arrow").hide();
	} else {
		$("#right-arrow").show();
	}
	if (trayWidth + trayLeft <= viewPortWidth) {
		$("#left-arrow").hide();
	} else {
		$("#left-arrow").show();
	}

}

var gotoPage = function(evt) {
    if (evt.target.className == "bullet-off") {
    	var viewPortWidth = parseInt($("#image-tray").offsetParent().css("width"), 10);
		var pageNum = evt.target.id.slice(6);
		var leftEnd = -(pageNum * viewPortWidth);
		var leftStart = parseInt($("#image-tray").css("left"), 10);
		var scrollAmount = leftStart - leftEnd;
		//"+=" + scrollAmount
		
		$("#image-tray").animate({
			"left": leftEnd + "px"
		}, {
			complete: function() {
			    clearPager();
			    drawArcs();
		        handleArrowVisibility();
		    }
		});
    }
}

var clearPager = function() {
    var i = 0;
    while (document.getElementById("bullet" + i)) {
       document.getElementById("bullet" + i).className = "bullet-off";
       i++;
    }
}

var handleArrow = function(evt) {
	var scrollAmount = $("#device-viewport").outerWidth(true);
	clearPager();
	
	if (evt.target.id === "left-arrow") {
		$("#image-tray").animate({
			"left": "-=" + scrollAmount
		}, {
			complete: function() {
				drawArcs();
				handleArrowVisibility();
			}
		
		});
	} else {
		$("#image-tray").animate({
			"left": "+=" + scrollAmount
		}, {
			complete: function() {
				drawArcs();
				handleArrowVisibility();
			}
		});
	}
}



/*
  drone.svg
  ecobee.svg
  home.svg
  insteon-water.svg
  motrr.svg
  romo.svg
  swivl.svg
  ti-sensor.svg
  veralite.svg
  wemo.svg
 */

var entries = {
// actors
                '/device/climate/nest/control'              : { img     : 'actors/nest.svg'
                                                              , single  : single_nest_drilldown
                                                              , arcs    : device_nest_arcs
                                                              }
              , '/device/climate/netatmo/sensor'            : { img     : 'actors/netatmo.svg'
                                                              , single  : single_climate_drilldown
                                                              , arcs    : climate_device_arcs
                                                              }
              , '/device/climate/oregon-scientific/sensor'  : { img     : 'actors/oregon-scientific.svg'
                                                              , single  : single_climate_drilldown
                                                              , arcs    : climate_device_arcs
                                                              }
              , '/device/gateway/insteon/hub'               : { img     : 'actors/insteon-hub.svg'
                                                              , single  : single_gateway_drilldown
                                                              , arcs    : gateway_device_arcs
                                                              }
              , '/device/gateway/insteon/smartlinc'         : { img     : 'actors/smart-linc.svg'
                                                              , single  : single_gateway_drilldown
                                                              , arcs    : gateway_device_arcs
                                                              }
              , '/device/gateway/netatmo/cloud'             : { img     : 'actors/netatmo.svg'
                                                              , single  : single_gateway_drilldown
                                                              , arcs    : gateway_device_arcs
                                                              }
              , '/device/gateway/rfxrec433/usb'             : { img     : 'actors/rfxcom.svg'
                                                              , single  : single_gateway_drilldown
                                                              , arcs    : gateway_device_arcs
                                                              }
              , '/device/gateway/sonos/bridge'              : { img     : 'actors/sonos-bridge.svg'
                                                              , single  : single_gateway_drilldown
                                                              , arcs    : gateway_device_arcs
                                                              }
              , '/device/gateway/zigbee/gmo'                : { img     : 'actors/q53.svg'
                                                              , single  : single_gateway_drilldown
                                                              , arcs    : gateway_device_arcs
                                                              }
              , '/device/indicator/text/cosm'               : { img     : 'actors/xively.svg'
                                                              , single  : single_indicator_drilldown
                                                              , arcs    : indicator_device_arcs
                                                              }
              , '/device/indicator/text/prowl'              : { img     : 'actors/prowl.svg'
                                                              , single  : single_indicator_drilldown
                                                              , arcs    : indicator_device_arcs
                                                              }
              , '/device/indicator/text/status'             : { img     : 'actors/HTML5.svg'
                                                              , single  : single_indicator_drilldown
                                                              , arcs    : indicator_device_arcs
                                                              }
              , '/device/lighting/blink1/led'               : { img     : 'actors/blink1.svg'
                                                              , single  : single_lighting_drilldown
                                                              , arcs    : lighting_device_arcs
                                                              }
              , '/device/lighting/blinkstick/led'           : { img     : 'actors/blinkstick.svg'
                                                              , single  : single_lighting_drilldown
                                                              , arcs    : lighting_device_arcs
                                                              }
              , '/device/lighting/hue/led'                  : { img     : 'actors/hue.svg'
                                                              , single  : single_lighting_drilldown
                                                              , arcs    : lighting_device_arcs
                                                              }
              , '/device/lighting/insteon/led'              : { img     : 'actors/insteon-led.svg'
                                                              , single  : single_lighting_drilldown
                                                              , arcs    : lighting_device_arcs
                                                              }
              , '/device/lighting/robosmart/led'            : { img     : 'actors/robosmart.svg'
                                                              , single  : single_lighting_drilldown
                                                              , arcs    : lighting_device_arcs
                                                              }
              , '/device/media/sonos/audio'                 : { img     : 'actors/sonos-playbar.svg'
                                                              , single  : null
                                                              , arcs    : null
                                                              }
              , 'device/device_arcsfob/hone'                : { img     : 'actors/hone.svg'
                                                              , single  : single_presence_drilldown
                                                              , arcs    : presence_device_arcs
                                                              }
              , '/device/presence/fob/inrange'              : { img     : 'actors/philips-inrange.svg'
                                                              , single  : single_presence_drilldown
                                                              , arcs    : presence_device_arcs
                                                              }
              , '/device/presence/fob'                      : { img     : 'actors/hipkey.svg'
                                                              , single  : single_presence_drilldown
                                                              , arcs    : presence_device_arcs
                                                              }
              , '/device/sensor/wemo/motion'                : { img     : 'actors/wemo-sensor.svg'
                                                              , single  : single_motion_drilldown
                                                              , arcs    : motion_device_arcs
                                                              }
              , '/device/switch/insteon/dimmer'             : { img     : 'actors/insteon-dimmer.svg'
                                                              , single  : single_switch_drilldown
                                                              , arcs    : switch_device_arcs
                                                              }
              , '/device/switch/insteon/onoff'              : { img     : 'actors/insteon-plug.svg'
                                                              , single  : single_switch_drilldown
                                                              , arcs    : switch_device_arcs
                                                              }
              , '/device/switch/wemo/onoff'                 : { img     : 'actors/wemo-plug.svg'
                                                              , single  : single_switch_drilldown
                                                              , arcs    : switch_device_arcs
                                                              }
              , '/device/wearable/watch/cookoo'             : { img     : 'actors/cookoo.svg'
                                                              , single  : single_wearable_drilldown
                                                              , arcs    : wearable_device_arcs
                                                              }
              , '/device/wearable/watch/metawatch'          : { img     : 'actors/metawatch.svg'
                                                              , single  : single_wearable_drilldown
                                                              , arcs    : wearable_device_arcs
                                                              }
              , 'default'                                   : { img     : 'actors/t.svg'
                                                              , single  : single_device_drilldown
                                                              , arcs    : single_device_arcs
                                                              }

// categories
              , climate                                     : { img     : 'categories/climate.svg'
                                                              , single  : category_climate_drilldown
                                                              }
              , gateway                                     : { img     : 'categories/gateway.svg'
                                                              , single  : category_gateway_drilldown
                                                              }
              , indicator                                   : { img     : 'categories/indicator.svg'
                                                              , single  : category_indicator_drilldown
                                                              }
              , lighting                                    : { img     : 'categories/lighting.svg'
                                                              , single  : category_lighting_drilldown
                                                              }
              , media                                       : { img     : 'categories/media.svg'
                                                              , single  : category_media_drilldown
                                                              }
              , motive                                      : { img     : 'categories/motive.svg'
                                                              , single  : category_motive_drilldown
                                                              }
              , presence                                    : { img     : 'categories/presence.svg'
                                                              , single  : category_presence_drilldown
                                                              }
              , sensor                                      : { img     : 'categories/sensor.svg'
                                                              , single  : category_sensor_drilldown
                                                              }
              , 'switch'                                    : { img     : 'categories/switch.svg'
                                                              , single  : category_switch_drilldown
                                                              }
              , tricorder                                   : { img     : 'categories/tricorder.svg'
                                                              , single  : category_tricorder_drilldown
                                                              }
              , wearable                                    : { img     : 'categories/wearable.svg'
                                                              , single  : category_wearable_drilldown
                                                              }
              };
