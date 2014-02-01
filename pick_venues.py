import requests
import os
import json
import sys


class VenueFinder:
    def __init__(self, songkick_api_key):
        self.songkick_api_key = songkick_api_key

    def get_nth_biggest_venue(self, city, n):
        return sorted(self.get_venues(city), key=lambda x: x["capacity"], reverse=True)[n]

    def get_venues(self, city):
        venues = []
        print city
        for i in xrange(1,3):
            raw_response    = requests.get("http://api.songkick.com/api/3.0/search/venues.json?query=" + city + "&page=" + str(i) + "&apikey=" + self.songkick_api_key).text
            parsed_response = json.loads(raw_response)
            venues += parsed_response["resultsPage"]["results"]["venue"]

        return venues


if __name__ == "__main__":
    songkick_api_key = os.environ["SONGKICK_API_KEY"]
    cities = sys.argv[1:]
    venues = []
    vf = VenueFinder(songkick_api_key)
    for idx, city in enumerate(cities):
        city = city.split("(")[0]
        city = " ".join(city.split(" ")[:-1])
        city = city.split("-")[0]
        venues.append(vf.get_nth_biggest_venue(city, idx))


    print [(x["displayName"], x["id"]) for x in venues]
