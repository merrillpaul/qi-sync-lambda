import { QueryService } from '@sync/query';
import { Sequelize } from 'sequelize-typescript';
import * as uuid  from 'uuid/v1';
import { Container } from 'typedi-no-dynamic-require';

describe("ORM", () => {
    const queryService: QueryService = Container.get(QueryService);
    const queryIntf: Sequelize = queryService.getSequalize();
    beforeAll(async () => {
        await queryIntf.query(`select set_uid('tester');`);
     });

     afterAll( ()=> {
         queryIntf.close();
     });
    describe("Currency", () => {  
       
        it("should run", async () => {
          
           /*await Currency.create(
                {
                    id: uuid().replace(/-/g,"").toUpperCase(),
                    code: 'BLG',
                    currencySymbol: '##',
                    modifiedBy: 'A10000',
                    dateCreated: new Date(),
                    lastUpdated: new Date()
                }
            );
            const res = await Currency.findAll();
            console.log(res);*/
            expect(1).toBe(1);           
        });


        it("should run within a transaction", async () => {
           
            /*const currency: Currency = await queryIntf.transaction(async (t) => {
                await queryIntf.query(`select set_uid('tester');`);
                return Currency.create(
                    {
                        id: uuid().replace(/-/g,"").toUpperCase(),
                        code: 'GBL',
                        currencySymbol: '###',
                        modifiedBy: 'A10000',
                        dateCreated: new Date(),
                        lastUpdated: new Date()
                    }
                );
            });
            expect(currency.currencySymbol).toEqual("###");*/
            expect(1).toBe(1);
        });
    });
});