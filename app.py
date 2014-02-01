from flask import Flask, request
from whos_similar import ArtistSimilarityRequester
from artist_router import ArtistRouter, RouteOptimiser
from pick_venues import VenueFinder
import os
import json
import urllib
import requests
import bs4

app = Flask(__name__)

class FlickrPhotoRequester:
    def __init__(self, flickr_api_key):
        self.flickr_api_key = flickr_api_key

    def get_photo(self, target_image):
        raw_response = requests.get("http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=" + self.flickr_api_key + "&text=" + target_image + "&sort=relevance&extras=views,url_o")
        raw_response = raw_response.text
        soup = bs4.BeautifulSoup(raw_response)
        photos = soup.find_all("photo")
        photos = [(x.attrs["url_o"], x.attrs["views"]) for x in photos if x.attrs.has_key("url_o")]
        return sorted(photos, key=lambda x: x[1], reverse=True)[0][0]

photo_requester = FlickrPhotoRequester(os.environ["FLICKR_API_KEY"])
asr = ArtistSimilarityRequester(os.environ["ECHO_NEST_API_KEY"])
ar = ArtistRouter(os.environ["MUSICMETRIC_API_KEY"])
vf = VenueFinder(os.environ["SONGKICK_API_KEY"])

@app.route("/artist_info", methods=["GET"])
def artist_info():
    headliner, opener = asr.request_similar_artist(request.args["artist_name"])
    return json.dumps(
        {
            "headliner": {
                "name": headliner.name,
                "image": headliner.images[0]["url"],
                "musicbrainz_id": headliner.get_foreign_id("musicbrainz").replace(":artist", ""),
            },
            "opener": {
                "name": opener.name,
                "image": opener.images[0]["url"],
                "musicbrainz_id": opener.get_foreign_id("musicbrainz").replace(":artist", ""),
            },
        }
    )

@app.route("/tour_cities", methods=["GET"])
def tour_cities():
    artist_ids = request.args["artist_ids"].split(",")
    cities = ar.pick_popular_cities("US", artist_ids)
    values = RouteOptimiser(cities).optimise_route()
    return json.dumps({"popularity": cities, "order":values})


@app.route("/city_picture", methods=["GET"])
def city_picture():
    city = request.args["city_name"]
    city = city.split("(")[0]
    city = " ".join(city.split(" ")[:-1])
    city = city.split("-")[0]
    city = city + " at night"
    return json.dumps({"url": photo_requester.get_photo(city)})

@app.route("/city_map", methods=["GET"])
def city_map():
    city = request.args["city_name"]
    city = city.split("(")[0]
    city = " ".join(city.split(" ")[:-1])
    city = city.split("-")[0]
    city = urllib.quote(city)
    return json.dumps({"url": "http://maps.googleapis.com/maps/api/staticmap?center=" + city + "&zoom=13&size=1024x1024&sensor=false"})


@app.route("/city_venue", methods=["GET"])
def city_venue():
    city = request.args["city_name"]
    city = city.split("(")[0]
    city = " ".join(city.split(" ")[:-1])
    city = city.split("-")[0]
    index = int(request.args["city_index"])
    venue = vf.get_nth_biggest_venue(city, index)
    return json.dumps({
        "name": venue["displayName"],
        "songkick_id": venue["id"],
    })

@app.route("/venue_picture", methods=["GET"])
def venue_picture():
    return json.dumps({"url": photo_requester.get_photo(request.args["venue_name"])})

@app.route("/city_things", methods=["GET"])
def city_things():
    raise "todo get from foursquare or yelp"

if __name__ == "__main__":
    app.debug = True
    app.run()
