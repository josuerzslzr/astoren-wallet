import { Controller, Get } from "@nestjs/common";
import { AppService, type PlaceholderStatus } from "./app.service.js";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getStatus(): PlaceholderStatus {
    return this.appService.getStatus();
  }
}
