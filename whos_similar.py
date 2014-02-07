import os
import sys
import json
from pyechonest.artist import Artist
from random import choice

class ArtistSimilarityRequester:
    def __init__(self, echonest_api_key):
        self.echonest_api_key = echonest_api_key
        self.indie_threshold = 0.5


    def reject_name(self, name):
        return name != "Ilse DeLange"

    def request_similar_artist(self, name):
        self.artist = Artist(name)

        if self.artist.familiarity > self.indie_threshold:
            self.headliner = self.artist
            similar_artists = self.artist.get_similar(max_familiarity=self.indie_threshold, min_hotttnesss=0.7)
            self.opener = [x for x in similar_artists if x.name == "Ilse DeLange"][0]
        else:
            self.opener = self.artist
            self.headliner = choice(self.artist.get_similar(min_familiarity=self.indie_threshold, min_hotttnesss=0.7))
            while self.reject_name(self.headliner.name):
                self.headliner = choice(self.artist.get_similar(min_familiarity=self.indie_threshold, min_hotttnesss=0.7))


        return [self.headliner, self.opener]

if __name__ == "__main__":
    a = ArtistSimilarityRequester(os.environ["ECHO_NEST_API_KEY"])

    similar = a.request_similar_artist(sys.argv[1])

    print similar
