// fetch most recent stops
try {

    if (localStorage.getItem("dbl_remove_cards") == "true") {
        $(".dbl_remove_cards").remove();
        $("footer").remove();
    }

    preferred_stops = (localStorage.getItem("dbl_last_stops") == null ? [] : JSON.parse(localStorage.getItem("dbl_last_stops")));

    function DBS_clearStops() {
        localStorage.removeItem("dbl_last_stops");
        console.log("[DBS] Most recent stops cleared.")
    }

    console.info("[DBS] Most recent stops: " + (preferred_stops == "" ? "None" : preferred_stops) + ". Clear stops with `DBS_clearStops()`")
    console.info(`[DBS] Live data provided by the National Transport Authority.`)

    $(".mdl-card__actions").append(`<div id="chips"></div>`);

    for (i = 0; i < preferred_stops.length; i++) {
        $("#chips").append(`<span class="mdl-chip chip" style="margin:3px; background-color:#f0f0f0; color:#3F51B5;" onclick="clickThroughToStop(` + preferred_stops[i] + `)"><span class="mdl-chip__text">` + preferred_stops[i] + `</span></span>`)
    }
} catch (err) {
    console.log("[DBS] No recent stops found.")
}

// show times for last stop
try {

    var a;
    $(document).ajaxStart(function() {
        a = setTimeout(function() {
            $("#stuffs").append("<span id='suf'><img src='file/ajax-loader.gif'/ width='16px' height='16px'> Fetching live data ... </span>")
        }, 200)
    }).ajaxStop(function() {
        clearTimeout(a);
        $("#suf").remove()
    });

    last_stop = JSON.parse(localStorage.getItem("dbl_last_stops"))[0]
    quickLook(last_stop);
} catch (err) {
    console.log("[DBS] No recent stops found.")
}


function quickLook(a) {
    $.getJSON("https://bvcors.herokuapp.com/https://data.dublinked.ie/cgi-bin/rtpi/realtimebusinformation?stopid=" + a + "&format=json?callback?", function(json) {
        if (json.errorcode == 0) {

            $("#stuffs").append(`<div class="remove stop-card-wide mdl-card mdl-shadow--2dp" id="quickbuscontainer">
                            <div class="mdl-card__supporting-text" id="quickbusresults"><h2 class="mdl-card__title-text" id="bus_stop_name" style="color: #3F51B5; background-color: white; padding: 10px; border-radius: 5px;"><span><span style="color: #fff; background-color: #3F51B5; padding: 10px; border-radius: 5px;""><strong>
                            Stop ` + a + `</strong> Live Times</span>
                                </h2><br><span style="font-style: italic;">Showing bus times for your most recent stop.</span><br></div>
                        <div class="mdl-card__actions mdl-card--border"></div>
                                                <div class="mdl-card__menu">
                            <button class="mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect" onclick='$(this).parent().parent().remove(); localStorage.setItem("dbl_remove_cards", true)''>
                                <i class="material-icons md-dark">close</i>
                            </button>
                        </div>
                        </div>`)
            $("#quickbusresults").append(`<table id="quickbusresultstable" class="mdl-data-table mdl-js-data-table " style="width:100%;"><thead><tr><th class="mdl-data-table__cell--non-numeric">Bus</th><th class="mdl-data-table__cell--non-numeric">Destination</th><th class="mdl-data-table__cell--non-numeric">Due in</th></tr></thead><tbody id="row_results"></tbody><div id="response"></div></table>`);
            $.each(json.results, function(i, b) {
                if (i > 4) {
                    return
                }
                duetime_suffix = "Due" !=
                    b.duetime ? " min" : "";
                retard = b.duetime - b.departureduetime;
                $("#row_results").append($('<tr><td class="mdl-data-table__cell--non-numeric">' + b.route + '</td><td class="mdl-data-table__cell--non-numeric">' + b.destination + '</td><td class="mdl-data-table__cell--non-numeric">' + b.duetime + "" + duetime_suffix + "</td></tr>"))
            });
        } else {
            console.log("[DBS] Failed to retrieve stop info")
        }
    });
}
