import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUser1693795360621 implements MigrationInterface {
    name = 'CreateUser1693795360621'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(500) NOT NULL, \`email\` varchar(500) NOT NULL, \`password\` varchar(255) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`categoryOrder\` text NULL, UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`wallets\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(500) NOT NULL, \`currency\` varchar(255) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`records\` (\`id\` int NOT NULL AUTO_INCREMENT, \`price\` decimal(10,2) NOT NULL, \`date\` date NOT NULL, \`remarks\` varchar(500) NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`categoryId\` int NULL, \`walletId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`categories\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(500) NOT NULL, \`icon\` varchar(255) NOT NULL, \`enable\` tinyint NOT NULL, \`type\` varchar(255) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`wallets\` ADD CONSTRAINT \`FK_2ecdb33f23e9a6fc392025c0b97\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`records\` ADD CONSTRAINT \`FK_9237a6e731418bb2b6111d17fb1\` FOREIGN KEY (\`categoryId\`) REFERENCES \`categories\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`records\` ADD CONSTRAINT \`FK_ec4d457385405dc5a9cc742fb3e\` FOREIGN KEY (\`walletId\`) REFERENCES \`wallets\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`categories\` ADD CONSTRAINT \`FK_13e8b2a21988bec6fdcbb1fa741\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`categories\` DROP FOREIGN KEY \`FK_13e8b2a21988bec6fdcbb1fa741\``);
        await queryRunner.query(`ALTER TABLE \`records\` DROP FOREIGN KEY \`FK_ec4d457385405dc5a9cc742fb3e\``);
        await queryRunner.query(`ALTER TABLE \`records\` DROP FOREIGN KEY \`FK_9237a6e731418bb2b6111d17fb1\``);
        await queryRunner.query(`ALTER TABLE \`wallets\` DROP FOREIGN KEY \`FK_2ecdb33f23e9a6fc392025c0b97\``);
        await queryRunner.query(`DROP TABLE \`categories\``);
        await queryRunner.query(`DROP TABLE \`records\``);
        await queryRunner.query(`DROP TABLE \`wallets\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
