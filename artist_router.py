import os
import sys
import json
import requests
from collections import Counter

class ArtistRouter:
    def __init__(self, api_key):
        self.api_key = api_key
        self.artist_cities = {}
        self.code_lookup = {}

    def pick_popular_cities(self, continent, artists):
        self.continent = continent
        self.artists = artists

        self.populate_artist_cities()
        self.filter_cities_by_continent()
        return [x[0] for x in self.best_cities()]

    def best_cities(self):
        city_scores = Counter()
        for artist in self.artists:
            for city in self.artist_cities[artist]:
                city_scores[city["city"]] += city["score"]

        return city_scores.most_common(10)

    def filter_cities_by_continent(self):
        for artist in self.artist_cities:
            self.artist_cities[artist] = [x for x in self.artist_cities[artist] if x["country_code"] == self.continent]

    def populate_artist_cities(self):
        for artist in self.artists:
            self.artist_cities[artist] = self.retreive_cities(artist)

    def retreive_cities(self, artist_name):
        raw_response = json.loads(
            requests.get(
                "http://api.semetric.com/artist/" + artist_name + "/downloads/bittorrent/location/city?token=" + self.api_key
            ).text
        )

        if raw_response["success"]:
            return [self.build_location_dict(location) for location in raw_response["response"]["data"]]
        else:
            return []

    def build_location_dict(self, location):
        if location["city"]["region"]["continent"].has_key("code"):
            code = self.code_lookup[location["city"]["region"]["continent"]["name"]] = location["city"]["region"]["continent"]["code"]
        else:
            code = self.code_lookup[location["city"]["region"]["continent"]["name"]]

        return {
            "city"         : location["city"]["name"],
            "continent"    : code,
            "country"      : location["city"]["region"]["country"]["name"],
            "country_code" : location["city"]["region"]["country"]["code"],
            "score"        : location["value"],
        }


class RouteOptimiser:
    def __init__(self, cities):
        self.cities = cities

    def optimise_route(self):
        return self.parse_routes(self.request_optimal_locations(self.cities))

    def parse_routes(self, response):
        return [self.cities[x] for x in response["routes"][0]["waypoint_order"]]

    def request_optimal_locations(self, cities):
        return json.loads(requests.get("http://maps.googleapis.com/maps/api/directions/json?waypoints=optimize:true|" + "|".join(cities) + "&sensor=false").text)


if __name__ == "__main__":
    a = ArtistRouter(os.environ["MUSICMETRIC_API_KEY"])

    if len(sys.argv) < 3:
        print "usage is [continent] [artists]"
    else:
        cities = a.pick_popular_cities(sys.argv[1], sys.argv[2:])
        print sorted(cities)
        values = RouteOptimiser(cities).optimise_route()

        print [x for x in cities if x not in values][0]

        for x in values:
            print x

        print [x for x in cities if x not in values][1]
