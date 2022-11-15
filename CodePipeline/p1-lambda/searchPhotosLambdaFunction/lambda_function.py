import json
import logging
import boto3
import requests

log = logging.getLogger()
log.setLevel(logging.INFO)
logging.basicConfig(format = '%(asctime)s : %(levelname)s %(message)s')


def post_query_to_lex(query):

    lex = boto3.client('lex-runtime')
    lex_response = lex.post_text(
        botName = 'PhotosBot',
        botAlias = 'dev',
        userId = 'user',
        inputText = query
    )
    log.info(f"The response is: {lex_response}")
    labels = set()
    if "slots" not in lex_response:
        log.info(f"No photo collection for query {query}")
    else:
        log.info(f"The slots are {lex_response['slots']}")
        slots_dict = lex_response['slots']
        for key,value in slots_dict.items():
            if value is not None:
                value_labels = value.split('and')
                log.info(f"The different labels are {value_labels}")
                for v in value_labels:
                    labels.add(v)
    
    return labels
    

def retrieve_data_from_elastic(labels):
    log.info("Reading data from Elastic")
    region = "us-east-1"
    service = "es"
    domain_url = 'https://search-search-photos-62djxdxszlotn545pzoae4oowq.us-east-1.es.amazonaws.com/'
    index = "photos"
    url = domain_url + index + '/_search'
    elastic_response_list = []
    for label in labels:
        log.info(f"The label is {label}")
        query = {
            "query": {
                "multi_match": {
                    "query": label,
                    "fields": ["labels"]
                }
            }
        }
        headers = { "Content-Type": "application/json" }
        elastic_response = requests.get(url, auth=("Milind","Milind@123"), headers=headers, data=json.dumps(query))
        log.info(f"The elastic response is {elastic_response.json()}")
        elastic_response_list.append(elastic_response.json())
    s3_photos_keys = []
    for elastic_response in elastic_response_list:
        if elastic_response['hits'] is not None:
            response = elastic_response['hits']['hits']
            log.info(f"The photos metadata is: {response}")
            for photo in response:
                object_key = photo['_source']['objectKey']
                bucket = photo['_source']['bucket']
                if object_key not in s3_photos_keys:
                    s3_photos_keys.append(object_key)
    
    log.info(f"The photos file names are {s3_photos_keys}")
    
    #Appending s3 urls to photofile name
    s3_photos_urls = []
    s3_bucket_url = "https://my-photos-bucket-smart-photos.s3.amazonaws.com/"
    for photo in s3_photos_keys:
        url = s3_bucket_url+photo
        log.info(f"The s3 url for {photo} is {url}")
        s3_photos_urls.append(url)
    
    return s3_photos_urls

def lambda_handler(event, context):
    log.info(f"The even is {event}")
    query = event['queryStringParameters']['q']
    label = post_query_to_lex(query)
    log.info(f"The labels returned are {label}")
    if len(label) != 0:
        s3_photos_urls = retrieve_data_from_elastic(label)
    if not s3_photos_urls:
        return{
            'statusCode':404,
            'headers': {
                "Access-Control-Allow-Origin":"*",
                "Access-Control-Allow-Methods":"OPTIONS,GET",
                "Access-Control-Allow-Headers": "*"
                },
            'body': json.dumps('No Results found. Please put other search text')
        }
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,GET'
        },
        'body': json.dumps(s3_photos_urls)
    }
