import { Service, Inject } from "typedi";
import { QueryService } from '@sync/query';
import { Patient } from "@sync/model";

@Service()
export class ClientService {
    @Inject()
    private queryIntf: QueryService;

    public async updatePatientFromJson(patientJson: any, patient: Patient, t: any): Promise<Patient> {
        const updatedDob: Date = new Date(patientJson.dob);
        if (updatedDob) {
            patient.dateOfBirth = updatedDob;
        }
        let updatedIdentifier: string = patientJson.id;
        if (updatedIdentifier) {
            const oldLen = updatedIdentifier.length;
            // remove non-alphanumeric characters from the identifier
            // We might have bad characters for Patients (Batteries in Give) that were created before
            // Patient IDs (Examinee Ids in Give) were restricted to alphanumeric characters
            updatedIdentifier = updatedIdentifier.replace(/[^a-zA-Z0-9_|:-]/g, "");
            if (oldLen != updatedIdentifier.length) {
                // Assign a default identifier '1' when all of the characters in existing identifier is invalid
                updatedIdentifier = (updatedIdentifier.length == 0) ? '1' : updatedIdentifier;
                console.warn("Removed non-alphanumeric characters. Old identifier: " + patient.id +
                    ", new identifier: " + updatedIdentifier);
            }

            patient.identifier = updatedIdentifier
        }
        this.updatePatientName(patientJson, patient);
        patient.gender = patientJson.gender;
        patient.save({transaction: t});
        return patient;
    }

    // check if it's the same name by concatenating original first and last name
    // if it matches, leave it as is
    // else separate by the first space (" ")
    // if we get an empty last name, use "none" as the last name
    private updatePatientName(parsedPatient: any, patient: any): void {
        const patientVal: string = parsedPatient.name ? parsedPatient.name.trim() : null;
        if (!patientVal) {
            console.warn("No name in patient name in result json");
            return;
        }
        if (patientVal.length < 1) {
            // Give allows the patient's name to have min length of 1
            console.warn("Tried to update patient info on sync. Patient name must be at least one character long.");
            return;
        }

        if (patientVal.length > 0 && patientVal == patient.firstName + ' ' + patient.lastName) {
            // if the name is the same, leave the patient alone
            return;
        }

        let spaceIndex: number = patientVal.indexOf(' ');

        if (spaceIndex != -1) {
            patient.firstName = patientVal.substring(0, spaceIndex);
            patient.lastName = patientVal.substring(spaceIndex + 1);
        } else {
            // we don't have a space
            patient.firstName = patientVal;
            patient.lastName = 'none';
        }
    }

}