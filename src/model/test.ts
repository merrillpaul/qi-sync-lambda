import { Model, PrimaryKey, Column, Table, HasMany } from 'sequelize-typescript';
import { Subtest } from './subtest';
import { GradeLevel } from './grade-level';

@Table({
    tableName: 'test',
    modelName: 'Test',
    timestamps: false,
    underscoredAll: true,
    version: true
})
export class Test extends Model<Test> {
    
    @Column
    name: string;

    @Column({field : 'display_name'})
    displayName: string;

    @Column({field : 'testguid'})
    testGuid: string;

    @HasMany(() => Subtest)
    subtests: Subtest[];

    @HasMany(() => GradeLevel)
    grades: GradeLevel[];

    @PrimaryKey
    @Column
    id: string;  

}