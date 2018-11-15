

# Architecture

![Architecture](docs/arch.png "Architecture")

## Deploy
`AWS_ACCESS_KEY_ID=Axxxxxx AWS_SECRET_ACCESS_KEY=Jxxxxxxxxx npm run deploy`


## Curl to upload to S3

```sh
curl -X PUT -T ./__tests__/jsons/3.json \
 -H "Content-Type: application/json"  -H "x-amz-meta-pract: Jane" -H "x-amz-meta-returnControl: 0" \
 http://localhost:8000/qi-sync-battery-local-resultsjson/resultJsons/1001/data.json
```

or aws s3 cli
```sh
 AWS_ACCESS_KEY_ID=Axxxxxxx AWS_SECRET_ACCESS_KEY=xxxxxx \
 aws s3 cp __tests__/jsons/3.json s3://my-tars/resultJsons/1000.json --content-type application/json --metadata=pract=Jane,returnControl=0
```

or full curl command -
```sh
date=`date +%Y%m%d`
dateFormatted=`date -R`
s3Bucket="BUCKET_OF_S3_SERVER"
fileName="FILE_NAME"
relativePath="/${s3Bucket}/${fileName}"
contentType="application/octet-stream"
stringToSign="PUT\n\n${contentType}\n${dateFormatted}\n${relativePath}"
s3AccessKey="ACCESS_KEY_OF_S3_SERVER"
s3SecretKey="SECRET_KEY_OF_S3_SERVER"
signature=`echo -en ${stringToSign} | openssl sha1 -hmac ${s3SecretKey} -binary | base64`
curl -X PUT -T "${fileName}" \
-H "Host: ${s3Bucket}.s3.amazonaws.com" \
-H "Date: ${dateFormatted}" \
-H "Content-Type: ${contentType}" \
-H "Authorization: AWS ${s3AccessKey}:${signature}" \
 
http://${s3Bucket}.s3.amazonaws.com/${fileName}
```