import { Model, PrimaryKey, Column, Table, BelongsTo, ForeignKey, BeforeCreate, HasMany, DataType, BeforeUpdate } from 'sequelize-typescript';
import { v4 } from 'uuid';
import { Assessment } from './assessment';
import { AssessmentSubtestData } from '.';

@Table({
    tableName: 'assessment_subtest',
    modelName: 'AssessmentSubtest'
})
export class AssessmentSubtest extends Model<AssessmentSubtest> {
   

    @Column({ field: 'date_created' })
    dateCreated: Date;

    @Column({ field: 'date_we_set_start_time' })
    dateWeSetStartTime: Date;

    @Column({ field: 'completion_time', type: DataType.BIGINT})
    completionTime: number;

    @Column({ field: 'last_updated' })
    lastUpdated: Date;

    @Column({ field: 'modified_by' })
    modifiedBy: string;

    @Column({ field: 'license_id' })
    licenseId: string;

    @Column({ field: 'subtest_instance_id' })
    subtestInstanceId: string;

    @Column({ field: 'subtest_id' })
    subtestId: string;

    @Column({ field: 'test_id' })
    testId: string;

    @Column({ field: 'applied_payment_method' })
    appliedPaymentMethod: string;

    @Column({ field: 'raw_score' })
    rawScore: number;

    @Column({ field: 'order_id' })
    orderId: number;

    @Column({ field: 'scaled_score' })
    scaledScore: number; 

    @Column({ type: DataType.SMALLINT, field: 'was_started' })
    started: number;   

    @Column({ type: DataType.SMALLINT, field: 'discontinue_used' })
    discontinued: number;

    @Column({field : 'version', type: DataType.BIGINT})
    version: number;

    @BelongsTo(() => Assessment)
    assessment: Assessment;

    @ForeignKey(() => Assessment)
    @Column({ field: 'assessment_id' })
    public assessmentId: string;

    @HasMany(() => AssessmentSubtestData)
    subtestData: AssessmentSubtestData[];

    @PrimaryKey
    @Column
    id: string;

    @BeforeCreate
    static addGuid<T extends Model<T>>(instance: T) {
        instance.version = 0;
        instance.id = v4().replace(/-/g, "").toUpperCase();
    }

    @BeforeUpdate
    static incrementVersion<T extends Model<T>>(instance: T) {
        instance.version = parseInt(instance.version, 10) + 1;
    }
}