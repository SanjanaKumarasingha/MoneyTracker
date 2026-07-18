import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGoal1784356239834 implements MigrationInterface {
    name = 'CreateGoal1784356239834'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`goals\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(500) NULL, \`type\` varchar(255) NOT NULL, \`periodType\` varchar(255) NOT NULL, \`targetAmount\` decimal(10,2) NOT NULL, \`startDate\` date NOT NULL, \`endDate\` date NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`userId\` int NULL, \`walletId\` int NULL, \`categoryId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`goals\` ADD CONSTRAINT \`FK_57dd8a3fc26eb760d076bf8840e\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`goals\` ADD CONSTRAINT \`FK_9a07d18d306057e73814af4f2bd\` FOREIGN KEY (\`walletId\`) REFERENCES \`wallets\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`goals\` ADD CONSTRAINT \`FK_59749dbe0f070d8bf1de526a49e\` FOREIGN KEY (\`categoryId\`) REFERENCES \`categories\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`goals\` DROP FOREIGN KEY \`FK_59749dbe0f070d8bf1de526a49e\``);
        await queryRunner.query(`ALTER TABLE \`goals\` DROP FOREIGN KEY \`FK_9a07d18d306057e73814af4f2bd\``);
        await queryRunner.query(`ALTER TABLE \`goals\` DROP FOREIGN KEY \`FK_57dd8a3fc26eb760d076bf8840e\``);
        await queryRunner.query(`DROP TABLE \`goals\``);
    }

}
