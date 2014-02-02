$(document).ready(function() {
    console.log("bees");
    var artist_ids = [];

    function scrollTo(selector) {
        $.scrollTo(selector, 800);
    }

    function addLineToMap(start, end, map) {
        var line = new google.maps.Polyline({
            path: [start, end],
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        line.setMap(map);
    }

    function drawLocation(locations, map, i) {
        if (i > 0) {
            addLineToMap(locations[i-1], locations[i], map);
        }
        var marker = new google.maps.Marker({
            map: map,
            position: locations[i],
        });
    }

    function go_to_places(response) {
        var category_icons = {
            "hotels"      : "static/img/hotel.png",
            "restaraunts" : "static/img/restaurant.png",
            "bars"        : "static/img/bar.png",
        };

        var category_copy = {
            "hotels"      : "Stay at",
            "restaraunts" : "Eat at",
            "bars"        : "Drink at",
        }

        var build = "";
        $.each(response, function(key, value) {
            build += '<div class="thing-icon"><img  src="' + category_icons[key] + '"></div>' + category_copy[key] + ' <a href="' + value.url + '">' + value.name + '</a><br>';
        });

        return build;
    }

    function geocodeLocationList(location_list, callback) {
        var geocoder = new google.maps.Geocoder();
        var coded_places = [];
        for (var i = 0; i < location_list.length; i++) {
            var place = location_list[i];
            geocoder.geocode({'address': place}, function(results, status) {
                coded_places.push(results[0].geometry.location);
                if (coded_places.length == location_list.length) {
                    callback(coded_places);
                }
            });
        }
    }

    var cities = [];

    $("#show-big-map").click(function() {
        $.get("/tour_cities?artist_ids=" + artist_ids.join(","), function(response) {
            if (typeof(response) === "string") {
                response = JSON.parse(response);
            }

            var mapOptions = {
                "center"            : new google.maps.LatLng(40, -100),
                "zoom"              : 5,
                "draggable"         : false,
                "scrollwheel"       : false,
                "streetViewControl" : false,
                "zoomControl"       : false,
                "panControl"        : false,
                "mapTypeControl"    : false
            };

            cities = response.order;

            var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
            var coded_places = 0;
            var locations = [];
            $("#places").show();
            scrollTo($("#places"));
            geocodeLocationList(response.order, function(locations) {
                var i = 0;

                var interval = setInterval(function() {
                    if (i == response.order.length) {
                        console.log("clearing");
                        clearInterval(interval);
                        showLocationDialogue();
                    } else {
                        console.log("here");
                        $("#destinations").text(response.order[i]);
                        drawLocation(locations, map, i);
                        i++;
                    }
                }, 1000);
            });
        });
    });

    function showFinalSlide() {
        $("#finalslide").show();
        scrollTo($("#finalslide"));
    }

    var location_index = 0;
    function showLocationDialogue() {
        if (location_index == cities.length) {
            showFinalSlide();
            return;
        }
        var location_name = cities[location_index];
        console.log(location_name);
        console.log("/city_map?city_name=" + location_name);
        $.get("/city_map?city_name=" + location_name, function(response) {
            if (typeof(response) === "string") {
                response = JSON.parse(response);
            }
            var city_map_url = response.url;
            $.get("/city_picture?city_name=" + location_name, function(response) {
                if (typeof(response) === "string") {
                    response = JSON.parse(response);
                }
                var city_picture_url = response.url;
                $.get("/city_venue?city_name=" + location_name + "&city_index=" + location_index, function(response) {
                    if (typeof(response) === "string") {
                        response = JSON.parse(response);
                    }

                    var venue_picture_url = response.picture_url;
                    var venue_name = response.name;

                    $.get("/city_things?city_name=" + location_name, function(response) {
                        if (typeof(response) === "string") {
                            response = JSON.parse(response);
                        }
                        var div_id = "locations_" + location_index;
                        var templated = [
                        "<div id='" + div_id + "' class='row'>",
                        "<div class='row'>",
                        "<div class='col-md-6 noverflow' style='background:url(" + city_picture_url +"); background-size:cover; height:50vh; padding:0px;'>",
                        "<div class='black-hover-bottom'>The city: " + location_name + "</div>",
                        "</div>",
                        "<div class='col-md-6 noverflow' style='background:url(" + city_map_url +"); background-size:cover; height: 50vh;'>",
                        "</div>",
                        "</div>",
                        "<div class='row'>",
                        "<div class='col-md-6 noverflow' height: 50vh;'>",
                        go_to_places(response),
                        "</div>",
                        "<div class='col-md-6 noverflow' style='background:url(" + venue_picture_url +"); background-size:cover; height:50vh; padding:0px;'>",
                        "<div class='black-hover-bottom'>The venue: " + venue_name + "</div>",
                        "</div>",
                        "</div>",
                        "</div>",
                        ].join("\n");
                    $("#stops").append(templated);
                    scrollTo($("#" + div_id));
                    setTimeout(function() {
                        location_index++;
                        showLocationDialogue();
                    }, 1000);
                    });
                });
            });
        });
    }

    $("#plan").click(function() {
        $("#spinner").show();
        $.get("/artist_info?artist_name=" + $("#name").val(), function(response) {
            $("#spinner").hide();
            if (typeof(response) === "string") {
                response = JSON.parse(response);
            }
            var headliner = response.headliner;
            var opener = response.opener;

            var other_party_copy = "";
            var other_party_image = "";
            artist_ids.push(headliner.musicbrainz_id);
            artist_ids.push(opener.musicbrainz_id);

            if (headliner.name == $("#name").val()) {
                other_party_copy = "They're an indie sensation, who'll be opening for you";
                other_party_image = opener.image;
                other_party_name = opener.name;
            } else {
                other_party_copy = "They're a superstar who makes music just like you";
                other_party_image = headliner.image;
                other_party_name = headliner.name;
            }

            $("#who-with").css(
                {
                    "background-image":"url(" + other_party_image +")",
                    "background-size":"cover",
                }
            )
            //$("#other-party").html("<img class='artist-image' src='" + other_party_image + "'>");
            $("#other-party-text").text(other_party_copy);
            $("#other-party-name").text(opener.name);
            $("#who-with").show();
            scrollTo($("#who-with"));
        });
    });
});