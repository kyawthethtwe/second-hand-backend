import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransactionExpiration1763402910974
  implements MigrationInterface
{
  name = 'AddTransactionExpiration1763402910974';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "expiresAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."transaction_status_enum" RENAME TO "transaction_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transaction_status_enum" AS ENUM('pending', 'paid', 'shipping', 'completed', 'cancelled', 'refunded', 'expired')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "status" TYPE "public"."transaction_status_enum" USING "status"::"text"::"public"."transaction_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(`DROP TYPE "public"."transaction_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" SET DEFAULT '0.05'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."transaction_item_status_enum" RENAME TO "transaction_item_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transaction_item_status_enum" AS ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'expired')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "status" TYPE "public"."transaction_item_status_enum" USING "status"::"text"::"public"."transaction_item_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."transaction_item_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."transaction_item_status_enum_old" AS ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "status" TYPE "public"."transaction_item_status_enum_old" USING "status"::"text"::"public"."transaction_item_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."transaction_item_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."transaction_item_status_enum_old" RENAME TO "transaction_item_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" SET DEFAULT 0.05`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transaction_status_enum_old" AS ENUM('pending', 'paid', 'shipping', 'completed', 'cancelled', 'refunded')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "status" TYPE "public"."transaction_status_enum_old" USING "status"::"text"::"public"."transaction_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(`DROP TYPE "public"."transaction_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."transaction_status_enum_old" RENAME TO "transaction_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "expiresAt"`,
    );
  }
}
