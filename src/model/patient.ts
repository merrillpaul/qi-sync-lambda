import { Model, PrimaryKey, Column, Table, DataType, BeforeUpdate } from 'sequelize-typescript';

@Table({
    tableName: 'patient',
    modelName: 'Patient'
})
export class Patient extends Model<Patient> {
    
    @Column({field : 'date_of_birth'})
    dateOfBirth: Date;

    @Column
    gender: string;

    @Column
    identifier: string;

    @Column({field : 'first_name'})
    firstName: string;

    @Column({field : 'last_name'})
    lastName: string;

    @Column({field : 'version', type: DataType.BIGINT})
    version: number;
    
    @PrimaryKey
    @Column
    id: string;

    @BeforeUpdate
    static incrementVersion<T extends Model<T>>(instance: T) {
        instance.version = parseInt(instance.version, 10) + 1;
    }
}