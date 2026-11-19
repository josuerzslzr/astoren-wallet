// Boundaries fixture probe: entry point may reach a non-platform module's service (must pass)
import { ExchangeService } from '../exchange/exchange.service.js';

export const probe = ExchangeService;
