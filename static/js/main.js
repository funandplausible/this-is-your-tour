$(document).ready(function() {
    console.log("bees");
    var artist_ids = [];

    function scrollTo(selector) {
        $.scrollTo(selector, 800);
    }

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

            var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
            var geocoder = new google.maps.Geocoder();
            var coded_places = 0;
            var locations = [];
            $("#places").show();
            scrollTo($("#places"));
            google.maps.event.addListenerOnce(map, 'idle', function(){
                for (var i = 0; i < response.order.length; i++) {
                    var place = response.order[i];
                    geocoder.geocode({'address': place}, function(results, status) {
                        coded_places++;
                        locations.push(results[0].geometry.location);
                        if (coded_places == response.order.length) {
                            var i = 0;

                            var interval = setInterval(function() {
                                if (i == response.order.length) {
                                    console.log("clearing");
                                    clearInterval(interval);
                                } else {
                                    console.log("here");
                                    $("#destinations").text(response.order[i]);
                                    var marker = new google.maps.Marker({
                                        map: map,
                                        position: locations[i],
                                    });
                                    i++;
                                }
                            }, 1000);
                        }
                    });
                }
            });
        });
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
            var other_party_image = "";
            artist_ids.push(headliner.musicbrainz_id);
            artist_ids.push(opener.musicbrainz_id);

            if (headliner.name == $("#name").val()) {
                other_party_copy = "They'll open for you. You're headlining!";
                other_party_image = opener.image;
                other_party_name = opener.name;
            } else {
                other_party_copy = "You're opening, they're headlining";
                other_party_image = headliner.image;
                other_party_name = headliner.name;
            }

            $("#other-party").html("<img class='artist-image' src='" + other_party_image + "'>");
            $("#other-party-text").text(other_party_copy);
            $("#other-party-name").text(opener.name);
            $("#who-with").show();
            scrollTo($("#who-with"));
        });
    });
});
