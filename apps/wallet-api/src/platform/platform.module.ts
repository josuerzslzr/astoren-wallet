import { Module } from '@nestjs/common';
import { SpikeController } from './spike.controller.js';

/** AD-3 module. Holds only the Story 1.1 OpenAPI spike route for now. */
@Module({
  controllers: [SpikeController],
})
export class PlatformModule {}
