import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateQuantityDefault1760556302013 implements MigrationInterface {
    name = 'UpdateQuantityDefault1760556302013'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "quantity" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" SET DEFAULT '0.05'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "quantity" DROP DEFAULT`);
    }

}
