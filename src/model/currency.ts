import { Model, PrimaryKey, Column, BeforeCreate, Table } from 'sequelize-typescript';
import { v4 } from 'uuid';

@Table({
    tableName: 'pearson_currency',
    modelName: 'Currency',
    version: true
})
export class Currency extends Model<Currency> {
   
    @Column
    code: string;

    @Column({field : 'currency_symbol'})
    currencySymbol: string;

    @Column({field : 'modified_by'})
    modifiedBy: string;

    @Column({field : 'date_created'})
    dateCreated: Date;

    @Column({field : 'last_updated'})
    lastUpdated: Date;

    @PrimaryKey
    @Column
    id: string;  

    @BeforeCreate
    static addGuid<T extends Model<T>> (instance: T) {
        instance.id = v4().replace(/-/g, "").toUpperCase();
    }
}