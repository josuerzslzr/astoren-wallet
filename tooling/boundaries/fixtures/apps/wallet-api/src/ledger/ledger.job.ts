// Boundaries fixture probe: entry point may use its own module's private files (must pass)
import { AccountEntity } from "./account.entity.js";

export const probe = AccountEntity;
