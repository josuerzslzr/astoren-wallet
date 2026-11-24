import { Test } from "@nestjs/testing";
import { ModulesContainer } from "@nestjs/core";
import { AppModule } from "../src/app.module.js";

const EXPECTED_MODULES = [
  "IdentityModule",
  "LedgerModule",
  "ExchangeModule",
  "DepositsModule",
  "WithdrawalsModule",
  "TransfersModule",
  "NotificationsModule",
  "HistoryModule",
  "PartnersModule",
  "PlatformModule",
];

describe("api runnable (AppModule)", () => {
  it("starts, registers all ten modules and closes cleanly", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const names = [...app.get(ModulesContainer).values()].map(
      (m) => m.metatype.name,
    );
    expect(names).toEqual(expect.arrayContaining(EXPECTED_MODULES));

    await app.close();
  });
});
