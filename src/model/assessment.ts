import { Patient } from "./patient";
import { Model, PrimaryKey, Column, Table, BelongsTo, ForeignKey, DataType, BelongsToMany } from 'sequelize-typescript';
import { GradeLevel } from ".";
import { AssessmentGradeLevel } from "./assessment-grade";

@Table({
    timestamps: false,
    underscoredAll: true,
    version: true,
    tableName: 'assessment',
    modelName: 'Assessment'
})
export class Assessment extends Model<Assessment>  {
    
    @Column({field : 'export_time'})
    exportTime: Date;    

    
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

    @BelongsToMany(() => GradeLevel, () => AssessmentGradeLevel)
    grades: GradeLevel[];

    @PrimaryKey
    @Column
    id: string;     

}