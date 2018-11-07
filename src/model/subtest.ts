import { Model, PrimaryKey, Column, Table, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Test } from './test';


@Table({
    tableName: 'subtest',
    modelName: 'Subtest',
    timestamps: false,
    underscoredAll: true,
    version: true
})
export class Subtest extends Model<Subtest> {
    
    @Column
    name: string;

    @Column({field : 'display_name'})
    displayName: string;

    @Column({field : 'subtestguid'})
    subtestGuid: string;

    @BelongsTo(() => Test)
    test: Test;

    @ForeignKey(() => Test)
    @Column({field : 'test_id'})
    public testId: string;


    @PrimaryKey
    @Column
    id: string;  
}