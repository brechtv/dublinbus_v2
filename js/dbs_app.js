$(document).ready(function() {
    $body = $("body");
    var a;
    $(document).ajaxStart(function() {
        a = setTimeout(function() {
            $body.addClass("loading");
        }, 200)
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
    input = input;
    var regex = /^[a-zA-Z]+$/;
    if (input.length <= 6 && !input.match(regex)) {
        for (var a = 0; a < bus_stops_array.length; a++) {
            if(bus_stops_array[a] === input) {
                clickThroughToStop(input);
                var ls_stops = [];
                localStorage.getItem("dbl_last_stops") == null ? ls_stops = [] : ls_stops = JSON.parse(localStorage.getItem("dbl_last_stops"));
                ls_stops.unshift(input);
                ls_stops = ls_stops.filter(function(item, pos, self) {
                        return self.indexOf(item) == pos;
                    })
                if(ls_stops.length > 5) {ls_stops.length = 5};
                localStorage.setItem("dbl_last_stops", JSON.stringify(ls_stops))
            }
        };
    } else {
        geocodeAddress(input);
    }
}

// IF INPUT IS ADDRESS
function addressSearch() {
    input = $("#input2").val();
    geocodeAddress(input)
}

function geocodeAddress(input) {
    address = input + ", Dublin, Ireland";
    (new google.maps.Geocoder).geocode({
        address: address
    }, function(a, b) {
        "OK" === b ? chooseStop(a[0].geometry.location.lat(), a[0].geometry.location.lng()) : (console.log("Geocode was not successful for the following reason: " + b), alert("Could not find address! Try a different query."))
    })
}

// CREATE MODAL
function chooseStop(a, c) {
    $("#overlay").addClass("map_overlay");
    $("#stop_picker").dialog("open");
    var b = 0.9 * $(window).width(),
        d = 0.9 * $(window).height();
    $("#stop_picker").dialog({
        modal: !0,
        width: b,
        height: d,
        close: function() {
            $("#overlay").removeClass("map_overlay")
        }
    });
    $("#stop_picker").append($("<div id='stoppickermap' class='remove' style='height: 100%; width:100%;'></div>"));
    getStopPickerMap(a, c)
}

// CREATE MAP FOR MODAL
function getStopPickerMap(a, c) {
    var b, d = new google.maps.LatLng(a, c);
    b = new google.maps.Map(document.getElementById("stoppickermap"), {
        center: d,
        zoom: 17,
        styles: mapstyles,
        gestureHandling: 'greedy'
    });
    var f;
    $.each(bus_stops_extd, function(a, e) {
        busstop_pos = new google.maps.LatLng(e.lat, e.lng);
        if (650 > google.maps.geometry.spherical.computeDistanceBetween(busstop_pos, d)) {
            var c = e.routes.split(","),
                g = "";
            $.each(c.slice(0, 10), function(a, b) {
                g += '<span class="mdl-chip" style="margin-right: 2px; background-color: #3F51B5; color:#FFEB3B;"><span class="mdl-chip__text">' +
                    b + "</span></span>"
            });
            f = '<div><p style="font-size: 16px;"><strong>' + e.stopname + "</strong> - stop id: " + e.stopid + "</p></div><div>" + g + '</div><div>(possibly more, please see live departures)</div><br><a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" onclick="clickThroughToStop(\'' + e.stopid + "')\">Live departures</a>";
            var k = new google.maps.InfoWindow({
                    content: f
                }),
                h = new google.maps.Marker({
                    position: busstop_pos,
                    map: b,
                    icon: "file/testpole1.png",
                    label: {
                        text: e.stopid,
                        fontWeight: "bold",
                        fontSize: "10px"
                    }
                });
            h.addListener("click", function() {
                k.open(b, h)
            })
        }
    });
    new google.maps.Marker({
        position: d,
        map: b
    })
}

// SELECT STOP
function clickThroughToStop(a) {
    refresh();
    getBusInfo(a);
    getStopInfo(a);
}

// GET RT BUS INFO
function getBusInfo(a) {
        $.getJSON("https://bvcors.herokuapp.com/https://data.dublinked.ie/cgi-bin/rtpi/realtimebusinformation?stopid=" + a + "&format=json?callback?", function(json) {
            if (json.errorcode == 0) {
                processBusData(json)
            } else {
                console.log("failed to retrieve stop info")
            }
        });
}
function processBusData(a) {
    $("#bus_info").html('<span id="stop_number">Stop Number: ' + a.stopid + '</span><div class="mdl-layout-spacer"></div><div class="mdl-layout-spacer"></div><div>Last updated: ' + a.timestamp + "</div");
    $("#results_table").append($("<div id='response'></div>"));
    "No Results" == a.errormessage && (console.log(a.errormessage), $("#row_results").append($('<tr><td colspan="3" style="text-align:center; ">No busses found! \u2639</td></tr>')));
    $.each(a.results, function(a, b) {
        duetime_suffix = "Due" !=
            b.duetime ? " min" : "";
        retard = b.duetime - b.departureduetime;
        $("#row_results").append($('<tr><td class="mdl-data-table__cell--non-numeric">' + b.route + '</td><td class="mdl-data-table__cell--non-numeric">' + b.destination + '</td><td class="mdl-data-table__cell--non-numeric">' + b.duetime + "" + duetime_suffix + "</td></tr>"))
    })
}

// GET STOP INFO
function getStopInfo(a) {
    $.getJSON("https://bvcors.herokuapp.com/https://data.dublinked.ie/cgi-bin/rtpi/busstopinformation?stopid=" + a + "&format=json?callback?", function(json) {
        if (json.errorcode == 0) {
            processStopData(json)
        } else {
            console.log("failed to retrieve stop info")
        }
    });
}
function processStopData(a) {
    "No Results" == a.errormessage && (console.log(a.errormessage), $("#bus_stop_name").append($('<span id="stop_name">Not found.</span>')));
    $.each(a.results, function(a, b) {
        stop_name = "" != b.shortname ? b.shortname : "Not found.";
        $("#bus_stop_name").append($('<span id="stop_name"><strong>' + stop_name + '</strong></span><span class="remove" style="margin-left: 5px"><button class="mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect" onclick="clickThroughToStop(' + b.stopid + ')"><i class="material-icons">refresh</i></button></span> <span class="remove" style="margin-left: 5px"><button class="mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect" onclick="location.href = `index.html`;"><i class="material-icons">home</i></button></span>'));
        $("#topleft").append($('<div class="searchbox2 remove"><input class="searchfield2" placeholder="Search" type="text" id="input2"></div>'))
        lat = parseFloat(b.latitude);
        lng = parseFloat(b.longitude);
        drawMap(lat, lng);
        maps_url = "https://www.google.ie/maps/?q=" + b.latitude + "," + +b.longitude;
        maps_html = "<button class='remove mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect' onclick=\"window.location.href='" +
            maps_url + "'\"><i class='material-icons'>directions</i></button>";
        $("#links").append($(maps_html));
        $.each(b.operators, function(a, b) {
            $.each(b.routes, function(a, b) {
                $("#chips").append($('<span class="mdl-chip chip" style="margin:3px; background-color:#f0f0f0; color: #3F51B5;"><span class="mdl-chip__text">' + b + "</span></span>"))
            })
        })
        $("#input2").keypress(function(a) {
            if (a.keyCode == 13) {
                triageInput($("#input2").val());
            }
        });
    })
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
        icon: "file/pole32.png"
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
    results_table = '<table id="results_table" class="mdl-data-table mdl-js-data-table mdl-shadow--2dp" style="width:100%;"><thead><tr><th class="mdl-data-table__cell--non-numeric">Bus</th><th class="mdl-data-table__cell--non-numeric">Destination</th><th class="mdl-data-table__cell--non-numeric">Due in</th></tr></thead><tbody id="row_results"></tbody></table>';
    $("#results_body").append(results_table)
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
