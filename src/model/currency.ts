import { Model, PrimaryKey, Column, BeforeCreate, Table, DataType, BeforeUpdate } from 'sequelize-typescript';
import { v4 } from 'uuid';

@Table({
    tableName: 'pearson_currency',
    modelName: 'Currency'
})
export class Currency extends Model<Currency> {
   
    @Column
    code: string;

    @Column({field : 'currency_symbol'})
    currencySymbol: string;

    @Column({field : 'version', type: DataType.BIGINT})
    version: number;

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
        instance.version = 0;
        instance.id = v4().replace(/-/g, "").toUpperCase();
    }

    @BeforeUpdate
    static incrementVersion<T extends Model<T>>(instance: T) {
        instance.version = parseInt(instance.version, 10) + 1;
    }
}