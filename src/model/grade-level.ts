import { Model, PrimaryKey, Column, Table, BelongsTo, ForeignKey, BelongsToMany, DataType, BeforeUpdate } from 'sequelize-typescript';
import { Test } from './test';
import { Assessment } from './assessment';
import { AssessmentGradeLevel } from './assessment-grade';

@Table({
    tableName: 'grade_level',
    modelName: 'GradeLevel'
})
export class GradeLevel extends Model<GradeLevel> {
    
    @Column
    name: string;

    @Column({field : 'order_id'})
    orderId: number;

    @BelongsTo(() => Test)
    test: Test;

    @ForeignKey(() => Test)
    @Column({field : 'test_id'})
    public testId: string;

    @PrimaryKey
    @Column
    id: string;  

    @BelongsToMany(() => Assessment, () => AssessmentGradeLevel)
    assessments: Assessment[];    
}