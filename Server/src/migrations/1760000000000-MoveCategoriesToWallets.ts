import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveCategoriesToWallets1760000000000
  implements MigrationInterface
{
  name = 'MoveCategoriesToWallets1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `wallets` ADD `categoryOrder` text NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `categories` ADD `walletId` int NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `categories` ADD `legacyCategoryId` int NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `categories` ADD CONSTRAINT `FK_categories_wallet` FOREIGN KEY (`walletId`) REFERENCES `wallets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
    );

    await queryRunner.query(`
      INSERT INTO \`categories\` (
        \`name\`,
        \`icon\`,
        \`enable\`,
        \`type\`,
        \`createdAt\`,
        \`updatedAt\`,
        \`deletedAt\`,
        \`userId\`,
        \`walletId\`,
        \`legacyCategoryId\`
      )
      SELECT
        c.\`name\`,
        c.\`icon\`,
        c.\`enable\`,
        c.\`type\`,
        c.\`createdAt\`,
        c.\`updatedAt\`,
        c.\`deletedAt\`,
        c.\`userId\`,
        w.\`id\`,
        c.\`id\`
      FROM \`categories\` c
      INNER JOIN \`wallets\` w ON w.\`userId\` = c.\`userId\`
      WHERE c.\`walletId\` IS NULL
    `);

    await queryRunner.query(`
      UPDATE \`records\` r
      INNER JOIN \`categories\` cloned
        ON cloned.\`legacyCategoryId\` = r.\`categoryId\`
       AND cloned.\`walletId\` = r.\`walletId\`
      SET r.\`categoryId\` = cloned.\`id\`
    `);

    await queryRunner.query(`
      UPDATE \`wallets\` w
      LEFT JOIN (
        SELECT
          cloned.\`walletId\`,
          GROUP_CONCAT(
            cloned.\`id\`
            ORDER BY
              CASE
                WHEN users.\`categoryOrder\` IS NULL OR users.\`categoryOrder\` = '' THEN 999999
                WHEN FIND_IN_SET(cloned.\`legacyCategoryId\`, users.\`categoryOrder\`) = 0 THEN 999999
                ELSE FIND_IN_SET(cloned.\`legacyCategoryId\`, users.\`categoryOrder\`)
              END,
              cloned.\`id\`
            SEPARATOR ','
          ) AS \`categoryOrder\`
        FROM \`categories\` cloned
        INNER JOIN \`users\` users ON users.\`id\` = cloned.\`userId\`
        WHERE cloned.\`walletId\` IS NOT NULL
          AND cloned.\`legacyCategoryId\` IS NOT NULL
        GROUP BY cloned.\`walletId\`
      ) orders ON orders.\`walletId\` = w.\`id\`
      SET w.\`categoryOrder\` = orders.\`categoryOrder\`
    `);

    await queryRunner.query(`
      DELETE original
      FROM \`categories\` original
      INNER JOIN \`wallets\` wallet ON wallet.\`userId\` = original.\`userId\`
      WHERE original.\`walletId\` IS NULL
        AND original.\`legacyCategoryId\` IS NULL
    `);
    await queryRunner.query(
      'ALTER TABLE `categories` DROP COLUMN `legacyCategoryId`',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `categories` ADD `legacyCategoryId` int NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `categories` DROP FOREIGN KEY `FK_categories_wallet`',
    );
    await queryRunner.query(
      'ALTER TABLE `categories` DROP COLUMN `walletId`',
    );
    await queryRunner.query(
      'ALTER TABLE `categories` DROP COLUMN `legacyCategoryId`',
    );
    await queryRunner.query(
      'ALTER TABLE `wallets` DROP COLUMN `categoryOrder`',
    );
  }
}
