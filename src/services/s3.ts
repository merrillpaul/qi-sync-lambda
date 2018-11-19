import { S3, AWSError } from "aws-sdk";
import { Service } from "typedi";
import { JsonUpload } from "@sync/model";

const BUCKET_NAME: string = process.env.BUCKET as string;

@Service()
export class S3Service {

    private s3: S3;

    constructor() {
        let s3Config : any = {};
        if (process.env.S3_DOMAIN ) { // just for local s3 emulation with offline mode
            s3Config = {
                s3ForcePathStyle: true,
                endpoint: process.env.S3_DOMAIN as string
            }
        }
        this.s3 = new S3(s3Config);
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

    public async deleteObject(objectName: string, bucket: string = BUCKET_NAME): Promise<void> {
        return new Promise<void>((res, rej) => {
            console.info(`Deleting S3 object ${objectName} from bucket ${bucket}`);
            this.s3.deleteObject({
                Bucket: bucket,
                Key: objectName
            }, (err: AWSError) => {
                // we dont care about the outcome
                console.info(`Deleted`);
                res();
            });
        });
    }
}