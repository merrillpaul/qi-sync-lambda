import { Sequelize } from "sequelize-typescript";
import { models } from '@sync/model';
import { Service } from "typedi";


@Service()
export class QueryService {

    private sequalize: Sequelize;

    constructor() {
        this.sequalize = new Sequelize({
            database: 'chairdev',
            dialect: 'postgres',
            username: 'chair_user',
            password: 'pearson',
            define: {
                timestamps: false,
                underscoredAll: true,
                underscored: true,
                version: false
            },
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
              }
        });
        this.sequalize.addModels(models);  
    }

    getSequalize(): Sequelize {
        return this.sequalize;
    }

}
