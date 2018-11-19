

# Architecture

![Architecture](docs/arch.png "Architecture")

## AWS Presetup

### VPC , Security Groups and Subnets

- Create a VPC if not already
- Create couple of private subnets and a public subnet for this VPC with enough range of IPs
- Create a security group like `sync_lambda_sg` for denoting the lambda execution security group with no ingress and default exgress rules
- Create a security group like `rds_sg` for the RDS with inbound rules as
    * Postgres with port , Custom and the security group id of `sync_lambda_sg`. This allows lambda functions with this security group to access RDS
    * Add any other ingress rles for eg, a bastion host to access RDS etc
- Create or update RDS with the VPC , private subnets and the `rds_sg` security group
- RDS should be setup with proper creds

These allow the lambda functions to access RDS.

### S3 Access
To allow lambda to r/w and delete S3 objects we need to create an S3 endpoint for the VPC

- Create a vpc endpoint with the WS S3 services and select the private subnets in the above vpc. 

The above subnets and lambda security group are referenced in the `serverless.yml` file.


- follow https://blog.shikisoft.com/running-aws-lambda-in-vpc-accessing-rds/
- https://aws.amazon.com/blogs/aws/new-vpc-endpoint-for-amazon-s3/



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
 aws s3 cp __tests__/jsons/3.json s3://qi-sync-battery-dev-resultsjson/resultJsons/1000.json \
 --content-type application/json  --metadata=pract=Jane,returnControl=0
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