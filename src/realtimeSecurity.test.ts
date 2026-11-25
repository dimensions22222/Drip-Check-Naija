import { describe, expect, it } from "vitest";
import {
  dripCityRealtimeTopic,
  isPermittedRealtimePayload,
  isDripCityRoomId,
} from "./realtimeSecurity";

describe("Drip City realtime security", () => {
  it("allowlists protected room topics", () => {
    expect(isDripCityRoomId("lagos-fashion-district")).toBe(true);
    expect(isDripCityRoomId("not-a-real-room")).toBe(false);
    expect(dripCityRealtimeTopic("lagos-fashion-district")).toBe(
      "drip-city:lagos-fashion-district",
    );
    expect(dripCityRealtimeTopic("not-a-real-room")).toBeNull();
  });

  it("rejects realtime payloads that do not identify the current public ID", () => {
    expect(isPermittedRealtimePayload({ publicId: "player-a" }, "player-a")).toBe(true);
    expect(isPermittedRealtimePayload({ publicId: "player-b" }, "player-a")).toBe(false);
    expect(isPermittedRealtimePayload(null, "player-a")).toBe(false);
  });
});
