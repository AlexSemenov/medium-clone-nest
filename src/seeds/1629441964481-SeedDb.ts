import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDb1629441964481 implements MigrationInterface {
  name = 'SeedDb1629441964481';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO tags (name) VALUES ('dragons'), ('coffee'), ('nestjs')`,
    );

    // password is 123
    await queryRunner.query(
      `INSERT INTO users (username, email, password) VALUES ('foo', 'foo@example.com', '$2b$10$OeIRay3OMmg7V6/NAPYj0u4Bgd9eKRlF5KalMhEYTzqANJ4AypHMW'), ('bar','bar@example.com', '$2b$10$OeIRay3OMmg7V6/NAPYj0u4Bgd9eKRlF5KalMhEYTzqANJ4AypHMW')`,
    );

    await queryRunner.query(
      `INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('first_article', 'first_title', 'first_description', 'first_body', 'dragons,nestjs', 1), ('second_article', 'second__title', 'second__description', 'second__body', 'coffee,nestjs', 2)`,
    );
  }

  public async down(): Promise<void> {}
}
