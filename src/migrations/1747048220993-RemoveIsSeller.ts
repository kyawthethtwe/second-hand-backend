import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveIsSeller1747048220993 implements MigrationInterface {
  name = 'RemoveIsSeller1747048220993';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isSeller"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "isSeller" boolean NOT NULL DEFAULT false`,
    );
  }
}
