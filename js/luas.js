// EVENT LISTENERS
$(document).ready(function() {
    $body = $("body");
    var a;
    $(document).ajaxStart(function() {
        a = setTimeout(function() {
            $body.addClass("loading")
        }, 500)
    }).ajaxStop(function() {
        clearTimeout(a);
        $body.removeClass("loading");
    });

    $("#input").keypress(function(a) {
        if (a.keyCode == 13) {
            triageInput($("#input").val());
        }
    });
});

// TRIAGE INPUT
function triageInput(input) {

    var stop;

    try {

        stop = luas_stops.filter(function (el) {return el.name == input});
        console.log(stop)

        if (stop.length != 0) {getLuasInfo(stop[0])}

        else {

        stop = luas_stops.filter(function (el) {return el.abbreviation == input})
        console.log(stop)
        if (stop.length != 0) {getLuasInfo(stop[0])}

        else {$("#input").val("Not Found.")}

        }
    } catch(err) {
        $("#input").val(err)
    }
}

function getLuasInfo(stop) {
  stop_id = stop.abbreviation

    lat = parseFloat(stop.latitude);
    lng = parseFloat(stop.longitude);
    drawMap(lat, lng);
    maps_url = "https://www.google.ie/maps/?q=" + stop.latitude + "," + +stop.longitude;
    maps_html = "<button class='remove mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect' onclick=\"window.location.href='" +
        maps_url + "'\"><i class='material-icons'>directions</i></button>";
    $("#links").append($(maps_html));

  refresh();
  $.get( "http://luasforecasts.rpa.ie/xml/get.ashx?action=forecast&stop=" + stop_id + "&encrypt=false", function( data ) {
    xmlDoc = $.parseXML( data );
    var response_json = xmlToJson(xmlDoc)
    var stop_name = response_json.stopInfo.attributes.stop
    var direction = response_json.stopInfo.direction
    var updated = response_json.stopInfo.attributes.created

    $("#luas_info").html('<span id="stop_number">Stop: ' + stop_name + '</span><div class="mdl-layout-spacer"></div><div class="mdl-layout-spacer"></div><div>Last updated: ' + updated + "</div");
    $("#luas_stop_name").append($('<span id="stop_name"><strong>' + stop_name + '</strong></span><span class="remove" style="margin-left: 5px"><button class="mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect" onclick="triageInput(`' + stop_id + '`)"><i class="material-icons">refresh</i></button></span>'));


    $("#row_results").append($('<tr style="background-color: #f5f5f5;"><td class="mdl-data-table__cell--non-numeric">' + "" + '</td><td class="mdl-data-table__cell--non-numeric"></td><td class="mdl-data-table__cell--non-numeric"></td></tr>'))

    $.each(direction[0].tram, function(i,v) {
        try {
            $("#row_results").append($('<tr><td class="mdl-data-table__cell--non-numeric">' + v.attributes.destination + '</td><td class="mdl-data-table__cell--non-numeric">' + v.attributes.destination + '</td><td class="mdl-data-table__cell--non-numeric">' + v.attributes.dueMins + "</td></tr>"))
        } catch(err) {}
    })

    $("#row_results").append($('<tr style="background-color: #f5f5f5;"><td class="mdl-data-table__cell--non-numeric">' + "" + '</td><td class="mdl-data-table__cell--non-numeric"></td><td class="mdl-data-table__cell--non-numeric"></td></tr>'))

    $.each(direction[1].tram, function(i,v) {
        try {
            $("#row_results").append($('<tr><td class="mdl-data-table__cell--non-numeric">' + v.attributes.destination + '</td><td class="mdl-data-table__cell--non-numeric">' + v.attributes.destination + '</td><td class="mdl-data-table__cell--non-numeric">' + v.attributes.dueMins + "</td></tr>"))
        } catch(err) {}
    })
      $("#input2").keypress(function(a) {
            if (a.keyCode == 13) {
                triageInput("a");
            }
        });

    $("#topleft").append(`<a href="luas.html" class="remove"><i class="material-icons">home</i></a>`)
  });

}


// DRAW MAP
function drawMap(a, c) {
    $("#map").height(176);
    var b = {
            lat: a,
            lng: c
        },
        d = new google.maps.Map(document.getElementById("map"), {
            zoom: 17,
            center: b,
            styles: mapstyles
        });
    (new google.maps.TransitLayer).setMap(d);

    new google.maps.Marker({
        position: b,
        map: d,
        icon: "file/trampole.png"
    });
    d.panTo(b)
}


// REFRESH UI
function refresh() {
    $(".remove").remove();
    $("#results_table").remove();
    $("#stop_number").remove();
    $("#stop_name").remove();
    $("#initial_stop_name").remove();
    $(".mdl-chip").remove();
    $("#dialog").dialog("close");
    $("#stop_picker").dialog("close");
    results_table = '<table id="results_table" class="mdl-data-table mdl-js-data-table mdl-shadow--2dp" style="width:100%;"><thead><tr><th class="mdl-data-table__cell--non-numeric">Tram</th><th class="mdl-data-table__cell--non-numeric">Destination</th><th class="mdl-data-table__cell--non-numeric">Due in</th></tr></thead><tbody id="row_results"></tbody></table>';
    $("#results_body").append(results_table)
}

function xmlToJson(xml) {
    var obj = {};
    if (xml.nodeType == 1) {
        if (xml.attributes.length > 0) {
        obj["attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) {
        obj = xml.nodeValue;
    }
    if (xml.hasChildNodes() && xml.childNodes.length === 1 && xml.childNodes[0].nodeType === 3) {
        obj = xml.childNodes[0].nodeValue;
    }
    else if (xml.hasChildNodes()) {
        for(var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof(obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof(obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}

var mapstyles = [{
        "featureType": "poi.business",
        "stylers": [{
            "visibility": "off"
        }]
    },
    {
        "featureType": "road",
        "elementType": "labels.icon",
        "stylers": [{
            "visibility": "off"
        }]
    },
    {
        "featureType": "transit",
        "stylers": [{
            "visibility": "on"
        }]
    },
    {
        "featureType": "water",
        "stylers": [{
            "color": "#2196f3"
        }]
    }
];
