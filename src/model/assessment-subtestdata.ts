import { Model, PrimaryKey, Column, Table, BelongsTo, ForeignKey, BeforeCreate, DataType, BeforeUpdate } from 'sequelize-typescript';
import { v4 } from 'uuid';
import { AssessmentSubtest } from '.';


@Table({
    tableName: 'assessment_subtest_data',
    modelName: 'AssessmentSubtestData'
})
export class AssessmentSubtestData extends Model<AssessmentSubtestData> {
    
    @Column
    key: string;

    @Column
    value: string;

    @Column({field : 'version', type: DataType.BIGINT})
    version: number;

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
        instance.version = 0;
        instance.id = v4().replace(/-/g, "").toUpperCase();
    }

    @BeforeUpdate
    static incrementVersion<T extends Model<T>>(instance: T) {
        instance.version = parseInt(instance.version, 10) + 1;
    }
}