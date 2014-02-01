import requests
import os
import sys
import json


class FlickrPhotoRequester:
    def __init__(self, flickr_api_key):
        self.flickr_api_key = flickr_api_key

    def get_venue_photo(self, target_image):
        raw_response = requests.get("http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=094749539632747531e59de509dd8dc6&text=" + target_image + "&sort=relevance&extras=views,url_o")
        raw_response = raw_response.text
        print raw_response


if __name__ == "__main__":
    flickr_api_key = os.environ["FLICKR_API_KEY"]
    venue = sys.argv[1]

    FlickrPhotoRequester(flickr_api_key).get_venue_photo(venue)
