import { Service, Inject } from "typedi";
import { AssessmentSubtest, AssessmentSubtestData } from "@sync/model";

@Service()
export class DataResolverService {
    private resolvers: Function[] = [
        (subtestJson: any): any => {
            return { "RAW_SCORE": subtestJson.derivedState.totalRawScore, "SCALED_SCORE": subtestJson.derivedState.scaledScore };
        },
        (subtestJson: any) => {
            const rule = subtestJson.rules.find((it: any) => {
                return it != null && 'SingleItemGroupSelectionRule' === it.ruleName;
            });
            return rule && "Paper" === rule.selectedItemGroupType ? {
                "PAPER": "Y"
            } : null;
        }

    ]

    /**
     * 
     * @param subtest 
     * @param subtestJson 
     * @param t 
     */
    public async resolveData(subtest: AssessmentSubtest, subtestJson: any, t: any): Promise<void> {
        for (const resolver of this.resolvers) {
            const res: any = resolver.call(resolver, subtestJson);
            if (res) {
                const keys: string[] = Object.keys(res);
                for (const key of keys) {
                    await AssessmentSubtestData.create({
                        assessmentSubtestId: subtest.id,
                        key: key,
                        value: res[key]
                    }, { transaction: t });
                }
            }            
        }
    }

}