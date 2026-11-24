import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import {
  spikeEchoRequestSchema,
  type SpikeEchoRequest,
} from "@astoren/contracts";

/**
 * Story 1.1 OpenAPI spike: proves that a zod v4 schema passed through the
 * NestJS Standard Schema `schema` route option both validates the body and
 * shows up in the OpenAPI document. Throwaway; Story 1.2 replaces it.
 */
@Controller("spike")
export class SpikeController {
  @Post("echo")
  @HttpCode(200)
  echo(@Body({ schema: spikeEchoRequestSchema }) body: SpikeEchoRequest): {
    echoed: string[];
  } {
    return { echoed: Array.from({ length: body.count }, () => body.message) };
  }
}
