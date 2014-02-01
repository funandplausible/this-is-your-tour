
import oauth2

# Fill in these values
consumer_key = 'wQ6cuUYw2zx2jdjyrcuT6Q'
consumer_secret = 'qFiImw5hPG4DXRUuvbFdVYhm0xU'
token = 'awkD_DPRGjDBoqEQdkzEO89wpBR3m11A'
token_secret = 'Da0aPjXbpJxA7BXG2lWlY7mvMlE'

consumer = oauth2.Consumer(consumer_key, consumer_secret)

search_term = "Concert arena"

url = 'http://api.yelp.com/v2/search?term=' + search_term + '&location=ny&sort=2&category_filter=musicvenues'

print 'URL: %s' % (url,)

oauth_request = oauth2.Request('GET', url, {})
oauth_request.update({'oauth_nonce': oauth2.generate_nonce(),
                      'oauth_timestamp': oauth2.generate_timestamp(),
                      'oauth_token': token,
                      'oauth_consumer_key': consumer_key})

token = oauth2.Token(token, token_secret)

oauth_request.sign_request(oauth2.SignatureMethod_HMAC_SHA1(), consumer, token)

signed_url = oauth_request.to_url()

print 'Signed URL: %s' % (signed_url,)
