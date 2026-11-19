import { NestFactory, ModulesContainer } from '@nestjs/core';
import { WALLET_MODULES } from './app.module.js';
import { WorkerModule } from './worker.module.js';

describe('worker runnable (WorkerModule)', () => {
  it('starts an application context with all ten modules and closes cleanly', async () => {
    const ctx = await NestFactory.createApplicationContext(WorkerModule, { logger: false });
    await ctx.init();

    const registered = [...ctx.get(ModulesContainer).values()].map((m) => m.metatype);
    expect(WALLET_MODULES).toHaveLength(10);
    expect(registered).toEqual(expect.arrayContaining(WALLET_MODULES));

    await ctx.close();
  });
});
