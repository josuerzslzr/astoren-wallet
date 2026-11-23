import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('wallet-api (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/spike/echo (POST)', () => {
    return request(app.getHttpServer())
      .post('/spike/echo')
      .send({ message: 'hi' })
      .expect(200)
      .expect({ echoed: ['hi'] });
  });

  afterEach(async () => {
    await app.close();
  });
});
