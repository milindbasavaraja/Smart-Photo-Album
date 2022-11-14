import json
import boto3
import logging
from urllib.parse import unquote_plus
import datetime
import requests
import inflect

def lambda_handler(event, context):
    p = inflect.engine()
    log = logging.getLogger()
    log.setLevel(logging.INFO)
    logging.basicConfig(format = '%(asctime)s : %(levelname)s %(message)s')
    
    
    log.debug(f"Photo uploaded. The event: {event} is")
    bucket_name  = event['Records'][0]['s3']['bucket']['name']
    object_name  = unquote_plus(event['Records'][0]['s3']['object']['key'],encoding='utf-8')
    log.debug(f"Bucket Name: {bucket_name} ")
    log.debug(f"Photo Name {object_name}")
    
    #Connect to S3
    s3 = boto3.client("s3")
    labels = []
    try:
        response = s3.head_object(Bucket=bucket_name,Key=object_name)
        log.info(f"The response is: {response}")
        response_date_head = response['ResponseMetadata']
        http_headers_custom_labels = response_date_head['HTTPHeaders']
        if "x-amz-meta-customlabels" in http_headers_custom_labels:
            log.info(f"The http_headers_custom_labels labels are: {http_headers_custom_labels}")
            custom_labels_list = http_headers_custom_labels['x-amz-meta-customlabels']
            if custom_labels_list is not None:
                custom_label = custom_labels_list.split(",")
                log.info(f"The custom labels are: {custom_label}")
                labels.extend(custom_label)
        
        #connect to rekognition
        log.info("Detecting image via rekognition")
        rekognition = boto3.client("rekognition")
        rekognition_response = rekognition.detect_labels(
            Image = {"S3Object":{"Bucket":bucket_name,"Name":object_name}},
            MaxLabels = 10,
            MinConfidence = 90
        )
        log.info(f"The response from rekognition is {rekognition_response}")
        
        rekognition_labels = rekognition_response['Labels']
        log.info(f"The response from rekognition labels is {rekognition_labels}")
        for label in rekognition_labels:
            log.info(f"The label is: {label}")
            labels.append(label['Name'])
        log.info(f"The labels are: {labels}")
    except Exception as exception:
        log.error(f"The error is: {exception}")
    
    log.info("Checking if labels are singular and plural")
    all_labels = set()
    for label in labels:
        if p.singular_noun(label) == False:
            log.info(f"Converting {label} into plural form")
            plural_label = p.plural(label)
            log.info(f"The plural label for {label} is {plural_label}")
            all_labels.add(label.strip())
            all_labels.add(plural_label.strip())
        else:
            log.info(f"The given label {label} is in plural form")
            singular_label = p.singular_noun(label)
            log.info(f"The singular label for {label} is {singular_label}")
            all_labels.add(label)
            all_labels.add(singular_label)
        
    log.info(f"The alllabels are: {all_labels}")
                
    
    elastic_data = {
        'objectKey' : object_name,
        'bucket' : bucket_name,
        'createdTimestamp' :  datetime.datetime.now().isoformat(),
        'labels' : list(all_labels)
        }
    
    
    open_search_url = "https://search-search-photos-62djxdxszlotn545pzoae4oowq.us-east-1.es.amazonaws.com"
    path = "/photos/_doc"
    open_search_url = open_search_url+path
    open_search_response = requests.post(open_search_url,auth=('Milind','Milind@123'),json = elastic_data) 
    log.info(f"Uploaded data to elastic {open_search_response.json()}")
    
    
    # TODO implement
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
