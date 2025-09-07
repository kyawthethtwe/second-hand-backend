import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserFavoriteEntity1757265783634
  implements MigrationInterface
{
  name = 'UpdateUserFavoriteEntity1757265783634';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_favourite" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "productId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b948b7e965123f9ca0b60383334" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_db55a5627f4c762ab14919b445" ON "user_favourite" ("userId", "productId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" SET DEFAULT '0.05'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_favourite" ADD CONSTRAINT "FK_440164481114218a3d482483709" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_favourite" ADD CONSTRAINT "FK_86dfb26ecd45336246c1276bb89" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_favourite" DROP CONSTRAINT "FK_86dfb26ecd45336246c1276bb89"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_favourite" DROP CONSTRAINT "FK_440164481114218a3d482483709"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_item" ALTER COLUMN "commissionRate" SET DEFAULT 0.05`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_db55a5627f4c762ab14919b445"`,
    );
    await queryRunner.query(`DROP TABLE "user_favourite"`);
  }
}
