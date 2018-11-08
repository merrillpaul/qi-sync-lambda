import { Model, Column, Table, ForeignKey } from 'sequelize-typescript';
import { GradeLevel, Assessment } from ".";

@Table({
  tableName: 'assessment_grade_level',
  modelName: 'AssessmentGradeLevel'
})
export class AssessmentGradeLevel extends Model<AssessmentGradeLevel> {
 
  @ForeignKey(() => Assessment)
  @Column({field : 'assessment_grades_id'})
  assessmentId: string;
 
  @ForeignKey(() => GradeLevel)
  @Column({field : 'grade_level_id'})
  gradeLevelId: string;
}