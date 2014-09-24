import requests
import subprocess
from bs4 import BeautifulSoup
from urllib2 import urlopen

def get_url(url):
    return urlopen(url).read()

class YelpRequester:
    def find_best_thing(self, category, place):
        root_url = "http://www.yelp.co.uk/search?find_desc=" + category + "&find_loc=" + place + "&ns=1&#sortby=rating"
        root_url = root_url.replace(" ", "%20")
        response = get_url(root_url)
        soup = BeautifulSoup(response)
        best_place = soup.findAll(attrs={"class":"biz-name"})[1]
        next_url = "http://www.yelp.com/" + best_place.attrs["href"]
        next_url = next_url.replace(" ", "%20")
        response = get_url(next_url)
        soup = BeautifulSoup(response)
        if list(soup.findAll(attrs={"id":"bizUrl"})):
            url = "http://" + list(soup.findAll(attrs={"id":"bizUrl"})[0].children)[1].text
        else:
            url = ""


        return {"name": best_place.text, "url": url}

if __name__ == "__main__":
    y = YelpRequester()
    print y.find_best_thing("hotels", "New York NY")

