import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module.js';

/** Worker runnable: an application context with no HTTP listener (AD-1). */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks();
  // Nothing else holds the event loop yet, so keep the process alive until a
  // shutdown signal; the shutdown hooks close the context and re-raise it.
  setInterval(() => {}, 1 << 30);
  new Logger('Worker').log('worker context started');
}
await bootstrap();
