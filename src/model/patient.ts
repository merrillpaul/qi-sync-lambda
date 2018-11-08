import { Model, PrimaryKey, Column, Table } from 'sequelize-typescript';

@Table({
    version: true,
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
    
    @PrimaryKey
    @Column
    id: string;
}