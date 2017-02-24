var map;
var geocoder;
var points = new Array(0);
var areacontainer = new Array(0);
var areacontainer_current;
var areaPath = new Array(0);
var areaPath2 = new Array(0);
var polygon = new Array(0);
var areaMarkers = new Array(0);
var areaAnchors = new Array(0);
var areaRotators = new Array(0);
var rotatorLines = new Array(0);
var lineColor = '#9BB653';
var fillColor = '#00ff00';
var lineWidth = 2;
var lineOpacity = 1.0;
var fillOpacity = 0.2;
var radiansPerDegree = Math.PI / 180.0;
var degreesPerRadian = 180.0 / Math.PI;
var earthRadiusMeters = 6367460.0;
var metersPerDegree = 2.0 * Math.PI * earthRadiusMeters / 360.0;
var metersPerKm = 1000.0;
var meters2PerHectare = 10000.0;
var feetPerMeter = 3.2808399;
var feetPerMile = 5280.0;
var acresPerMile2 = 640;
var totalarea = 0;
var readonly = false;
var overlay;
var projection;
var polygon_context_menu;
var marker_index_context_menu;
var marker_number_context_menu;
var polyline_index_context_menu;
var polyline_number_context_menu;
var readonly_ran = false;
var areacontainer_labels = new Array(0);
var areacontainer_types = new Array(0);
var areacontainer_toggle = new Array(0);
var search_marker = null;

$(document).ready(function(){
	
	//if(id!='')
		//$("#slideout-menu").hide();
	
	$( "#tabs" ).tabs();
	
	$("button").button();
	
	$("#delete-dialog, #delete-all-dialog, #save-dialog, #shape-dialog, #rotate-dialog, #instructions-dialog, #file-dialog, #setAreaLabel-dialog, #setLineLength-dialog").dialog({
		autoOpen: false, 
		modal: true, 
		resizable:false,
		open: function(event, ui){
			$(window).trigger('resize');
		},
		close: function(event, ui){
			$(window).trigger('resize');
		}
	});
	
	$("#type").change(function(){
		$(".shape").hide();
		var type = $("#type").val();
		$("#"+type).show();
	}).trigger('change');
	
	$(".shape input").val('');
	
	$(".shape input").numeric({ negative: false });
	
	$("#rotate-dialog input").numeric({negative: false});
	
	
	
	initialize_map();
	
	initializePolygonMenu();
	initializeMarkerMenu();
	initializePolylineMenu();
	initializeSearchMarkerMenu();
	
	
	$("#address").watermark('Your Address');
	
	$("#address").val('');
	
	$("#address").autocomplete({
	      source: function(request, response) {	    	                            
  	        geocoder.geocode( {'address': request.term }, function(results, status) {
  	        	if(results != null){
  	        		dataConv = $.map(results, function(item) {
  		            return {
  		            	id: '',
  		              label:  item.formatted_address,
  		              value: item.formatted_address,
  		              latitude: item.geometry.location.lat(),
  		              longitude: item.geometry.location.lng(),
  		              southwest: item.geometry.viewport.getSouthWest(),
  		              northeast: item.geometry.viewport.getNorthEast()  		              					  							              
  		              
  		            }
  		          });
  	        	}  	        	
  		        response(dataConv);
  		        //set_dimensions();
          });	    	  
      	        
	      },
	      //This bit is executed upon selection of an address
	      select: function(event, ui) {
	        var location = new google.maps.LatLng(ui.item.latitude, ui.item.longitude);
	        //map.setZoom(11);
	        map.setCenter(location);
	        
	        var resultBounds = new google.maps.LatLngBounds(
	        		ui.item.southwest, 
	        		ui.item.northeast
				);

				map.fitBounds(resultBounds);

				placeSearchMarker(location);
	        
	      }
	   	});

	$("#calculations, #totals").hide();
	
	if(id!=''){
		readonly = true;
		//setReadonly(id);
	}
	
	set_dimensions();
	
	$(window).resize(function() {
		set_dimensions();
	});
	

	
	
	
	var uploader = new qq.FileUploader({
        element: document.getElementById('file-uploader'),
        action: 'ajax/import_kml.php',
        debug: false,
        onComplete: function(id, fileName, responseJSON){
            if(responseJSON.success == true){
	            var params = "filename="+responseJSON.filename;
	            $.ajax({async:true, url:'ajax/populate_from_kml.php?', dataType: 'json', cache:false, type:'POST', data: params, success: function(data){ 
	        		var result = convertToPoints(data.coordinates); 
	        		areacontainer = result; 
	        		areacontainer_current = 0;
	        		areacontainer_labels = data.labels;
	        		areacontainer_types = data.types;
	        		for(var i=0; i<areacontainer.length; i++){
	        			areacontainer_toggle[i] = 'HIDE_NONE';
	        		}
	        		display();
	        		 $("#file-dialog").dialog("close");
	        		 $(".qq-upload-list").html('');
	        		 
	        		 	var bounds = new google.maps.LatLngBounds(); 
	        			for(var i=0; i<areaMarkers.length; i++){
	        				bounds.extend(areaMarkers[i].getPosition());
	        			}
	        			map.fitBounds(bounds);
	        			display();
	        		}
	            	
	        	});            	
            }
	    }
    });
		
	set_dimensions();
	////$(window).trigger('resize');
	
	$("#arrow").click(function(){
		
		var cls = $("#slideout-menu").attr('class');
				
		if(cls=="out"){
			$("#slideout-menu").removeClass("out");
			var left = '-=422';
			$(this).button({
				label: '<br>><br><br>'
			});
			
		}else{
			$("#slideout-menu").addClass("out");
			var left = '+=422';
			$(this).button({
				label: '<br><<br><br>'
			});
		}
		
		$("#slideout-menu").animate({
			left: left,
		});
	});
	
	$( "#radio" ).buttonset();
	
	$("#radio").change(function(){
		var value = $(this).find('input:checked').val();
		set_toggle(value);
	});
	
});


function set_toggle(value){
	areacontainer_toggle[areacontainer_current] = value;
	display();
}


function set_dimensions(){
	
	var fullwidth = $(window).width();
	//var fullwidth = $('body').width();
	//var fullwidth = screen.availWidth;
	//var fullwidth = $('body').innerWidth();	
	var leftwidth = $("#left").width();	
	var rightwidth = fullwidth - leftwidth - 2;
	$("#right").css('width',rightwidth);
	//$("#right").width(rightwidth);
	
	var fullheight = $(window).height();
	$("#side-panel-content").css('height',fullheight - 42);
	
	if(areacontainer.length > 1){
		if(id!='')
			var calc_height = 400;
		else
			var calc_height = 480;
	}else{
		if(id!='')
			var calc_height = 190;
		else
			var calc_height = 270;
	}
		
	$("#calculations").css('height', fullheight - 42 - calc_height);
	
	//google.maps.event.trigger(map, 'resize');
	
	//console.log(fullwidth);
}

function initialize_map(){
	var latlng = new google.maps.LatLng(0.0, 0.0);
    var myOptions = {
        zoom: 2,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        draggableCursor: 'crosshair',
        streetViewControl: false,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },
        tilt: 0
    };
    map = new google.maps.Map(document.getElementById("map"), myOptions);
    google.maps.event.addListener(map, 'click', map_click);
    geocoder = new google.maps.Geocoder();
    
    overlay = new google.maps.OverlayView();
    overlay.draw = function() {};
    overlay.setMap(map);
    
    google.maps.event.addListener(map, 'idle', function() {
	   projection = overlay.getProjection();
	   //console.log(projection);
		if(id!='' && readonly_ran == false){
			readonly_ran = true;
			setReadonly(id);
		}
		set_dimensions();
	})
	
	google.maps.event.addListener(map, 'dragstart', function(){
		$(".polygon-label").hide();
	});
	google.maps.event.addListener(map, 'dragend', display);
    google.maps.event.addListener(map, 'zoom_changed', display);

}

function map_click(event){	
	if(areacontainer_current == null){
		createNewArea()
	}
	areacontainer[areacontainer_current].push(event.latLng);
	display();
	$(".context-menu").css('visibility','hidden');
}

function display(){
	
	clearMap();
	
	var total_perimeter_m = 0;
	var total_perimeter_ft = 0;
	var total_area_m = 0;
	var total_area_km = 0;
	var total_area_acres = 0;
	var total_area_hectares = 0;
	var total_area_ft = 0;
	var total_area_snm = 0;
	var total_perimeter_yard = 0;
	var total_area_yard = 0;
	
	$("#calculations, #totals").hide();
	
	for (var i = 0; i < areacontainer.length; i++){
		
		var tmp_arr = Array(0);
		
		$("#calculations, #totals").show();
		$("#instructions").hide();
		
		if(areacontainer_current == i){
        	var temp_fillColor = "#003461";
        	var temp_fillOpacity = '0.5';
        	var temp_lineColor = lineColor;
        }else{
        	var temp_fillColor = fillColor;
        	var temp_fillOpacity = fillOpacity;
        	var temp_lineColor = lineColor;
        }
		
		if(areacontainer_types[i] == 'SUB'){
			temp_lineColor = "red";
		}
		
		if(areacontainer[i].length==2){
			var distanceTooltip = getPolylineDistance(areacontainer[i]);
		}
		else{
			var distanceTooltip = "";
		}
		
		var temp_areaPath = new google.maps.Polyline({
            path: areacontainer[i],
            strokeColor: temp_lineColor,
            strokeOpacity: lineOpacity,
            strokeWeight: lineWidth,
            geodesic: false,
            index: i,
            number: 0,
            distanceTooltip: distanceTooltip
        });
		temp_areaPath.setMap(map);
        //areaPath.push(temp_areaPath);
        
		
		if (areacontainer[i].length == 2) {
			
		 if(!(readonly)){
            google.maps.event.addListener(temp_areaPath, 'click', function(event){
            	areacontainer[this.index].splice(this.number + 1, 0, event.latLng);
            	display();
            });
            google.maps.event.addListener(temp_areaPath, 'rightclick', function(event){
            	polylineMenu(this,event);
            });		                        
         }
         
         google.maps.event.addListener(temp_areaPath, 'mouseover', function(event){
         	polylineHover(this, event.latLng);		            	
         });
         google.maps.event.addListener(temp_areaPath, 'mouseout', function(event){
         	$(".distanceTooltip").remove();		            	
         });
		}
         
         
         tmp_arr.push(temp_areaPath);
 		areaPath2.push(tmp_arr);
		
 		placeLabel(i);
        
        var perm = 1000 * temp_areaPath.inKm();
        var perimeter_m = perm.toFixed(3);
        var perimeter_ft = (perm * 3.2808399).toFixed(3);
        var perimeter_yard = (perimeter_m * 1.09361).toFixed(2);
        var area_m = 0;
        var area_km = 0;
        var area_acres = 0;
        var area_hectares = 0;
        var area_ft = 0;
        var area_snm = 0;
        var area_yard = 0;
        
        var dummy_polygon = new google.maps.Polygon({
            paths: Array(0),
            strokeColor: temp_lineColor,
            strokeOpacity: lineOpacity,
            strokeWeight: lineWidth,
            fillColor: temp_fillColor,
            geodesic: false,
            fillOpacity: temp_fillOpacity,
            clickable: false,
            index: i
        });
        polygon.push(dummy_polygon);		
        
        
        if (areacontainer[i].length > 2) {
        	
        	polygon.pop();
        	/*
        	if (areaPath2.length > 0) {
                for (q in areaPath2) {
                    for(w in areaPath2[q]){
                		areaPath2[q][w].setMap(null)
                	}
                }
            }
        	areaPath2 = Array(0);
        	*/
        	tmp_arr = Array(0);
        	
        	for(var k=0; k<areacontainer[i].length-1; k++){
        		
        		var arr = Array(0);
        		arr.push(areacontainer[i][k]);
        		arr.push(areacontainer[i][k+1]);
        		

        		
        		
	            var temp_areaPath2 = new google.maps.Polyline({
	                path: arr,
	                strokeColor: temp_lineColor,
	                strokeOpacity: lineOpacity,
	                strokeWeight: lineWidth,
	                geodesic: false,
	                fillOpacity: temp_fillOpacity,
	                index: i,
	                number: k,
	                distanceTooltip: getPolylineDistance(arr)
	            });
	            
	            
	            
	            if(!(readonly)){
		            google.maps.event.addListener(temp_areaPath2, 'click', function(event){
		            	areacontainer[this.index].splice(this.number + 1, 0, event.latLng);
		            	display();
		            });
		            google.maps.event.addListener(temp_areaPath2, 'rightclick', function(event){
		            	polylineMenu(this,event);
		            });		                        
	            }
	            
	            google.maps.event.addListener(temp_areaPath2, 'mouseover', function(event){
	            	polylineHover(this, event.latLng);		            	
	            });
	            google.maps.event.addListener(temp_areaPath2, 'mouseout', function(event){
	            	$(".distanceTooltip").remove();		            	
	            });
	            
	            temp_areaPath2.setMap(map);
	            tmp_arr.push(temp_areaPath2);
	            
	            
	            
	            /*** this is to add the final path between end and start***/
	            if(k==areacontainer[i].length-2){
	            	
	            	
	            	var arr = Array(0);
	        		arr.push(areacontainer[i][areacontainer[i].length-1]);
	        		arr.push(areacontainer[i][0]);
	        		
		            var temp_areaPath2 = new google.maps.Polyline({
		                path: arr,
		                strokeColor: temp_lineColor,
		                strokeOpacity: lineOpacity,
		                strokeWeight: lineWidth,
		                geodesic: false,
		                fillOpacity: temp_fillOpacity,
		                index: i,
		                number: k+1,
		                distanceTooltip: getPolylineDistance(arr)
		            });
		            
		            temp_areaPath2.setMap(map);
		            tmp_arr.push(temp_areaPath2);
		            
		            if(!(readonly)){
			            google.maps.event.addListener(temp_areaPath2, 'click', function(event){
			            	areacontainer[this.index].splice(this.number + 1, 0, event.latLng);
			            	display();
			            });
			            google.maps.event.addListener(temp_areaPath2, 'rightclick', function(event){
			            	polylineMenu(this,event);
			            });			            
		            }
		            google.maps.event.addListener(temp_areaPath2, 'mouseover', function(event){
		            	polylineHover(this, event.latLng);		            	
		            });
		            google.maps.event.addListener(temp_areaPath2, 'mouseout', function(event){
		            	$(".distanceTooltip").remove();		            	
		            });
	            	
	            }
	            /**************************************************/
        	}
        	
        	areaPath2.push(tmp_arr);
        	
        	
        	
            var temp_polygon = new google.maps.Polygon({
                paths: areacontainer[i],
                strokeColor: temp_lineColor,
                strokeOpacity: lineOpacity,
                strokeWeight: lineWidth,
                fillColor: temp_fillColor,
                geodesic: false,
                fillOpacity: temp_fillOpacity,
                clickable: false,
                index: i
            });
            temp_polygon.setMap(map);
            polygon.push(temp_polygon);
           
            var marker2 = placeAnchor(getPolygonCenter(i),/*temp_polygon.getBounds().getCenter(),*/ i);
            areaAnchors.push(marker2);
            //marker.setMap(map);
            
            placeLabel(i);
            
            if(!(readonly)){
	            var f = function (index) {
	                return function () {
	                	areacontainer_current = index;
	                    display();
	                    $(".context-menu").css('visibility','hidden');
	                }
	            };
	            google.maps.event.addListener(temp_polygon, 'click', map_click);
	            	            
	            google.maps.event.addListener(temp_polygon, 'rightclick', function(event){
	            	polygonMenu(this,event);	            	
	            });
	            	        
	            var marker3 = placeRotator(getPolygonCenter(i), i);
	            //var marker3 = placeRotator(getPolygonCenter(polygon.length-1), polygon.length-1);
	            areaRotators.push(marker3);
	            	            
	            
            }
            
            var areaMeters2 = PlanarPolygonAreaMeters2(areacontainer[i]);
 
            var area_m = Areas(areaMeters2);
            var area_km = Areaskm(areaMeters2);
            var area_acres = Areasacre(areaMeters2);
            var area_hectares = Areashectare(areaMeters2);
            var area_ft = Areasfeet(areaMeters2);
            var area_snm = AreasNatMiles(areaMeters2);
            var area_yard = Areasyard(areaMeters2);
            
            
                                     
        }
        
        displayCalculations(i, perimeter_m, perimeter_ft, area_m, area_km, area_acres, area_hectares, area_ft, area_snm, perimeter_yard, area_yard);
        

        if(areacontainer_types[i]=='ADD'){
	    	total_perimeter_m = total_perimeter_m + parseFloat(perimeter_m);
	    	total_perimeter_ft = total_perimeter_ft + parseFloat(perimeter_ft);
	    	total_perimeter_yard = total_perimeter_yard + parseFloat(perimeter_yard);
	    	total_area_m = total_area_m + parseFloat(area_m);
	    	total_area_km = total_area_km + parseFloat(area_km);
	    	total_area_acres = total_area_acres + parseFloat(area_acres);
	    	total_area_hectares = total_area_hectares + parseFloat(area_hectares);
	    	total_area_ft = total_area_ft + parseFloat(area_ft);
	    	total_area_snm = total_area_snm + parseFloat(area_snm);	
	    	total_area_yard = total_area_yard + parseFloat(area_yard);	
        }else{
        	//total_perimeter_m = total_perimeter_m - parseFloat(perimeter_m);
	    	//total_perimeter_ft = total_perimeter_ft - parseFloat(perimeter_ft);
	    	//total_perimeter_yard = total_perimeter_yard - parseFloat(perimeter_yard);
	    	total_area_m = total_area_m - parseFloat(area_m);
	    	total_area_km = total_area_km - parseFloat(area_km);
	    	total_area_acres = total_area_acres - parseFloat(area_acres);
	    	total_area_hectares = total_area_hectares - parseFloat(area_hectares);
	    	total_area_ft = total_area_ft - parseFloat(area_ft);
	    	total_area_snm = total_area_snm - parseFloat(area_snm);	
	    	total_area_yard = total_area_yard - parseFloat(area_yard);
        }

        
        for (var j = 0; j < areacontainer[i].length; j++) {
        	if(areacontainer_toggle[i]=='HIDE_LABELS' || areacontainer_toggle[i]=='HIDE_NONE' /*|| id!=''*/){
	            var marker = placeMarker(areacontainer[i][j], j, i);
	            areaMarkers.push(marker);
	            marker.setMap(map);
        	}
        }
        
	}
	
	if(areacontainer.length != null && areacontainer.length > 1)
		displayCalculationTotals(total_perimeter_m, total_perimeter_ft, total_area_m, total_area_km, total_area_acres, total_area_hectares, total_area_ft, total_area_snm, total_perimeter_yard, total_area_yard)
		
	$("#calculations").accordion('destroy').accordion({
		header: '.title',
		active: areacontainer_current,
		autoHeight: false
	});
	$("#totals").accordion('destroy').accordion({
		header: '.title',
		active: 0,
		autoHeight: false
	});
	$("button").button();
	//$(window).trigger("resize");
	set_dimensions();
	
	$("#slideout-menu-overlay").html(areacontainer_labels[areacontainer_current]);
	
	$("#radio input").trigger('blur');
	if(areacontainer_toggle[areacontainer_current]=='HIDE_PINS'){
		$("#radio1").trigger('click');
	}else if(areacontainer_toggle[areacontainer_current]=='HIDE_LABELS'){
		$("#radio2").trigger('click');
	}else if(areacontainer_toggle[areacontainer_current]=='HIDE_BOTH'){
		$("#radio3").trigger('click');
	}else if(areacontainer_toggle[areacontainer_current]=='HIDE_NONE'){
		$("#radio4").trigger('click');
	}
	
}

function clearMap() {
    if (areaMarkers) {
        for (i in areaMarkers) {
            areaMarkers[i].setMap(null)
        }
    }
    if (areaPath.length > 0) {
        for (i in areaPath) {
            areaPath[i].setMap(null)
        }
    }
    if (areaPath2.length > 0) {
        for (i in areaPath2) {
            for(j in areaPath2[i]){
        		areaPath2[i][j].setMap(null)
        	}
        }
    }
    if (polygon.length > 0) {
        for (i in polygon) {
            polygon[i].setMap(null)
        }
    }
    if (areaAnchors.length > 0) {
        for (i in areaAnchors) {
        	areaAnchors[i].setMap(null)
        }
    }
    
    if (areaRotators.length > 0) {
        for (i in areaRotators) {
        	areaRotators[i].setMap(null)
        }
    }
    
    if (rotatorLines.length > 0) {
        for (i in rotatorLines) {
        	rotatorLines[i].setMap(null)
        }
    }
    
    areaMarkers = new Array(0);
    areaPath = new Array(0);
    areaPath2 = new Array(0);
    polygon = new Array(0);
    areaAnchors = new Array(0);
    areaRotators = new Array(0);
    rotatorLines = new Array(0);
    
    $('#calculations, #totals').html('');
    $("#instructions").show();
    $('.polygon-label').remove();
    $("#slideout-menu-overlay").html('');
}


function getPolylineDistance(points){
	
	
	var p1 = new LatLon(points[0].lat(), points[0].lng());
	var p2 = new LatLon(points[1].lat(), points[1].lng());
	var dest_km = p1.distanceTo(p2);
	    
	var dest_m = (dest_km * 1000).toFixed(2);
    var dest_ft = (dest_m * 3.2808399).toFixed(2);
    var dest_yard = (dest_m * 1.09361).toFixed(2);
	
	var html = ""+
		"<div class='distanceTooltip'>"+
		addCommas(dest_ft)+" ft<br>"+
		addCommas(dest_yard)+" yards<br>"+
		addCommas(dest_m)+" m"+
		"</div>";
	
	return html;
}


function polylineHover(line, location){	
	$(".distanceTooltip").remove();
	$("#map").append(line.distanceTooltip);
	var latlng = location;
	var x = overlay.getProjection().fromLatLngToContainerPixel(latlng).x;
	var y = overlay.getProjection().fromLatLngToContainerPixel(latlng).y;
	x += 15;
	$(".distanceTooltip").css('top',y).css('left',x).css('visibility','visible');
}


function placeLabel(index){
	if(areacontainer_toggle[index] == 'HIDE_PINS' || areacontainer_toggle[index] == 'HIDE_NONE' /* || id!=''*/){
		var html = "<div class='polygon-label' id='polygon-label-"+index+"'>"+areacontainer_labels[index]+"</div>";
		$("#map").append(html);
		var latlng = getPolygonCenter(index);
		if(!(isNaN(latlng.lat()))){		
			var x = overlay.getProjection().fromLatLngToContainerPixel(latlng).x;
			var y = overlay.getProjection().fromLatLngToContainerPixel(latlng).y;
			y = y + 6;
			$("#polygon-label-"+index).css('top',y).css('left',x).css('visibility','visible');
		}
	}
}


function placeMarker(location, number, index) {
    //var image = new google.maps.MarkerImage('http://www.daftlogic.com/images/gmmarkersv3/stripes.png', new google.maps.Size(20, 34), new google.maps.Point(0, 0), new google.maps.Point(9, 33));
    //var shadow = new google.maps.MarkerImage('http://www.daftlogic.com/images/gmmarkersv3/shadow.png', new google.maps.Size(28, 22), new google.maps.Point(0, 0), new google.maps.Point(1, 22));
    
	if(areacontainer_types[index] == 'ADD'){	
		var icon = new google.maps.MarkerImage('img/pin.png',
				new google.maps.Size(15, 27),
				new google.maps.Point(0,0),
				new google.maps.Point(7, 27)
			);
	}else{
		var icon = new google.maps.MarkerImage('img/pin-red.png',
				new google.maps.Size(15, 27),
				new google.maps.Point(0,0),
				new google.maps.Point(7, 27)
			);
	}
	
	var shadow = new google.maps.MarkerImage('img/pin-shadow.png',
		      // The shadow image is larger in the horizontal dimension
		      // while the position and offset are the same as for the main image.
		      new google.maps.Size(25, 25),
		      new google.maps.Point(0,0),
		      new google.maps.Point(4, 33));
	
	var marker = new google.maps.Marker({
        position: location,
        map: map,
        shadow: shadow,
        icon: icon,
        draggable: false,
        index: index,
        number: number
    });
    var f = function (index, number) {
        return function () {
            areacontainer[index][number] = marker.position;
            areacontainer_current = index;
            display();
            $(".context-menu").css('visibility','hidden');
        }
    };
    var f2 = function (index) {
    	return function() {
    		areacontainer_current = index;
    		display();
    		$(".context-menu").css('visibility','hidden');
    	}
    } 
    
    if(!(readonly)){
    	marker.setOptions({
    		draggable: true
    	});
    	
    	google.maps.event.addListener(marker, 'dragend', f(index, number));
    	google.maps.event.addListener(marker, 'click', f2(index, number));
	
    
    	google.maps.event.addListener(marker, 'rightclick', function(event){
    		markerMenu(this, event);
    	});
    
    }
    
    return marker;
}

function deleteLastPoint(index) {
    if(areacontainer[index].length > 0){ 
    	areacontainer[index].length--;
    	areacontainer_labels[index].length--;
    	areacontainer_types[index].length--;
    	areacontainer_toggle[index].length--;
    }
    display();
    return false;
}


function deletePoint(index, number){
	areacontainer[index].splice(number,1);
	//areacontainer_labels[index].splice(number,1);
	//areacontainer_types[index].splice(number,1);
	display();
}


function clearAllPoints() {
	
	$("#delete-all-dialog").dialog({
	      buttons : {
	        "Confirm" : function() {
	        	areacontainer = new Array(0);
	        	areacontainer_labels = new Array(0);
	        	areacontainer_types = new Array(0);
	        	areacontainer_toggle = new Array(0);
	            //div_totalareas.style.visibility = 'hidden';
	            display();
	            //kmlcoordinates = "";
	            //div_kmloutput.innerHTML = "";
	            areaMarkers = new Array(0);
	            areaPath = new Array(0);
	            areaPath2 = new Array(0);
	            polygon = new Array(0);
	            //var points = new Array(0);
	            //areacontainer.push(points); 
	            areacontainer_current = null;
	            deleteSearchMarker();
	        	$(this).dialog("close");
	        },
	        "Cancel" : function() {
	          $(this).dialog("close");
	        }
	      }
	    });

	    $("#delete-all-dialog").dialog("open");

	    $('.ui-dialog :button').blur();
	    
	return false;
		
}

function createNewArea() {
    points = new Array(0);
    areacontainer.push(points);
    areacontainer_current = areacontainer.length - 1;
    areacontainer_labels.push('Overlay '+areacontainer.length);
    areacontainer_types.push('ADD');
    areacontainer_toggle.push('HIDE_NONE');
    //console.log(areacontainer.length);
    //$("#calculations").append(calculationHTML(areacontainer_current));
    //div_totalareas.style.visibility = 'visible';
    display();
    //kmlcoordinates = "";
    //div_kmloutput.innerHTML = ""
    return false;
}

function displayCalculations(index, perimeter_m, perimeter_ft, area_m, area_km, area_acres, area_hectares, area_ft, area_snm, perimeter_yard, area_yard){
	
	
	var html = "" +
			"<div class='title'><a href='#' onclick='setActiveArea("+index+")'>"+areacontainer_labels[index]+"</a></div>" +
			"<div id='overlay"+index+"' class='overlay'>" +
				
				"<div class='content'>" +

				
					"<table>" +
					"<thead><tr><td>Area</td><td>Perimeter</td></tr></thead>" +
					"<tbody>" +
					"<tr><td>"+addCommas(parseFloat(area_ft).toFixed(2))+" feet&sup2;</td><td>"+addCommas(parseFloat(perimeter_ft).toFixed(2))+" feet</td></tr>" +
					"<tr><td>"+addCommas(parseFloat(area_yard).toFixed(2))+" yards&sup2;</td><td>"+addCommas(parseFloat(perimeter_m).toFixed(2))+" m</td></tr>" +
					"<tr><td>"+addCommas(parseFloat(area_acres).toFixed(2))+" acres</td><td>"+addCommas(parseFloat(perimeter_yard).toFixed(2))+" yards</td></tr>" +
					"<tr><td>"+addCommas(parseFloat(area_hectares).toFixed(2))+" hectares</td><td></td></tr>" +
					"<tr><td>"+addCommas(parseFloat(area_snm).toFixed(2))+" NM&sup2;</td><td></td></tr>" +
					"<tr><td>"+addCommas(parseFloat(area_m).toFixed(2))+" m&sup2;</td><td></td></tr>" +
					"<tr><td>"+addCommas(parseFloat(area_km).toFixed(2))+" km&sup2;</td><td></td></tr>" +
					"</tbody>" +
					"</table>"+
					
					"<div class='button-actions'>" +					
						(readonly ? "" : "<button onclick='return deleteArea("+index+")' >Delete Overlay</button>") +
						(readonly ? "" : "<button onclick='return deleteLastPoint("+index+");'>Delete Last Point</button>") +
						(readonly ? "" : "<button onclick='return setAreaLabelDialog("+index+")' >Set Label</button>") +
						"<div class='clear'></div>"+
					"</div>" +
				"</div>" +
			"</div>";
	$("#calculations").append(html);
}

function displayCalculationTotals(perimeter_m, perimeter_ft, area_m, area_km, area_acres, area_hectares, area_ft, area_snm, perimeter_yard, area_yard){
		
	var html = "" +
		"<div class='title'><a href='#'>Totals:</a></div>" +
		"<div class='total'>" +
		"<div class='content'>" +
		"<table>" +
		"<thead><tr><td>Area</td><td>Perimeter</td></tr></thead>" +
		"<tbody>" +
		"<tr><td>"+addCommas(parseFloat(area_ft).toFixed(2))+" feet&sup2;</td><td>"+addCommas(parseFloat(perimeter_ft).toFixed(2))+" feet</td></tr>" +
		"<tr><td>"+addCommas(parseFloat(area_yard).toFixed(2))+" yards&sup2;</td><td>"+addCommas(parseFloat(perimeter_m).toFixed(2))+" m</td></tr>" +
		"<tr><td>"+addCommas(parseFloat(area_acres).toFixed(2))+" acres</td><td>"+addCommas(parseFloat(perimeter_yard).toFixed(2))+" yards</td></tr>" +
		"<tr><td>"+addCommas(parseFloat(area_hectares).toFixed(2))+" hectares</td><td></td></tr>" +
		"<tr><td>"+addCommas(parseFloat(area_snm).toFixed(2))+" NM&sup2;</td><td></td></tr>" +
		"<tr><td>"+addCommas(parseFloat(area_m).toFixed(2))+" m&sup2;</td><td></td></tr>" +
		"<tr><td>"+addCommas(parseFloat(area_km).toFixed(2))+" km&sup2;</td><td></td></tr>" +
		"</tbody>" +
		"</table>"+
		"</div>" +
	"</div>";
	$("#totals").append(html);
}


function setAreaLabelDialog(index){
	
	$("#setAreaLabel-dialog #label").val(areacontainer_labels[index]);
	
	$("#setAreaLabel-dialog").dialog({
	      buttons : {
	        "Set" : function() {
	        		        		        	
	        	var label = $("#setAreaLabel-dialog #label").val();
	        	
	        	if(label == ''){
	        		alert('Please input a label');
	        		return;
	        	}
	        	
	        	areacontainer_labels[index] = label
	        	
	        	display();
	        	$(this).dialog("close");
	        },
	        "Cancel" : function() {
	          $(this).dialog("close");
	        }
	      },
			open: function() {
			    $("#setAreaLabel-dialog").keypress(function(e) {
			      if (e.keyCode == $.ui.keyCode.ENTER) {
			        $(this).parent().find("button:eq(0)").trigger("click");
			      }
			    });
			  }
	    });

	    $("#setAreaLabel-dialog").dialog("open");
	    
	    $('.ui-dialog :button').blur();
	    
	return false;
}



function setLineLengthDialog(index, number){
	
	var path = areaPath2[index][number].getPath();
	var origin = path.getAt(0);
	var dest = path.getAt(1);
	var p1 = new LatLon(origin.lat(), origin.lng()); 
	var p2 = new LatLon(dest.lat(), dest.lng()); 
	
	var km = p1.distanceTo(p2);
	
	var html = "<div>"+
	"<b>Current Length:</b><br>"+
	addCommas(parseFloat(km/0.0003048).toFixed(2))+" feet<br>"+
	addCommas(parseFloat(km/0.0009144).toFixed(2))+" yards<br>"+
	addCommas(parseFloat(km/0.001).toFixed(2))+" meters<br>"+
	"</div>";
	
	$("#oldLength").html(html);
	
	
	$("#setLineLength-dialog").dialog({
	      buttons : {
	        "Set" : function() {
	        		        		        	
	        	var length = $("#setLineLength-dialog #length").val();
	        	var units = $("#setLineLength-dialog #units").val();
	        	
	        	if(length == ''){
	        		alert('Please input a length');
	        		return;
	        	}
	        	setLineLength(index, number, length, units);	        	
	        	display();
	        	$(this).dialog("close");
	        },
	        "Cancel" : function() {
	          $(this).dialog("close");
	        }
	      },
		open: function() {
		    $("#setLineLength-dialog").keypress(function(e) {
		      if (e.keyCode == $.ui.keyCode.ENTER) {
		        $(this).parent().find("button:eq(0)").trigger("click");
		      }
		    });
		  }

	    });

	    $("#setLineLength-dialog").dialog("open");
	    
	    $('.ui-dialog :button').blur();
	    
	return false;
}


function setLineLength(index, number, length, units){
		
	var path = areaPath2[index][number].getPath();
	
	var origin = path.getAt(0);
	var dest = path.getAt(1);
	
	var p1 = new LatLon(origin.lat(), origin.lng()); 
	var p2 = new LatLon(dest.lat(), dest.lng()); 
	var bearing = p1.bearingTo(p2); 
	
	var conv = 1;
	if(units=='meters')
		conv = '.001';
	if(units=='feet')
		conv = '0.0003048';
	if(units=='yards')
		conv = '0.0009144';
	if(units=='kilometers')
		conv = 1;
	if(units=='miles')
		conv = '1.60934';
	
	var distance = length * conv;
	
	var newdest = p1.destinationPoint(bearing, distance);
	
	var newdestLatLng = new google.maps.LatLng(newdest.lat(), newdest.lon());	
	
	
	if(areacontainer[index][number+1] == undefined){
		var next = 0;
	}else{
		var next = number+1;
	}
	
	areacontainer[index][next] = newdestLatLng;
	
	/*
	console.log(origin);
	console.log(dest);
	console.log(distance);
	console.log(bearing);
	console.log(newdestLatLng);
	console.log(areacontainer[index][next]);
	*/
	
	return;
	
}


function deleteArea(index){
	
	$("#delete-dialog").dialog({
	      buttons : {
	        "Confirm" : function() {
	        	areacontainer.splice(index,1);
	        	areacontainer_labels.splice(index,1);
	        	areacontainer_types.splice(index,1);
	        	areacontainer_toggle.splice(index,1);
	        	if(areacontainer.length == 0){
	        		areacontainer_current = null;
	        	}else{
	        		areacontainer_current = areacontainer.length - 1;
	        	}
	        	display();
	        	$(this).dialog("close");
	        },
	        "Cancel" : function() {
	          $(this).dialog("close");
	        }
	      }
	    });

	    $("#delete-dialog").dialog("open");
	    
	    $('.ui-dialog :button').blur();
	    
	return false;
}

function setActiveArea(index){
	areacontainer_current = index;
	display();
	return true;
}

function searchAddress(){
	$('#loading').show();	
	var params = "";
	params += $("#search-form").serialize();	
	if($('#address').val() != ''){		
		var address = $('#address').val();		
		geocoder.geocode( { 'address': address}, function(results, status) {
			var location = '';		
			  if(status == google.maps.GeocoderStatus.OK) {			
				location = results[0].geometry.location;				
				map.setCenter(location);
				
				var resultBounds = new google.maps.LatLngBounds(
				    results[0].geometry.viewport.getSouthWest(), 
				    results[0].geometry.viewport.getNorthEast()
				);

				map.fitBounds(resultBounds);

				placeSearchMarker(location);

				//map.setZoom(13);				 
			  }
			  $('#loading').hide();
		});					
	} 		
	return false;
}

function saveMapDialog(){
	
	$("#save-dialog").dialog({
		  width:400,
	      buttons : {
	        "Send" : function() {
	        	if($('#save-form #name').val() == '' || $('#save-form #email').val() == ''){
	        		alert('Please fill out all required fields');
	        		return;
	        	}
	        	saveMap();
	        	$(this).dialog("close");
	        },
	        "Cancel" : function() {
	          $(this).dialog("close");
	        }
	      },
			open: function() {
			    $("#save-dialog").keypress(function(e) {
			      if (e.keyCode == $.ui.keyCode.ENTER) {
			        $(this).parent().find("button:eq(0)").trigger("click");
			      }
			    });
			  }
	    });

	    $("#save-dialog").dialog("open");
	    
	    $('.ui-dialog :button').blur();
	    
	    return false;
}

function saveMap(){
	
	if(areacontainer.length > 0){
		for(var i=0; i<areacontainer.length; i++){
			if(areacontainer[i].length > 0){
				var points = new Array(0);
				for(var j=0; j<areacontainer[i].length; j++){
					var point = areacontainer[i][j].lat()+','+areacontainer[i][j].lng();
					points.push(point);			
				}
				var temp = points.join('~');
				$('#save-form #hidden').append("<input type='hidden' name='overlay[]' value='"+temp+"' />");
				$('#save-form #hidden').append("<input type='hidden' name='label[]' value='"+areacontainer_labels[i]+"' />");
				$('#save-form #hidden').append("<input type='hidden' name='type[]' value='"+areacontainer_types[i]+"' />");
			}
		}
		/*
		for(var i=0; i<areacontainer_labels.length; i++){
			$('#save-form #hidden').append("<input type='hidden' name='label[]' value='"+areacontainer_labels[i]+"' />");
		}
		for(var i=0; i<areacontainer_types.length; i++){
			$('#save-form #hidden').append("<input type='hidden' name='type[]' value='"+areacontainer_types[i]+"' />");
		}
		*/
		var params = $('#save-form').serialize();
		var msg = eval($.ajax({async:false, url:'ajax/save.php?', cache:false, type:'POST', data: params}).responseText);
		$('#save-form #hidden').html('');
	}else{
		var msg = Array(0);
		msg[0] = false;
		msg[1] = "Your map has no overlays. Please add at least one."
	}
	
	alert(msg[1]);
	
	return false;
}


function shapeDialog(){
	
	$("#shape-dialog").dialog({
		 width: 300,
	      buttons : {
	        "Add Shape" : function() {
	        	var type = $("#type").val();
	        	if(type=='rectangle'){
	        		var units = $("#rectangle #units").val();
		        	var length1 = $("#rectangle #side1").val();
		        	var length2 = $("#rectangle #side2").val();
		        	if(length1 == '' || length2 == ''){
		        		alert('Please fill out all fields');
		        		return;
		        	}		        		
		        	addRect(units, length1, length2);
	        	}
	        	else if(type=='triangle'){
	        		var units = $("#triangle #units").val();
		        	var length1 = $("#triangle #side1").val();
		        	var length2 = $("#triangle #side2").val();
		        	var angle1 = $("#triangle #angle1").val();
		        	if(length1 == '' || length2 == '' || angle1 == ''){
		        		alert('Please fill out all fields');
		        		return;
		        	}
		        	if(parseFloat(angle1) > 90){
		        		alert('Acute angle must be less than 90 degrees');
		        		return;
		        	}
		        	addTri(units, length1, length2, angle1);
	        	}
	        	else if(type=='circle'){
	        		var units = $("#circle #units").val();
		        	var length1 = $("#circle #side1").val();
		        	if(length1 == ''){
		        		alert('Please fill out all fields');
		        		return;
		        	}
		        	addCirc(units, length1);
	        	}
	        	else if(type=='semicircle'){
	        		var units = $("#semicircle #units").val();
		        	var length1 = $("#semicircle #side1").val();
		        	if(length1 == ''){
		        		alert('Please fill out all fields');
		        		return;
		        	}
		        	addSemiCirc(units, length1);
	        	}
	        	        	
	        	
	        	$(this).dialog("close");
	        },
	        "Cancel" : function() {
	          $(this).dialog("close");
	        }
	      },
			open: function() {
			    $("#shape-dialog").keypress(function(e) {
			      if (e.keyCode == $.ui.keyCode.ENTER) {
			        $(this).parent().find("button:eq(0)").trigger("click");
			      }
			    });
			  }
	    });

	    $("#shape-dialog").dialog("open");
	    
	    $('.ui-dialog :button').blur();
	    
	    return false;
}


function addRect(units, length1, length2){
	createNewArea();
	var conv = 1;
	if(units=='meters')
		conv = '.001';
	if(units=='feet')
		conv = '0.0003048';
	if(units=='yards')
		conv = '0.0009144';
	if(units=='kilometers')
		conv = 1;
	if(units=='miles')
		conv = '1.60934';
	var length1_km = length1 * conv;
	var length2_km = length2 * conv;
	var point1 = map.getCenter();
	var p1 = new LatLon(point1.lat(), point1.lng());                                                      
	var p2 = p1.destinationPoint(0,length1_km);          // in km
	var p3 = p2.destinationPoint(90,length2_km);
	var p4 = p3.destinationPoint(180,length1_km);		
	
	var point2 = new google.maps.LatLng(p2.lat(), p2.lon());
	var point3 = new google.maps.LatLng(p3.lat(), p3.lon());
	var point4 = new google.maps.LatLng(p4.lat(), p4.lon());
	areacontainer[areacontainer_current].push(point1);
	areacontainer[areacontainer_current].push(point2);
	areacontainer[areacontainer_current].push(point3);
	areacontainer[areacontainer_current].push(point4);
	display();
}

function addTri(units, length1, length2, angle1){
	createNewArea();
	var conv = 1;
	if(units=='meters')
		conv = '.001';
	if(units=='feet')
		conv = '0.0003048';
	if(units=='yards')
		conv = '0.0009144';
	if(units=='kilometers')
		conv = 1;
	if(units=='miles')
		conv = '1.60934';
	var length1_km = length1 * conv;
	var length2_km = length2 * conv;
	var point1 = map.getCenter();
	var p1 = new LatLon(point1.lat(), point1.lng());
	var p2 = p1.destinationPoint(90,length1_km);
	var p3 = p1.destinationPoint(90-parseFloat(angle1),length2_km);
	var point2 = new google.maps.LatLng(p2.lat(), p2.lon());
	var point3 = new google.maps.LatLng(p3.lat(), p3.lon());
	areacontainer[areacontainer_current].push(point1);
	areacontainer[areacontainer_current].push(point2);
	areacontainer[areacontainer_current].push(point3);
	display();
}

function addCirc(units, length1){
	createNewArea();
	var conv = 1;
	if(units=='meters')
		conv = '.001';
	if(units=='feet')
		conv = '0.0003048';
	if(units=='yards')
		conv = '0.0009144';
	if(units=='kilometers')
		conv = 1;
	if(units=='miles')
		conv = '1.60934';
	var length1_km = length1 * conv;
	var radius = length1_km * .000157;
	var d = radius;
	var point1 = map.getCenter();
	
	with(Math){
		var lat1 = (PI/180)* point1.lat(); // radians
		var lng1 = (PI/180)* point1.lng(); // radians	
	
		var circlePoints = Array();
		var bearing = 0;
		
		for (var a = bearing-360 ; a < bearing+1 ; a=a+2 ) {
			var tc = (PI/180)*a;
			var y = asin(sin(lat1)*cos(d)+cos(lat1)*sin(d)*cos(tc));
			var dlng = atan2(sin(tc)*sin(d)*cos(lat1),cos(d)-sin(lat1)*sin(y));
			var x = ((lng1-dlng+PI) % (2*PI)) - PI ; // MOD function
			var point = new google.maps.LatLng(parseFloat(y*(180/PI)),parseFloat(x*(180/PI)));
			circlePoints.push(point);
		}
	}
	
	areacontainer[areacontainer_current] = circlePoints;

	display();
	
}

function addSemiCirc(units, length1){
	createNewArea();
	var conv = 1;
	if(units=='meters')
		conv = '.001';
	if(units=='feet')
		conv = '0.0003048';
	if(units=='yards')
		conv = '0.0009144';
	if(units=='kilometers')
		conv = 1;
	if(units=='miles')
		conv = '1.60934';
	var length1_km = length1 * conv;
	var radius = length1_km * .000157;
	var d = radius;
	var point1 = map.getCenter();
	
	with(Math){
		var lat1 = (PI/180)* point1.lat(); // radians
		var lng1 = (PI/180)* point1.lng(); // radians	
	
		var circlePoints = Array();
		var bearing = 0;
		
		for (var a = bearing-180 ; a < bearing+1 ; a=a+2 ) {
			var tc = (PI/180)*a;
			var y = asin(sin(lat1)*cos(d)+cos(lat1)*sin(d)*cos(tc));
			var dlng = atan2(sin(tc)*sin(d)*cos(lat1),cos(d)-sin(lat1)*sin(y));
			var x = ((lng1-dlng+PI) % (2*PI)) - PI ; // MOD function
			var point = new google.maps.LatLng(parseFloat(y*(180/PI)),parseFloat(x*(180/PI)));
			circlePoints.push(point);
		}
	}
	
	areacontainer[areacontainer_current] = circlePoints;

	display();
	
}


function setReadonly(id){
	
	$("#search-form").hide();
	//google.maps.event.clearInstanceListeners(map);

	var params = 'id='+id;
	$.ajax({async:true, url:'ajax/populate.php?', dataType: 'json', cache:false, type:'POST', data: params, success: function(data){ 
		var result = convertToPoints(data.coordinates); 
		areacontainer = result; 
		areacontainer_current = 0;
		areacontainer_labels = data.labels;
		areacontainer_types = data.types;
		
		for(var i = 0; i<areacontainer.length; i++){
			areacontainer_toggle[i] = 'HIDE_NONE';
		}
		
		display(true);
		
		var bounds = new google.maps.LatLngBounds(); 
		for(var i=0; i<areaMarkers.length; i++){
			bounds.extend(areaMarkers[i].getPosition());
		}
		map.fitBounds(bounds);

		display(true);
		
		}
	});
	
	
}


function getPolygonCenter(index){
	
	var x_total = 0;
	var y_total = 0;
	    
	for(var i=0; i<areacontainer[index].length; i++){
        		     		
		var tempx = projection.fromLatLngToContainerPixel(areacontainer[index][i]).x;
		x_total = x_total + tempx;
		var tempy = overlay.getProjection().fromLatLngToContainerPixel(areacontainer[index][i]).y;
		y_total = y_total + tempy;
				
	}
	
	x_total = x_total / areacontainer[index].length;
	y_total = y_total / areacontainer[index].length;
	
	var tempPoint = new google.maps.Point(x_total, y_total);
	var latlng = overlay.getProjection().fromContainerPixelToLatLng(tempPoint);
		
	return latlng;
	
}


function convertToPoints(array){
	
	for(var i=0; i<array.length; i++){
		for(var j=0; j<array[i].length; j++){
			var temp = array[i][j].split(',');
			var lat = temp[0];
			var lng = temp[1];
			array[i][j] = new google.maps.LatLng(lat, lng);
		}
	}
	
	return array;
}







function placeAnchor(location, index){
	
	//var icon = "img/mini-marker.png";
	var icon = new google.maps.MarkerImage("img/mini-marker.png",
			new google.maps.Size(16, 16),
			new google.maps.Point(0,0),
			new google.maps.Point(6, 6)
		);
	
	if(readonly){
		draggable = false;
	}else{
		draggable = true;
	}
	
	var marker = new google.maps.Marker({
        position: location,
        map: map,
        //shadow: shadow,
        icon: icon,
        draggable: draggable,
        oldposition: location,
        index: index
    });
	
	var f = function (index) {
        return function () {
            //areacontainer[index][number] = marker.position;
            //areacontainer_current = index;
        	//var oldlat = marker.oldposition.lat();
        	//var newlat = marker.position.lat();
        	//console.log(oldlat);
        	//console.log(newlat);
        	var oldx = overlay.getProjection().fromLatLngToContainerPixel(marker.oldposition).x;
        	var newx = overlay.getProjection().fromLatLngToContainerPixel(marker.position).x;
        	var diffx = newx - oldx;
        	
        	var oldy = overlay.getProjection().fromLatLngToContainerPixel(marker.oldposition).y;
        	var newy = overlay.getProjection().fromLatLngToContainerPixel(marker.position).y;
        	var diffy = newy - oldy;
        	//overlay.getProjection().fromContainerPixelToLatLng()
        	for(var i =0; i<areacontainer[index].length; i++){
        		
        		//Point(x:number, y:number)
        		
        		var tempx = overlay.getProjection().fromLatLngToContainerPixel(areacontainer[index][i]).x;
        		tempx = tempx + diffx;
        		var tempy = overlay.getProjection().fromLatLngToContainerPixel(areacontainer[index][i]).y;
        		tempy = tempy + diffy;
        		
        		var tempPoint = new google.maps.Point(tempx, tempy);
        		areacontainer[index][i] = overlay.getProjection().fromContainerPixelToLatLng(tempPoint);
        	}
        	areacontainer_current = index;        	
            display();
            $(".context-menu").css('visibility','hidden');
        }
    };
    
    
    var f2 = function (index) {
        return function () {
        	areacontainer_current = index;
            display();
            $(".context-menu").css('visibility','hidden');
        }
    };
    
    if(!(readonly)){
    	google.maps.event.addListener(marker, 'dragend', f(index));
    	//google.maps.event.addListener(marker, 'click', f2(index, location, 10));
    	
    	google.maps.event.addListener(marker, 'rightclick', function(event){
        	polygonMenu(this,event);	            	
        });
    	
    }
    
    google.maps.event.addListener(marker, 'click', f2(index));
    
	return marker;
}



function placeRotator(location, index){
		
	var icon = "img/rotate.png";
	
	if(readonly){
		draggable = false;
	}else{
		draggable = true;
	}
	
	var anchor = location;
	
	var polygon_top = polygon[index].getBounds().getNorthEast().lat();
	var p1 = new LatLon(polygon_top,location.lng());
	var p2 = new LatLon(location.lat(), location.lng());
	var result = p1.midpointTo(p2);
	var location = new google.maps.LatLng(result.lat(), result.lon());
		
	var marker = new google.maps.Marker({
        position: location,
        map: map,
        icon: icon,
        draggable: draggable,
        oldposition: location,
        index: index,
        anchor: anchor
    });
	
	var line = new google.maps.Polyline({
        path: [marker.getPosition(), anchor],
        map: map,
        strokeColor: '#ffffff',
        strokeWeight: 1
      });
	
	rotatorLines.push(line);
    
	marker.position_changed = function() {
		update_rotator_line(line, this.get('position'), this.anchor);
      }
    
    var f2 = function (index) {
        return function () {
        	areacontainer_current = index;
            display();
            $(".context-menu").css('visibility','hidden');
        }
    };
    
    if(!(readonly)){
    	google.maps.event.addListener(marker, 'dragend', function(event){
    		dragRotation(this,event);
    	});
    	//google.maps.event.addListener(marker, 'click', f2(index, location, 10));
    	
    	google.maps.event.addListener(marker, 'rightclick', function(event){
        	polygonMenu(this,event);	            	
        });
    	google.maps.event.addListener(marker, 'click', f2(index));
    }
    
	return marker;
}


function update_rotator_line(line, position1, position2){
    // update the line
    line.getPath().setAt(0, position1);
    line.getPath().setAt(1, position2);
  }


function dragRotation(marker, event){
	
	areacontainer_current = marker.index;
	//console.log(marker.anchor);
	
	var initialPoint = marker.anchor;//areaAnchors[marker.index].position;
	var p1 = new LatLon(initialPoint.lat(),initialPoint.lng());
	var p2 = new LatLon(event.latLng.lat(),event.latLng.lng());
	
	var bearing = p1.finalBearingTo(p2);

	rotatePoly(marker.index, initialPoint, bearing)

	
	$(".context-menu").css('visibility','hidden');
}


function rotatePoly(index, pivotPoint, angle) {
	var newPath = [];
	var path = areacontainer[index];
	for (var p = 0 ; p < path.length ; p++) {
		var pt = transposePoint(path[p],pivotPoint,angle);
		newPath.push(pt);
	}
	areacontainer[index] = newPath;
	display();
}

function transposePoint(point,pivotPoint,angle) {
	
	var tmpXY = overlay.getProjection().fromLatLngToContainerPixel(pivotPoint);
	var centerX = parseFloat(tmpXY.x); 
	var centerY = parseFloat(tmpXY.y); 
	
	var tmpXY = overlay.getProjection().fromLatLngToContainerPixel(point);
	var theX = parseFloat(tmpXY.x);
	var theY = parseFloat(tmpXY.y);
	
	angle = parseFloat(angle);
	
	with(Math){
		if (centerX == 0 && centerY == 0) {
		    var newX = theX * cos(angle.toRad()) - sin(angle.toRad()) * theY;
		    var newY = theX * sin(angle.toRad()) + cos(angle.toRad()) * theY;
		} else {
		    var newX = (theX - centerX) * cos(angle.toRad()) - (theY - centerY) * sin(angle.toRad()) + centerX;
		    var newY = (theX - centerX) * sin(angle.toRad()) + (theY - centerY) * cos(angle.toRad()) + centerY;
		}
	}
	
	var tempPoint = new google.maps.Point(newX, newY);
	var pt = overlay.getProjection().fromContainerPixelToLatLng(tempPoint); 
	return pt;
	
}



function instructionsDialog(){
	
	$("#instructions-dialog").dialog({
		  width:600,
	      buttons : {	        
	        "Close" : function() {
	          $(this).dialog("close");
	        }
	      }
	    });

	    $("#instructions-dialog").dialog("open");
	    
	    $('.ui-dialog :button').blur();
	    
	    //$(window).trigger('resize');
	    
	    return false;
}



function fileDialog(){
	
	$("#file-dialog").dialog({
		  width:400,
	      buttons : {	        
	        "Close" : function() {
	          $(this).dialog("close");
	        }
	      }
	    });

	    $("#file-dialog").dialog("open");

	    $('.ui-dialog :button').blur();

	    return false;
}



function genKML(){
	
	if(areacontainer.length > 0){
		for(var i=0; i<areacontainer.length; i++){
			if(areacontainer[i].length > 0){
				var points = new Array(0);
				for(var j=0; j<areacontainer[i].length; j++){
					var point = areacontainer[i][j].lat()+','+areacontainer[i][j].lng();
					points.push(point);			
				}
				var temp = points.join('~');
				$('#export-form').append("<input type='hidden' name='overlay[]' value='"+temp+"' />");
				$('#export-form').append("<input type='hidden' name='label[]' value='"+areacontainer_labels[i]+"' />");
				$('#export-form').append("<input type='hidden' name='type[]' value='"+areacontainer_types[i]+"' />");
			}
		}
		
		//var params = $('#save-form').serialize();
		//var msg = eval($.ajax({async:false, url:'ajax/gen_kml.php?', cache:false, type:'POST', data: params}).responseText);
		//window.location = 'ajax/gen_kml.php?'+params;
		$('#export-form').submit();
		$('#export-form').html('');
	}else{
		var msg = Array(0);
		msg[0] = false;
		msg[1] = "Your map has no overlays. Please add at least one.";
		alert(msg[1]);
	}
			
	return false;
}


function placeSearchMarker(location) {

	deleteSearchMarker();
    
	var icon = new google.maps.MarkerImage('img/pin-red.png',
		new google.maps.Size(15, 27),
		new google.maps.Point(0,0),
		new google.maps.Point(7, 27));
	
	var shadow = new google.maps.MarkerImage('img/pin-shadow.png',
    	new google.maps.Size(25, 25),
    	new google.maps.Point(0,0),
    	new google.maps.Point(4, 33));
	
	var marker = new google.maps.Marker({
        position: location,
        map: map,
        shadow: shadow,
        icon: icon,
        draggable: false

    }); 
    
    google.maps.event.addListener(marker, 'rightclick', function(event){
		searchMarkerMenu(this, event);
	});

	marker.setOptions({
    	draggable: true
    });

    /*
    if(!(readonly)){
    		
    	google.maps.event.addListener(marker, 'dragend', f(index, number));
    	google.maps.event.addListener(marker, 'click', f2(index, number));
	
    
    	google.maps.event.addListener(marker, 'rightclick', function(event){
    		markerMenu(this, event);
    	});
    
    }
    */
    
    search_marker = marker;


}

function deleteSearchMarker(){
	if(search_marker != null){
		search_marker.setMap(null);
		search_marker = null;
	}
}
