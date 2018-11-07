import { Service, Inject } from "typedi";
import { S3Service } from "./s3";
import { QueryService } from "@sync/query";
import { Sequelize } from "sequelize-typescript";
import { Assessment, Patient, GradeLevel, Test } from "@sync/model";
import { ClientService } from "./client";
import { AssessmentGradeLevel } from "@sync/model/assessment-grade";
import { Transaction } from "sequelize";

@Service()
export class SyncService {

    @Inject()
    private queryIntf: QueryService;

    @Inject()
    private clientService: ClientService

    @Inject()
    private s3Service: S3Service;


    public async sync(jsonS3Key: string): Promise<boolean> {
        const dao: Sequelize = this.queryIntf.getSequalize();
        const jsonString: string = await this.s3Service.readObjectAsText(jsonS3Key);
        let resultArchiveId: string;
        await dao.transaction(async (t) => {
            resultArchiveId = await this.createResultArchive(jsonString);
        });
        await dao.transaction(async (t) => {

            try {
                const parsed: any = JSON.parse(jsonString);
                const id: string = parsed.id;
                if (!id) {
                    const errorMsg = "json has no assessment id - cannot proceed";
                    throw new Error(errorMsg);
                }
                const newExportTime: Date = new Date(parsed.exportTime);
                const assessment = await Assessment.findById(id, {
                    include: [
                        {
                            model: Patient
                        }
                    ]
                }) as Assessment;
                if (!assessment) {
                    throw new Error(`assessment ${id} not found - cannot proceed`);
                } else if (!assessment.exportTime || newExportTime > assessment.exportTime) {
                    // handle it
                    assessment.syncSucceeded = false;
                    await this.handleKnownAssessment(parsed, assessment, jsonString, t);
                }

                await this.applyAssessmentToResultArchive(assessment.id, resultArchiveId, t);
                assessment.syncSucceeded = true;
                await assessment.save();
            } catch (e) {
                console.error(`Error in sync`, e);
            }
        })
        return true;
    }


    private async createResultArchive(json: string): Promise<string> {
        const guidRes = await this.queryIntf.getSequalize().query('select sys_guid() as guid', { type: Sequelize.QueryTypes.SELECT });
        const guid = guidRes[0].guid;
        const INSERT_QUERY: string = `
            insert into RESULT_ARCHIVE
                (ID, VERSION, DATE_CREATED, LAST_UPDATED, MESSAGE, EXPORT_CONTENT )
                values (?, 0, current_timestamp, current_timestamp, 'Export Content Saved but not parsed', ? )
        `;
        await this.queryIntf.getSequalize().query({
            query: INSERT_QUERY,
            values: [guid, json]
        });
        return guid;
    }


    private async applyAssessmentToResultArchive(assessmentId: string, resultArchiveId: string, t: any): Promise<void> {
        const UPDATE_QUERY: string = "update RESULT_ARCHIVE set MESSAGE = ?, ASSESSMENT_ID = ? where ID = ?"
        await this.queryIntf.getSequalize().query({
            query: UPDATE_QUERY,
            values: ["Export Content Parsed", assessmentId, resultArchiveId]
        });
        return;
    }

    private async handleKnownAssessment(battery: any, assessment: Assessment, jsonString: string, t: any): Promise<void> {
        const patient: Patient = await this.clientService.updatePatientFromJson(battery.patient, assessment.patient, t);
        await this.updateAssessment(assessment, battery, jsonString, patient, t);
        return;
    }


    private async updateAssessment(assessment: Assessment, parsed: any, jsonString: string, patient: Patient, t: any): Promise<void> {
        assessment.patient = patient;
        const updatedTitle: string = parsed.identifier;

        if (updatedTitle) {
            assessment.title = updatedTitle
        }
        const updatedDateStr: string = parsed.administrationDate;
        if (updatedDateStr) {
            assessment.assessmentDate = new Date(updatedDateStr);
        }
        const exportTime: Date = new Date(parsed.exportTime);
        assessment.exportTime = exportTime;
        this.setAssessmentYOE(assessment, parsed);
        await this.setAssessmentGrade(assessment, parsed, t);
        return;
    }

    /**
	 * Sets the Years of Education (YOE) of an assessment from the info found in parsed json
	 * @param assessment the assessment to update
	 * @param parsed the parsed json object tree
	 * @return none
	 */
    private setAssessmentYOE(assessment: Assessment, parsed: any): void {
        let yearsOfEducation, testList: any[] = parsed.tests;
        if (!testList) {
            return;
        }
        // Find all tests that have an assigned GradeLevel and yearsOfEducation, there should only be one of each
        testList.forEach(eachTest => {
            yearsOfEducation = eachTest.yearsOfEducation;
            if (yearsOfEducation) {
                assessment.yearsOfEducation = yearsOfEducation
            }
        });
    }

    /**
	 * Sets the grade level of an Assessment from the grade level info found in parsed JSON
	 * @param assessment the assessment to update
	 * @param parsed the parsed json data object tree
	 * @return none
	 */
    private async setAssessmentGrade(assessment: Assessment, parsed: any, t: any): Promise<void> {
        let gradeLevel: string, testList: any[] = parsed.tests, gradesFromAssess: GradeLevel[] = [];
        if (testList) {
            
            for (const eachTest of testList) {
               
                gradeLevel = eachTest.gradeLevel;
                const test: Test = await Test.findOne({
                    where: {
                        testGuid: eachTest.testGUID
                    }
                }) as Test;
               
                if (gradeLevel && test) {
                    const grade: GradeLevel = await GradeLevel.findOne({
                        where: {
                            testId: test.id,
                            name: gradeLevel
                        }
                    }) as GradeLevel;
                   
                    if (grade) {
                        gradesFromAssess.push(grade);
                    }
                }
            }
            await AssessmentGradeLevel.destroy({
                where: {
                    assessmentId: assessment.id
                },
                transaction: t
            });
            if (gradesFromAssess.length > 0) {
                for (const grade of gradesFromAssess) {
                    await AssessmentGradeLevel.create({
                        assessmentId: assessment.id,
                        gradeLevelId: grade.id
                    }, { transaction: t});
                }              
            }
        }


    }

}