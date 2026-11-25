export const DRIP_CITY_ROOM_IDS = [
  "lagos-fashion-district",
  "mainland-hangout",
  "island-style-avenue",
  "campus-plaza",
  "naija-market",
  "rooftop-lounge",
] as const;

export type DripCityRoomId = (typeof DRIP_CITY_ROOM_IDS)[number];

export function isDripCityRoomId(roomId: string): roomId is DripCityRoomId {
  return (DRIP_CITY_ROOM_IDS as readonly string[]).includes(roomId);
}

export function dripCityRealtimeTopic(roomId: string): string | null {
  return isDripCityRoomId(roomId) ? `drip-city:${roomId}` : null;
}

export function isPermittedRealtimePayload(
  payload: unknown,
  expectedPublicId: string,
): payload is Record<string, unknown> {
  if (!payload || typeof payload !== "object") return false;
  const publicId = (payload as Record<string, unknown>).publicId;
  return publicId === expectedPublicId;
}
