import { Service, Inject } from "typedi";
import { S3Service } from "./s3";
import { QueryService } from "@sync/query";
import { Sequelize } from "sequelize-typescript";
import { Assessment, Patient, GradeLevel, Test, AssessmentSubtestData, Subtest, JsonUpload } from "@sync/model";
import { ClientService } from "./client";
import { AssessmentGradeLevel } from "@sync/model/assessment-grade";
import { Transaction } from "sequelize";
import { AssessmentSubtest } from "@sync/model/assessment-subtest";
import { DataResolverService } from "./data-resolver";

@Service()
export class SyncService {

    @Inject()
    private queryIntf: QueryService;

    @Inject()
    private clientService: ClientService

    @Inject()
    private s3Service: S3Service;

    @Inject()
    private dataResolverService: DataResolverService;


    public async sync(jsonS3Key: string): Promise<boolean> {
        const dao: Sequelize = this.queryIntf.getSequalize();
        const json: JsonUpload = await this.s3Service.readObjectAsText(jsonS3Key);
        console.log(`S3 metadata`, json.userName, json.returnControl);
        const jsonString: string = json.json;
        let resultArchiveId: string;
        await dao.transaction(async (t) => {
            resultArchiveId = await this.createResultArchive(jsonString);
        });
        await dao.transaction(async (t) => {
            // todo call audit service setAuditUser
            try {
                const parsed: any = JSON.parse(jsonString);
                const id: string = parsed.id;
                if (!id) {
                    const errorMsg = "json has no assessment id - cannot proceed";
                    throw new Error(errorMsg);
                }
                const newExportTime: Date = new Date(parsed.exportTime);
                const assessment: Assessment|null = await Assessment.findById(id, {
                    include: [
                        {
                            model: Patient
                        }, {
                            model: AssessmentSubtest
                        }
                    ]
                });
                if (assessment === null) {
                    console.error(`assessment ${id} not found - cannot proceed`);
                    throw new Error(`assessment ${id} not found - cannot proceed`);
                } else if (!assessment.exportTime || newExportTime > assessment.exportTime) {
                    // handle it
                    assessment.syncSucceeded = false;
                    await this.handleKnownAssessment(parsed, assessment, jsonString, json.returnControl, t);
                }

                await this.applyAssessmentToResultArchive(assessment.id, resultArchiveId, t);
                assessment.syncSucceeded = true;
                await assessment.save();
                
            } catch (e) {
                t.rollback();
                console.error(`Error in sync`, e);
            }
            // todo clear audit user in auditService
        
        });
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

    private async handleKnownAssessment(battery: any, assessment: Assessment, jsonString: string, returnControl: boolean, t: any): Promise<void> {
        const patient: Patient = await this.clientService.updatePatientFromJson(battery.patient, assessment.patient, t);
        await this.updateAssessment(assessment, battery, jsonString, patient, returnControl, t);
        return;
    }


    private async updateAssessment(assessment: Assessment, parsed: any, jsonString: string, patient: Patient, returnControl: boolean, t: any): Promise<void> {
        assessment.patient = patient;
        assessment.resultsJson = jsonString;
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

        await this.updateAssessmentSubtests(assessment, parsed, t);
        if (assessment.progressState === 'PENDING') {
            assessment.progressState = 'GIVE';
        }
        if (returnControl) {
            assessment.progressState = 'COMPLETE';
        }
        return;
    }

    /**
	 * Update an assessment with a parsed JSON battery of subtests.  Get the times of the current subtests, so that
	 * the existing ones have proper dates on them
	 * @param assessment tehe Assessment to update
	 * @param parsedBattery the object tree from parsing the JSON string representing a battery
	 * @return none
	 */
    private async updateAssessmentSubtests(assessment: Assessment, parsedBattery: any, t: any): Promise<void> {
        // remove all subtests and delete them
        const allAssessmentSubtests: AssessmentSubtest[] = assessment.assessmentSubtests;
        // we create new AssessmentSubtests objects & we need to keep track of date we recognized a subtest was started
        const oldTimes: any = {};

        // keeping track of licenses for already applied subtests
        const oldLicenses: any = {};

        // keeping track of payment methods for already applied subtests
        const oldAppliedPaymentMethods: any = {};

        for (const oldAssessmentSubtest of allAssessmentSubtests) {
            await AssessmentSubtestData.destroy({
                where: {
                    assessmentSubtestId: oldAssessmentSubtest.id
                },
                transaction: t
            });
            if (oldAssessmentSubtest.subtestInstanceId) {
                oldTimes[oldAssessmentSubtest.subtestInstanceId] = oldAssessmentSubtest.dateWeSetStartTime;
                if (oldAssessmentSubtest.licenseId) {
                    oldLicenses[oldAssessmentSubtest.subtestInstanceId] = oldAssessmentSubtest.licenseId;
                }
                if (oldAssessmentSubtest.appliedPaymentMethod) {
                    oldAppliedPaymentMethods[oldAssessmentSubtest.subtestInstanceId] = oldAssessmentSubtest.appliedPaymentMethod;
                }
            }
            await oldAssessmentSubtest.destroy({ transaction: t });           

        }

        // create new assessment subtests and add them
        let c = 0;
        for (const parsedSubtest of parsedBattery.subtests) {
            const newAssessmentSubtest: AssessmentSubtest = await this.getAssessmentSubtestForParsedSubtest(assessment, parsedSubtest, c,
                oldTimes, oldLicenses, oldAppliedPaymentMethods, t);

            if (newAssessmentSubtest) {
                await this.dataResolverService.resolveData(newAssessmentSubtest, parsedSubtest, t);                                 
            }
        }

    }

    /**
	 * Gets a new AssessmentSubtest object for the parsed subtest
	 *
	 * @param assessment Assessment to be linked  with the subtest
	 * @param parsedSub parsed json object tree with subtest information
	 * @param orderId order id
	 * @param oldTimes array containing 'dateWeSetStartTime' DateTimes of previous AssessmentSubtests
	 * @param oldLicenses array containing license ids of previous subtests
	 * @param oldAppliedPaymentMethods array containing payment methods of previous subtests
     * @param t db transaction
	 * @return new AssessmentSubtest
	 */
    private async getAssessmentSubtestForParsedSubtest(assessment: Assessment, parsedSub: any, orderId: number, oldTimes: any, oldLicenses: any, oldAppliedPaymentMethods: any, t: any): Promise<AssessmentSubtest> {
        let assessmentSubtest: AssessmentSubtest;
        let subtest: Subtest | null;
        const subtestGuid: string = parsedSub.subtestGUID;
        const subtestName: string = parsedSub.title;
        const testName: string = parsedSub.testTitle;
        subtest = null;
        if (subtestGuid) {
            subtest = await Subtest.findOne({ where: { subtestGuid }, transaction: t,  include: [
                {
                    model: Test
                }
            ] }) as Subtest;
        } else if (subtestName && testName) {
            const subtests: Subtest[] = await Subtest.findAll({
                transaction: t,
                where: { name: subtestName },
                include: [
                    {
                        model: Test
                    }
                ]
            });
            subtest = subtests.find((it: Subtest) => it.test.name === testName) as Subtest;
        }

        if (!subtest) {
            throw new Error(`could not find subtest with GUID: ${subtestGuid}, name: ${subtestName}, testName: ${testName}`);
        }

        const test: Test  = subtest.test;
        const rawScore: number = parsedSub.derivedState ? parsedSub.derivedState.totalRawScore : null;
        const scaledScore: number = parsedSub.derivedState ? parsedSub.derivedState.scaledScore : null;
        const completionTime: number = parsedSub.completionTime;
        const discontinueUsed: boolean = !!parsedSub.discontinueUsed;
        const subtestInstanceId: string = parsedSub.subtestInstanceID;
        const wasStarted: boolean = !!parsedSub.wasStarted;
        const dateWeSetStartTime: Date = wasStarted ? (oldTimes[subtestInstanceId] || new Date()) : null;
        const prevPaymentMethodIfAny: string = oldAppliedPaymentMethods[subtestInstanceId];
        let licenseId: string = oldLicenses[subtestInstanceId];

        assessmentSubtest = await AssessmentSubtest.create({
            assessmentId: assessment.id,
            subtestId: subtest.id,
            testId: test.id,
            orderId,
            rawScore,
            scaledScore,
            appliedPaymentMethod: prevPaymentMethodIfAny,
            completionTime,
            discontinued: discontinueUsed? 1: 0,
            subtestInstanceId,
            started: wasStarted ? 1: 0,
            licenseId,
            dateWeSetStartTime,
            dateCreated: new Date(),
            lastUpdated: new Date()
        }, { transaction: t});
        
        return assessmentSubtest;
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
                    }, { transaction: t });
                }
            }
        }
    }

}