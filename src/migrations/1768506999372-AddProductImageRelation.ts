import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductImageRelation1768506999372 implements MigrationInterface {
    name = 'AddProductImageRelation1768506999372'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "image" ADD "productId" uuid`);
        await queryRunner.query(`ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "image" ADD CONSTRAINT "FK_c6eb61588205e25a848ba6105cd" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "image" DROP CONSTRAINT "FK_c6eb61588205e25a848ba6105cd"`);
        await queryRunner.query(`ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "image" DROP COLUMN "productId"`);
    }

}
