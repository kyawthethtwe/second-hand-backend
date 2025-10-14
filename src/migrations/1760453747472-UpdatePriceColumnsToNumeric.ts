import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePriceColumnsToNumeric1760453747472 implements MigrationInterface {
    name = 'UpdatePriceColumnsToNumeric1760453747472'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" SET DEFAULT '0.05'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" SET DEFAULT 0.05`);
    }

}
