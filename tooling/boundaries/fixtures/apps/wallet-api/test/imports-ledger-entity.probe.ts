// Boundaries fixture probe: test -> another module's private file (must pass)
import { AccountEntity } from "../src/ledger/account.entity.js";

export const probe = AccountEntity;
