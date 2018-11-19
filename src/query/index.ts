import { Sequelize } from "sequelize-typescript";
import { models } from '@sync/model';
import { Service } from "typedi";

@Service()
export class QueryService {

    private sequalize: Sequelize;

    constructor() {
        this.sequalize = new Sequelize({
            database: process.env.DB as string,
            dialect: 'postgres',
            username: process.env.DB_USER as string,
            password: process.env.DB_PASSWORD as string,
            host: process.env.DB_HOST as string,
            port: parseInt(process.env.DB_PORT as string, 10),
            logging: JSON.parse((process.env.LOGGING || false ) as string),
            operatorsAliases: false,
            define: {
                timestamps: false,
                underscoredAll: true,
                underscored: true,
                version: false
            },
            pool: {
                max: 10,
                min: 5,
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
