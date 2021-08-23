import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserEntity } from '@app/user/entities/user.entity';
import { CreateArticleDto } from '@app/article/dto/create-article.dto';
import { ArticleEntity } from '@app/article/entities/article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, getRepository, Repository } from 'typeorm';
import { ArticleResponseInterface } from '@app/article/types/article-response.interface';
import slugify from 'slugify';
import { UpdateArticleDto } from '@app/article/dto/update-article.dto';
import { ArticlesResponseInterface } from '@app/article/types/articles-response.interface';
import { FollowEntity } from '@app/profile/entities/follow.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleResponse: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userResponse: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followResponse: Repository<FollowEntity>,
  ) {}

  async createArticle(
    user: UserEntity,
    createArticleDto: CreateArticleDto,
  ): Promise<ArticleEntity> {
    const article = new ArticleEntity();
    Object.assign(article, createArticleDto);
    if (!article.tagList) {
      article.tagList = [];
    }
    article.slug = this.getSlug(createArticleDto.title);
    article.author = user;
    return await this.articleResponse.save(article);
  }

  async getArticleBySlug(slug: string): Promise<ArticleEntity> {
    return await this.articleResponse.findOne({ slug });
  }

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article };
  }

  private getSlug(title: string): string {
    return (
      slugify(title, { lower: true }) +
      '-' +
      ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
    );
  }

  async deleteBySlug(slug: string, userId: number): Promise<DeleteResult> {
    const article = await this.getArticleBySlug(slug);
    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    console.log(article);

    if (article.author.id !== userId) {
      throw new HttpException('You mast be author', HttpStatus.FORBIDDEN);
    }

    return await this.articleResponse.delete({ slug });
  }

  async updateBySlug(
    userId: number,
    slug: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleEntity> {
    const article = await this.getArticleBySlug(slug);

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    if (article.author.id !== userId) {
      throw new HttpException('You mast be author', HttpStatus.FORBIDDEN);
    }

    Object.assign(article, updateArticleDto);
    return await this.articleResponse.save(article);
  }

  async findAll(
    userId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author');

    queryBuilder.orderBy('articles.createdAt', 'DESC');
    const articlesCount = await queryBuilder.getCount();

    if (query.author) {
      const author = await this.userResponse.findOne({
        username: query.author,
      });
      queryBuilder.andWhere('articles.author.id = :id', {
        id: author.id,
      });
    }

    if (query.tag) {
      queryBuilder.andWhere('articles.tagList LIKE :tag', {
        tag: `%${query.tag}%`,
      });
    }

    if (query.favorited) {
      const author = await this.userResponse.findOne(
        {
          username: query.favorited,
        },
        { relations: ['favorites'] },
      );

      const ids = author.favorites.map((value) => value.id);
      if (ids.length) {
        queryBuilder.andWhere('articles.authorId IN (:...ids)', { ids });
      } else {
        queryBuilder.andWhere('1=0');
      }
    }

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }
    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    let favoriteIds = [];

    if (userId) {
      const currentUser = await this.userResponse.findOne(
        {
          username: query.favorited,
        },
        { relations: ['favorites'] },
      );
      favoriteIds = currentUser?.favorites?.length
        ? currentUser.favorites.map((value) => value.id)
        : [];
    }

    const articles = await queryBuilder.getMany();
    const articlesWithFavorites = articles.map((value) => {
      const favorited = favoriteIds.includes(value.id);
      return { ...value, favorited };
    });

    return { articles: articlesWithFavorites, articlesCount };
  }

  async addArticleToFavorites(userId: number, slug: string) {
    const article = await this.getArticleBySlug(slug);
    const user = await this.userResponse.findOne(userId, {
      relations: ['favorites'],
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    const isNotFavorite =
      user.favorites.findIndex(
        (articleInFavorite) => articleInFavorite.id === article.id,
      ) === -1;

    if (isNotFavorite) {
      user.favorites.push(article);
      article.favoritesCount++;
      await this.userResponse.save(user);
      await this.articleResponse.save(article);
    }
    return article;
  }

  async deleteArticleFromFavorites(userId: number, slug: string) {
    const article = await this.getArticleBySlug(slug);
    const user = await this.userResponse.findOne(userId, {
      relations: ['favorites'],
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    const articleIndex = user.favorites.findIndex(
      (articleInFavorite) => articleInFavorite.id === article.id,
    );

    if (articleIndex >= 0) {
      user.favorites.splice(articleIndex, 1);
      article.favoritesCount--;
      await this.userResponse.save(user);
      await this.articleResponse.save(article);
    }

    return article;
  }

  async getFeed(
    userId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const follow = await this.followResponse.find({ followId: userId });
    if (follow.length === 0) {
      return { articles: [], articlesCount: 0 };
    }

    const followingUserIds = follow.map((value) => value.followingId);

    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .where('articles.authorId IN (:...ids)', {
        ids: followingUserIds,
      });

    queryBuilder.orderBy('articles.createdAt', 'DESC');
    const articlesCount = await queryBuilder.getCount();

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }
    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    const articles = await queryBuilder.getMany();

    return { articles, articlesCount };
  }
}
