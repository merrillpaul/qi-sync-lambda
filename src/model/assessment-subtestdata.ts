import { Model, PrimaryKey, Column, Table, BelongsTo, ForeignKey, BeforeCreate } from 'sequelize-typescript';
import { v4 } from 'uuid';
import { AssessmentSubtest } from '.';


@Table({
    tableName: 'assessment_subtest_data',
    modelName: 'AssessmentSubtestData',
    version: true
})
export class AssessmentSubtestData extends Model<AssessmentSubtestData> {
    
    @Column
    key: string;

    @Column
    value: string;

    @BelongsTo(() => AssessmentSubtest)
    assessmentSubtest: AssessmentSubtest;

    @ForeignKey(() => AssessmentSubtest)
    @Column({field : 'assessment_subtest_id'})
    public assessmentSubtestId: string;

    @PrimaryKey
    @Column
    id: string;  

    @BeforeCreate
    static addGuid<T extends Model<T>> (instance: T) {
        instance.id = v4().replace(/-/g, "").toUpperCase();
    }
}