import { S3, AWSError } from "aws-sdk";
import { Service } from "typedi";
import { JsonUpload } from "@sync/model";

const BUCKET_NAME: string = process.env.BUCKET as string;

@Service()
export class S3Service {

    private s3: S3;

    constructor() {
        this.s3 = new S3({
            s3ForcePathStyle: true,
            endpoint: process.env.S3_DOMAIN as string
        });
    }


    public async readObjectAsText(objectName: string, bucket: string  = BUCKET_NAME) : Promise<JsonUpload> {
        return new Promise<JsonUpload>((res, rej) => {
            this.s3.getObject({
                Bucket: bucket,
                Key: objectName
            }, (err: AWSError, data: S3.Types.GetObjectOutput) => {
                if (err || !data.Body) {
                    rej(err || `s3 object ${objectName} does not have a body`);
                    return;
                }
                const userName: string = data.Metadata? data.Metadata["pract"]: 'anon';
                const returnControl: boolean = data.Metadata ? "1" === data.Metadata["returncontrol"] : false;
                res({
                    json: data.Body.toString(),
                    userName,
                    returnControl
                });                
            });
        });
    }
}