from flask import Flask, request
from whos_similar import ArtistSimilarityRequester
from artist_router import ArtistRouter, RouteOptimiser
from pick_venues import VenueFinder
from yelp_requester import YelpRequester
import os
import json
import urllib
import requests
import bs4
import redis

def base_path():
    return os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)

class FlickrPhotoRequester:
    def __init__(self, flickr_api_key):
        self.flickr_api_key = flickr_api_key

    def get_photo(self, target_image):
        raw_response = requests.get("http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=" + self.flickr_api_key + "&text=" + target_image + "&sort=relevance&extras=views,url_o,url_c")
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
                "image": photo_requester.get_photo(headliner.name + " music"),
                "musicbrainz_id": headliner.get_foreign_id("musicbrainz").replace(":artist", ""),
            },
            "opener": {
                "name": opener.name,
                "image": photo_requester.get_photo(opener.name + " music"),
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
    try:
        venue_image = photo_requester.get_photo(venue["displayName"] + " " + city + " night")
    except:
        venue_image =  photo_requester.get_photo(venue["displayName"])

    return json.dumps({
        "name": venue["displayName"],
        "songkick_id": venue["id"],
        "picture_url": venue_image,
    })


city_things_cache = {}

@app.route("/city_things", methods=["GET"])
def city_things():
    city = request.args["city_name"]
    city = city.split("(")[0]
    state = city.split(" ")[-1]
    city = " ".join(city.split(" ")[:-1])
    city = city.split("-")[0]
    city = city + " " + state
    yr = YelpRequester()

    r = redis.StrictRedis(host='localhost', port=6379, db=0)

    categories = ["hotels", "restaraunts", "bars"]
    if r.get(city) is None:
        r.set(city, json.dumps({c: yr.find_best_thing(c, city) for c in categories}))

    return r.get(city)

@app.route("/")
def index():
    return open(base_path() + "/" + "templates/index.html").read()

if __name__ == "__main__":
    app.debug = True
    app.run(processes=25)
