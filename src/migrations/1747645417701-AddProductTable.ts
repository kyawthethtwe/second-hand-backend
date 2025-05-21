import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductTable1747645417701 implements MigrationInterface {
  name = 'AddProductTable1747645417701';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "publicId" character varying, "alt" character varying, "isMain" boolean NOT NULL DEFAULT false, "order" integer NOT NULL DEFAULT '0', "width" integer, "height" integer, "format" character varying, "productId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_99d98a80f57857d51b5f63c8240" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "commissionRate" SET DEFAULT '0.005'`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_image" ADD CONSTRAINT "FK_40ca0cd115ef1ff35351bed8da2" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_image" DROP CONSTRAINT "FK_40ca0cd115ef1ff35351bed8da2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "commissionRate" SET DEFAULT 0.005`,
    );
    await queryRunner.query(`DROP TABLE "product_image"`);
  }
}
