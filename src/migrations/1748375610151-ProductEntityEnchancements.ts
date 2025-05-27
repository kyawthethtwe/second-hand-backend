import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductEntityEnchancements1748375610151
  implements MigrationInterface
{
  name = 'ProductEntityEnchancements1748375610151';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" ADD "viewCount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "favoriteCount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "originalPrice" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "brand" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "model" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "yearOfPurchase" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "hasWarranty" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "warrantyExpiration" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "reasonForSelling" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "isUrgentSale" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "availableUntil" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."product_status_enum" RENAME TO "product_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."product_status_enum" AS ENUM('active', 'sold', 'hidden', 'pending_review', 'reserved', 'expired')`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "status" TYPE "public"."product_status_enum" USING "status"::"text"::"public"."product_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(`DROP TYPE "public"."product_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "commissionRate" SET DEFAULT '0.005'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b71c587b0fd3855fa23b759ca" ON "product" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3cbcabdb0a2b87ee77a3175483" ON "product" ("location") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_24f384481d981baf731f2fbb16" ON "product" ("categoryId", "status", "price") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5cca049ed53eb6f6465e95db88" ON "product" ("sellerId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f940be9cb5d052d29ee544aa7e" ON "product" ("price", "condition", "status") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f940be9cb5d052d29ee544aa7e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5cca049ed53eb6f6465e95db88"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_24f384481d981baf731f2fbb16"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3cbcabdb0a2b87ee77a3175483"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b71c587b0fd3855fa23b759ca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "commissionRate" SET DEFAULT 0.005`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."product_status_enum_old" AS ENUM('active', 'sold', 'hidden')`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "status" TYPE "public"."product_status_enum_old" USING "status"::"text"::"public"."product_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(`DROP TYPE "public"."product_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."product_status_enum_old" RENAME TO "product_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN "availableUntil"`,
    );
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "isUrgentSale"`);
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN "reasonForSelling"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN "warrantyExpiration"`,
    );
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "hasWarranty"`);
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN "yearOfPurchase"`,
    );
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "model"`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "brand"`);
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN "originalPrice"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN "favoriteCount"`,
    );
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "viewCount"`);
  }
}
