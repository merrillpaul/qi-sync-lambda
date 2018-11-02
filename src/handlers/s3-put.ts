import { Handler, Callback } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import * as uuid from 'uuid';

/**
 * @param event 
 * @param context 
 * @param callback 
 */
export const handle: Handler = (event: any, context: any, callback: Callback) => {
    const s3 = new S3({
        s3ForcePathStyle: true,
        endpoint: process.env.S3_DOMAIN as string
    });
    s3.putObject({
        Bucket: process.env.BUCKET as string,
        Key: `resultJsons/${uuid()}/data.json`,
        ContentType: 'application/json',
        Body: Buffer.from(JSON.stringify({
            id: uuid(),
            name: `NAME_${uuid()}`
        }, null, 5)),
    }, () => {
        callback(null, {
            statusCode: 200,
            body: 'added'
        });
    });
};