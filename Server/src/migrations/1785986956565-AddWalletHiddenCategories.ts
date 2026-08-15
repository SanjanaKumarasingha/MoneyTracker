import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWalletHiddenCategories1785986956565 implements MigrationInterface {
    name = 'AddWalletHiddenCategories1785986956565'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`wallet_hidden_categories\` (\`walletId\` int NOT NULL, \`categoryId\` int NOT NULL, INDEX \`IDX_fb073a4a61a52f6c871afe3a0c\` (\`walletId\`), INDEX \`IDX_cc110505d5ce9c154d08fbf8ce\` (\`categoryId\`), PRIMARY KEY (\`walletId\`, \`categoryId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`wallet_hidden_categories\` ADD CONSTRAINT \`FK_fb073a4a61a52f6c871afe3a0ca\` FOREIGN KEY (\`walletId\`) REFERENCES \`wallets\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`wallet_hidden_categories\` ADD CONSTRAINT \`FK_cc110505d5ce9c154d08fbf8ce9\` FOREIGN KEY (\`categoryId\`) REFERENCES \`categories\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`wallet_hidden_categories\` DROP FOREIGN KEY \`FK_cc110505d5ce9c154d08fbf8ce9\``);
        await queryRunner.query(`ALTER TABLE \`wallet_hidden_categories\` DROP FOREIGN KEY \`FK_fb073a4a61a52f6c871afe3a0ca\``);
        await queryRunner.query(`DROP INDEX \`IDX_cc110505d5ce9c154d08fbf8ce\` ON \`wallet_hidden_categories\``);
        await queryRunner.query(`DROP INDEX \`IDX_fb073a4a61a52f6c871afe3a0c\` ON \`wallet_hidden_categories\``);
        await queryRunner.query(`DROP TABLE \`wallet_hidden_categories\``);
    }

}
