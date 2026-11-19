import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { DepositsModule } from './deposits/deposits.module.js';
import { ExchangeModule } from './exchange/exchange.module.js';
import { HistoryModule } from './history/history.module.js';
import { IdentityModule } from './identity/identity.module.js';
import { LedgerModule } from './ledger/ledger.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PartnersModule } from './partners/partners.module.js';
import { PlatformModule } from './platform/platform.module.js';
import { TransfersModule } from './transfers/transfers.module.js';
import { WithdrawalsModule } from './withdrawals/withdrawals.module.js';

/** The ten AD-3 modules, registered by both composition roots. */
export const WALLET_MODULES = [
  IdentityModule,
  LedgerModule,
  ExchangeModule,
  DepositsModule,
  WithdrawalsModule,
  TransfersModule,
  NotificationsModule,
  HistoryModule,
  PartnersModule,
  PlatformModule,
];

/** Composition root of the api runnable (`main.ts`). */
@Module({
  imports: [...WALLET_MODULES],
  providers: [
    // Validation goes only through the Standard Schema `schema` route option (AD-22).
    { provide: APP_PIPE, useValue: new StandardSchemaValidationPipe() },
  ],
})
export class AppModule {}
