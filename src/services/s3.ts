import { S3, AWSError } from "aws-sdk";
import { Service } from "typedi";

const BUCKET_NAME: string = process.env.BUCKET as string;
const S3_ENDPPOINT: string = process.env.S3_DOMAIN as string;

@Service()
export class S3Service {

    private s3: S3;

    constructor() {
        this.s3 = new S3({
            s3ForcePathStyle: true,
            endpoint: process.env.S3_DOMAIN as string
        });
    }


    public async readObjectAsText(objectName: string, bucket: string  = BUCKET_NAME) : Promise<string> {
        return new Promise<string>((res, rej) => {
            this.s3.getObject({
                Bucket: bucket,
                Key: objectName
            }, (err: AWSError, data: S3.Types.GetObjectOutput) => {
                if (err || !data.Body) {
                    rej(err || `s3 object ${objectName} does not have a body`);
                    return;
                }

                res(data.Body.toString());
            });
        });
    }
}