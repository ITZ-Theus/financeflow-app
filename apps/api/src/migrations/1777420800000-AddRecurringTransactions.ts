import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddRecurringTransactions1777420800000 implements MigrationInterface {
  name = 'AddRecurringTransactions1777420800000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN IF NOT EXISTS "isRecurring" boolean NOT NULL DEFAULT false
    `)

    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN IF NOT EXISTS "recurrenceInterval" character varying
    `)

    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN IF NOT EXISTS "recurrenceEndDate" date
    `)

    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN IF NOT EXISTS "parentTransactionId" uuid
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "transactions" DROP COLUMN IF EXISTS "parentTransactionId"')
    await queryRunner.query('ALTER TABLE "transactions" DROP COLUMN IF EXISTS "recurrenceEndDate"')
    await queryRunner.query('ALTER TABLE "transactions" DROP COLUMN IF EXISTS "recurrenceInterval"')
    await queryRunner.query('ALTER TABLE "transactions" DROP COLUMN IF EXISTS "isRecurring"')
  }
}
