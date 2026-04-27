import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1777248000000 implements MigrationInterface {
  name = 'InitialSchema1777248000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categories_type_enum') THEN
          CREATE TYPE "categories_type_enum" AS ENUM ('income', 'expense');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transactions_type_enum') THEN
          CREATE TYPE "transactions_type_enum" AS ENUM ('income', 'expense');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goals_status_enum') THEN
          CREATE TYPE "goals_status_enum" AS ENUM ('active', 'completed', 'cancelled');
        END IF;
      END
      $$;
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email")
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "color" character varying NOT NULL DEFAULT '#3b82f6',
        "icon" character varying NOT NULL DEFAULT 'tag',
        "type" "categories_type_enum" NOT NULL,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "type" "transactions_type_enum" NOT NULL,
        "date" date NOT NULL,
        "description" character varying,
        "categoryId" uuid,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions_id" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "goals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "targetAmount" numeric(10,2) NOT NULL,
        "currentAmount" numeric(10,2) NOT NULL DEFAULT '0',
        "deadline" date NOT NULL,
        "status" "goals_status_enum" NOT NULL DEFAULT 'active',
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_goals_id" PRIMARY KEY ("id")
      )
    `)

    await this.addForeignKeyIfMissing(queryRunner, 'categories', 'userId', 'users', 'FK_categories_user', 'NO ACTION')
    await this.addForeignKeyIfMissing(queryRunner, 'transactions', 'userId', 'users', 'FK_transactions_user', 'NO ACTION')
    await this.replaceCategoryForeignKey(queryRunner)
    await this.addForeignKeyIfMissing(queryRunner, 'goals', 'userId', 'users', 'FK_goals_user', 'NO ACTION')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "goals"')
    await queryRunner.query('DROP TABLE IF EXISTS "transactions"')
    await queryRunner.query('DROP TABLE IF EXISTS "categories"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_email"')
    await queryRunner.query('DROP TABLE IF EXISTS "users"')
    await queryRunner.query('DROP TYPE IF EXISTS "goals_status_enum"')
    await queryRunner.query('DROP TYPE IF EXISTS "transactions_type_enum"')
    await queryRunner.query('DROP TYPE IF EXISTS "categories_type_enum"')
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

  private async replaceCategoryForeignKey(queryRunner: QueryRunner) {
    await queryRunner.query(`
      DO $$
      DECLARE
        fk_name text;
      BEGIN
        SELECT c.conname INTO fk_name
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        WHERE c.conrelid = '"transactions"'::regclass
          AND c.contype = 'f'
          AND a.attname = 'categoryId'
        LIMIT 1;

        IF fk_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "transactions" DROP CONSTRAINT %I', fk_name);
        END IF;

        ALTER TABLE "transactions"
        ADD CONSTRAINT "FK_transactions_category"
        FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL;
      END
      $$;
    `)
  }
}
