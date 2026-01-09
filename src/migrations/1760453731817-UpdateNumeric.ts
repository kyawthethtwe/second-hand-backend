import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateNumeric1760453731817 implements MigrationInterface {
  name = 'UpdateNumeric1760453731817';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" SET DEFAULT '0.05'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" SET DEFAULT 0.05`,
    );
  }
}
