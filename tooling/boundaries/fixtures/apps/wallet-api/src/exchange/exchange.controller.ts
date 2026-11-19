// Boundaries fixture probe: entry point still cannot reach another module's private file (must fail)
import { AccountEntity } from '../ledger/account.entity.js';

export const probe = AccountEntity;
