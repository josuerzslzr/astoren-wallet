import { Module } from '@nestjs/common';
import { WALLET_MODULES } from './app.module.js';

/** Composition root of the worker runnable (`worker.ts`). Jobs land in later stories. */
@Module({
  imports: [...WALLET_MODULES],
})
export class WorkerModule {}
