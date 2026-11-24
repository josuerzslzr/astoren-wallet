import { Injectable } from "@nestjs/common";

export interface PlaceholderStatus {
  service: string;
  status: string;
}

/** Stub only: real behaviour lands in a later story. */
@Injectable()
export class AppService {
  getStatus(): PlaceholderStatus {
    return { service: "fx-sim", status: "stub" };
  }
}
