import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransactionTables1753383084666 implements MigrationInterface {
  name = 'AddTransactionTables1753383084666';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_da429de57e23852dae37f1d182b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_fd965536176f304a7dd64937165"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transaction_item_status_enum" AS ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "transaction_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transactionId" uuid NOT NULL, "productId" uuid NOT NULL, "sellerId" uuid NOT NULL, "quantity" integer NOT NULL, "unitPrice" numeric(10,2) NOT NULL, "totalPrice" numeric(10,2) NOT NULL, "commissionRate" numeric(10,4) NOT NULL DEFAULT '0.05', "commissionAmount" numeric(10,2) NOT NULL, "sellerPayout" numeric(10,2) NOT NULL, "status" "public"."transaction_item_status_enum" NOT NULL DEFAULT 'pending', "trackingNumber" character varying, "shippingMethod" character varying, "shippedAt" TIMESTAMP, "deliveredAt" TIMESTAMP, CONSTRAINT "PK_b40595241a69876722f692d041f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "sellerId"`);
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "productId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "productPrice"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "commissionRate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "commissionAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "sellerPayout"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "isAvailable" boolean NOT NULL DEFAULT true`,
    );
    // First add the column as nullable, update existing records, then make it not null
    await queryRunner.query(`ALTER TABLE "product" ADD "quantity" integer`);
    await queryRunner.query(
      `UPDATE "product" SET "quantity" = 1 WHERE "quantity" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "quantity" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "totalAmount" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "totalCommission" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "cancellationReason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "paymentMetadata" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "shippingInstructions" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ADD CONSTRAINT "FK_2705caeb66a0fa4505f53f04e8f" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ADD CONSTRAINT "FK_e568affa78f03a353d8d3bad715" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ADD CONSTRAINT "FK_b6b18b2373da805a8246f449b2a" FOREIGN KEY ("sellerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction_item" DROP CONSTRAINT "FK_b6b18b2373da805a8246f449b2a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" DROP CONSTRAINT "FK_e568affa78f03a353d8d3bad715"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" DROP CONSTRAINT "FK_2705caeb66a0fa4505f53f04e8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "shippingInstructions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "paymentMetadata"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "cancellationReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "totalCommission"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "totalAmount"`,
    );
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "quantity"`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "isAvailable"`);
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "sellerPayout" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "commissionAmount" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "commissionRate" numeric(10,4) NOT NULL DEFAULT 0.005`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "productPrice" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "productId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "sellerId" uuid NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "transaction_item"`);
    await queryRunner.query(
      `DROP TYPE "public"."transaction_item_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_fd965536176f304a7dd64937165" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_da429de57e23852dae37f1d182b" FOREIGN KEY ("sellerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
