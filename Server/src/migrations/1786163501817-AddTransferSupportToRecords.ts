import { MigrationInterface, QueryRunner } from 'typeorm';

// Wallet-to-wallet transfers are modeled as a matched pair of Records (one
// expense-shaped row in the source wallet, one income-shaped row in the
// destination wallet) rather than a new entity — this keeps every existing
// balance/aggregation query (which sums Records by category type) working
// unchanged. `categoryId` was already nullable at the DB level (TypeORM's
// default for this ManyToOne), so transfer rows simply carry no category;
// RecordsService synthesizes a display-only "Transfer" category on read
// (see RecordsService.attachTransferCategory) so every existing client/
// mobile render path that expects `record.category.{name,icon,type}` keeps
// working without modification.
export class AddTransferSupportToRecords1786163501817
  implements MigrationInterface
{
  name = 'AddTransferSupportToRecords1786163501817';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`records\` ADD \`isTransfer\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`records\` ADD \`transferDirection\` varchar(3) NULL`,
    );
    // Links the two halves of one transfer so both sides can be
    // deleted/displayed together; not used for lookups yet, hence no index.
    await queryRunner.query(
      `ALTER TABLE \`records\` ADD \`transferGroupId\` varchar(36) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`records\` DROP COLUMN \`transferGroupId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`records\` DROP COLUMN \`transferDirection\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`records\` DROP COLUMN \`isTransfer\``,
    );
  }
}
