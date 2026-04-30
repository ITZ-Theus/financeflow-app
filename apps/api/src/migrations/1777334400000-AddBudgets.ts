import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBudgets1777334400000 implements MigrationInterface {
  name = 'AddBudgets1777334400000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "budgets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "amount" numeric(10,2) NOT NULL,
        "month" integer NOT NULL,
        "year" integer NOT NULL,
        "categoryId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_budgets_id" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_budgets_user_category_month_year"
      ON "budgets" ("userId", "categoryId", "month", "year")
    `)

    await this.addForeignKeyIfMissing(queryRunner, 'budgets', 'userId', 'users', 'FK_budgets_user', 'CASCADE')
    await this.addForeignKeyIfMissing(queryRunner, 'budgets', 'categoryId', 'categories', 'FK_budgets_category', 'CASCADE')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "budgets"')
  }

  private async addForeignKeyIfMissing(
    queryRunner: QueryRunner,
    table: string,
    column: string,
    referencedTable: string,
    constraintName: string,
    onDelete: string
  ) {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint c
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
          WHERE c.conrelid = '"${table}"'::regclass
            AND c.contype = 'f'
            AND a.attname = '${column}'
        ) THEN
          ALTER TABLE "${table}"
          ADD CONSTRAINT "${constraintName}"
          FOREIGN KEY ("${column}") REFERENCES "${referencedTable}"("id") ON DELETE ${onDelete};
        END IF;
      END
      $$;
    `)
  }
}
