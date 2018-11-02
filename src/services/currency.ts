
import { Currency } from '@sync/model';
import { Sequelize } from 'sequelize-typescript';
import { Service, Inject } from "typedi";
import { S3Service } from './s3';
import { QueryService } from '@sync/query';

@Service()
export class CurrencyService {

    @Inject()
    private queryIntf: QueryService;

    @Inject()
    private s3Service: S3Service;

    public async create() : Promise<Currency> {
        
        const currency: Currency = await this.queryIntf.getSequalize().transaction(async (t) => {
            await this.queryIntf.getSequalize().query(`select set_uid('tester', '')`);
            const guid = await this.queryIntf.getSequalize().query('select sys_guid() as guid', { type: Sequelize.QueryTypes.SELECT });
            return Currency.create(
                {
                    id: guid[0].guid,
                    code: 'GBL',
                    currencySymbol: '###',
                    modifiedBy: 'A10000',
                    dateCreated: new Date(),
                    lastUpdated: new Date()
                }
            );
        });
        return currency;
    }

    public async getJson(jsonFile: string): Promise<string> {
        return this.s3Service.readObjectAsText(jsonFile);
    }
}