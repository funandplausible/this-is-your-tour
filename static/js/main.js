$(document).ready(function() {
    var QueryString = function () {
        // This function is anonymous, is executed immediately and
        // the return value is assigned to QueryString!
        var query_string = {};
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            // If first entry with this name
            if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = pair[1];
                // If second entry with this name
            } else if (typeof query_string[pair[0]] === "string") {
                var arr = [ query_string[pair[0]], pair[1] ];
                query_string[pair[0]] = arr;
                // If third or later entry with this name
            } else {
                query_string[pair[0]].push(pair[1]);
            }
        }
        return query_string;
    } ();

    $("#name").focus();
    if (typeof(QueryString.artist_name) != 'undefined') {
        $("#name").val(QueryString.artist_name.replace("%20", " "));
    }

    var artist_ids = [];
    var autoScroll = true;

    function scrollTo(selector) {
        if (autoScroll) {
            $.scrollTo(selector, 1800);
        }
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
            setTimeout(function() {
                addLineToMap(locations[i-1], locations[i], map);
            }, 250);
        }
        var marker = new google.maps.Marker({
            map: map,
            position: locations[i],
            animation: google.maps.Animation.DROP,
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


        var images = "";
        var texts = "";
        $.each(response, function(key, value) {
            images += '<img class="thing-icon"  src="' + category_icons[key] + '">',
            texts += [
                "<div class='thing-text'>",
                category_copy[key],
                ' <a href="' + value.url + '">',
                value.name,
                '</a>',
                "</div>",
            ].join("\n");

        });

        build = [
            '<div class="thing-to-do">',
            '<div class="thing-to-do-images">',
            images,
            '</div><hr>',
            texts,
            '</div>',
        ].join("\n");

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

    function handle_map_show() {
        $("#another-loading").text("Working");
        $.get("/tour_cities?artist_ids=" + artist_ids.join(","), function(response) {
            $("#another-loading").text("");
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
            for (i = 0; i < cities.length; i++) {
                var location_name = cities[i];

                (function(location_name) {
                    $.get("/city_things?city_name=" + location_name, function(response) {
                        console.log("cached" + location_name)
                    });
                })(location_name);
            }

            var location_wind_speed = 1000;

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
                }, location_wind_speed);
            });
        });
    }

    $("#show-big-map").click(function() {
        handle_map_show();
    });

    function showFinalSlide() {
        var build = [
        '<a href="https://twitter.com/share" class="twitter-share-button" data-text="I\'ve just planned a tour for '+ $("#name").val() +' using This is your Tour at http://thisisyourtour.funandplausible.com/?artist_name=' + $("#name").val().replace(" ", "%20") +'" data-via="funandplausible" data-hashtags="musichackday">Tweet</a>',
        "<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>",
            ].join("\n");
        $("#twitter-link").html(build);
        $("#link-box").val('http://thisisyourtour.funandplausible.com/?artist_name=' + $("#name").val().replace(" ", "%20"))
        $("#finalslide").show();
        scrollTo($("#finalslide"));
    }

    var location_index = 0;
    function showLocationDialogue() {
        if (location_index == cities.length) {
            $("#final-show").text($("#name").val() + ": This is your tour");
            setTimeout(showFinalSlide, 1000);
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
                        var title_id = "title" + location_index;
                        var templated = [
                        "<div id='" + title_id + "' class='text-center location-title'>",
                        "<h1>Stop " + (location_index+1) + ": " + location_name + "</h1>",
                        "</div>",
                        "<div id='" + div_id + "' class='row'>",
                        "<div class='row'>",
                        "<div class='col-md-6 noverflow' style='background:url(" + city_picture_url +"); background-size:cover; height:50vh; padding:0px;'>",
                        "<div class='black-hover-bottom'>The city: " + location_name + "</div>",
                        "</div>",
                        "<div class='col-md-6 noverflow' style='background:url(" + city_map_url +"); background-size:cover; height: 50vh;'>",
                        "</div>",
                        "</div>",
                        "<div class='row'>",
                        "<div class='col-md-6 noverflow middlish' height: 50vh;'>",
                        "<div class='middleish-inner'>",
                        "<h1>Things to do</h1>",
                        go_to_places(response),
                        "</div>",
                        "</div>",
                        "<div class='col-md-6 noverflow' style='background:url(" + venue_picture_url +"); background-size:cover; height:50vh; padding:0px;'>",
                        "<div class='black-hover-bottom venue-text'>The venue: " + venue_name + "</div>",
                        "</div>",
                        "</div>",
                        "</div>",
                        ].join("\n");
                    $("#stops").append(templated);
                    scrollTo($("#" + div_id));
                    setTimeout(function() {
                        location_index++;
                        showLocationDialogue();
                    }, 8000);
                    });
                });
            });
        });
    }

    $("#name").keyup(function(event){
        if(event.keyCode == 13){
            $("#plan").click();
        }
    });

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
            var me_copy = "";
            var other_party_image = "";
            var me_image = "";
            artist_ids.push(headliner.musicbrainz_id);
            artist_ids.push(opener.musicbrainz_id);

            if (headliner.name == $("#name").val()) {
                other_party_copy = "They're an indie sensation, who'll be opening for you";
                other_party_image = opener.image;
                other_party_name = opener.name;
                me_image = headliner.image;
                me_copy = headliner.name;
            } else {
                other_party_copy = "They're a superstar who makes music just like you";
                other_party_image = headliner.image;
                other_party_name = headliner.name;
                me_image = opener.image;
                me_copy = headliner.name;
            }

            $("#who-with").css(
                {
                    "background-image":"url(" + other_party_image +")",
                    "background-size":"cover",
                }
            );
            $("#who-me").css ({
                "background-image":"url(" + me_image +")",
                "background-size":"cover",
                }
            )
            $("#who2").html("<h1>You're " + me_copy + ". Let's plan you a tour!</h1>");
            $("#who-me").show();
            scrollTo($("#who-me"));
            setTimeout(function() {
                //$("#other-party").html("<img class='artist-image' src='" + other_party_image + "'>");
                $("#other-party-text").text(other_party_copy);
                $("#other-party-name").text(opener.name);
                $("#who-with").show();
                scrollTo($("#who-with"));
                setTimeout(function() {
                    handle_map_show();
                }, 3000);
            }, 3000);
        });
    });
});
