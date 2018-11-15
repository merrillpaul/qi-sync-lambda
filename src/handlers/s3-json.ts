import { Handler, Callback } from 'aws-lambda';
import { Container } from 'typedi';
import { SyncService } from '@sync/services/sync';

/**
 * @param event 
 * @param context 
 * @param callback 
 */
export const handle: Handler = async (event: any, context: any, callback: Callback) => {   
    const syncService: SyncService = Container.get(SyncService);
    try {
      for (const record of event.Records) {
        const json: boolean  = await syncService.sync(record.s3.object.key);     
        console.log(`Json uploaded is ${json}`); 
      }
    } finally {
      context.done(null, "ok");
    }
   
};