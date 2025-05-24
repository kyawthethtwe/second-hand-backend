import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateImageEntity1748098075018 implements MigrationInterface {
  name = 'UpdateImageEntity1748098075018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "commissionRate" SET DEFAULT '0.005'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "commissionRate" SET DEFAULT 0.005`,
    );
  }
}
