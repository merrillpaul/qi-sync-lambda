import { Service, Inject } from "typedi";
import { S3Service } from "./s3";
import { QueryService } from "@sync/query";
import { Sequelize } from "sequelize-typescript";

@Service()
export class SyncService {

    @Inject()
    private queryIntf: QueryService;

    @Inject()
    private s3Service: S3Service;


    public async sync(jsonS3Key: string) : Promise<boolean> {
        const dao: Sequelize = this.queryIntf.getSequalize();
        const jsonString: string = await this.s3Service.readObjectAsText(jsonS3Key);
        dao.transaction( async (t) => {
            const resultArchiveId: string = await this.createResultArchive(jsonString);
            console.log(`Result archive id ${resultArchiveId}`);
        })
        return true;
    }

    
    private async createResultArchive(json: string): Promise<string> {
        const guidRes= await this.queryIntf.getSequalize().query('select sys_guid() as guid', { type: Sequelize.QueryTypes.SELECT });
        const guid = guidRes[0].guid;
        const INSERT_QUERY: string = `
            insert into RESULT_ARCHIVE
                (ID, VERSION, DATE_CREATED, LAST_UPDATED, MESSAGE, EXPORT_CONTENT )
                values (?, 0, current_timestamp, current_timestamp, 'Export Content Saved but not parsed', ? )
        `;
        await this.queryIntf.getSequalize().query({
            query: INSERT_QUERY,
            values: [guid, json]
        });
        return guid;
    }
}