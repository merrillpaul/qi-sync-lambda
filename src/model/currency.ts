import { Model, Table, Column, PrimaryKey } from 'sequelize-typescript';

@Table({
    tableName: 'pearson_currency',
    modelName: 'Currency',
    timestamps: false,
    underscoredAll: true,
    version: true
})
export class Currency extends Model<Currency> {
    

    @PrimaryKey
    @Column
    id: string;

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
}