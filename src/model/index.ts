import { Assessment } from './assessment';
import { GradeLevel } from './grade-level';
import { Patient } from './patient';
import { Subtest } from './subtest';
import { Test } from './test';
import { AssessmentGradeLevel } from './assessment-grade';
import { AssessmentSubtest } from './assessment-subtest';
import { AssessmentSubtestData } from './assessment-subtestdata';
import { JsonUpload } from './json-file';

export const models = [
    Assessment, GradeLevel, Patient, Subtest, Test, AssessmentGradeLevel, AssessmentSubtest, AssessmentSubtestData
];

export { Assessment, GradeLevel, Patient, Subtest, Test, 
    AssessmentGradeLevel, AssessmentSubtest, AssessmentSubtestData, JsonUpload };

