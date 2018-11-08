import { Patient } from "./patient";
import { Model, PrimaryKey, Column, Table, BelongsTo, ForeignKey, DataType, BelongsToMany, HasMany, BeforeUpdate } from 'sequelize-typescript';
import { GradeLevel } from ".";
import { AssessmentGradeLevel } from "./assessment-grade";
import { AssessmentSubtest } from "./assessment-subtest";

@Table({
    tableName: 'assessment',
    modelName: 'Assessment'
})
export class Assessment extends Model<Assessment>  {
    
    @Column({field : 'export_time'})
    exportTime: Date;    

    @Column({field : 'version', type: DataType.BIGINT})
    version: number;
    
    get syncSucceeded(): boolean {
      return 1 === this.synced;
    };

    set syncSucceeded(sync: boolean) {
        this.synced =  sync? 1: 0;
    };

    @Column({type: DataType.SMALLINT, field: 'sync_succeeded'})
    synced: number;

    @BelongsTo(() => Patient)
    patient: Patient;

    @ForeignKey(() => Patient)
    @Column({field : 'patient_id'})
    public patientId: string;

    @Column
    title: string;

    @Column({field: 'assessment_date'})
    assessmentDate: Date;

    @Column({field: 'progress_state'})
    progressState: string;

    @Column({field: 'years_of_education'})
    yearsOfEducation: string;

    @Column({field: 'results_json'})
    resultsJson: string;

    @BelongsToMany(() => GradeLevel, () => AssessmentGradeLevel)
    grades: GradeLevel[];

    @HasMany(() => AssessmentSubtest)
    assessmentSubtests: AssessmentSubtest[];

    @PrimaryKey
    @Column
    id: string;  
    
    @BeforeUpdate
    static incrementVersion<T extends Model<T>>(instance: T) {
        instance.version = parseInt(instance.version, 10) + 1;
    }

}