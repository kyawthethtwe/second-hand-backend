import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePriceToNumeric1760452546701 implements MigrationInterface {
  name = 'UpdatePriceToNumeric1760452546701';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_24f384481d981baf731f2fbb16"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f940be9cb5d052d29ee544aa7e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "price" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "originalPrice" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "totalAmount" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "totalCommission" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "unitPrice" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "totalPrice" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" SET DEFAULT '0.05'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "commissionAmount" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "sellerPayout" TYPE numeric`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_24f384481d981baf731f2fbb16" ON "product" ("categoryId", "status", "price") `,
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
      `DROP INDEX "public"."IDX_24f384481d981baf731f2fbb16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "sellerPayout" TYPE numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "commissionAmount" TYPE numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" SET DEFAULT 0.05`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" TYPE numeric(10,4)`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "totalPrice" TYPE numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "unitPrice" TYPE numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "totalCommission" TYPE numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "totalAmount" TYPE numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "originalPrice" TYPE numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "price" TYPE numeric(10,2)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f940be9cb5d052d29ee544aa7e" ON "product" ("price", "condition", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_24f384481d981baf731f2fbb16" ON "product" ("price", "status", "categoryId") `,
    );
  }
}
