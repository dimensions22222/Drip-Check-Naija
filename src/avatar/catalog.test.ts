import { describe, expect, it } from "vitest";
import { defaultLooks, normalizeLook } from "./catalog";

describe("avatar look normalization", () => {
  it("restores the character defaults for incompatible items", () => {
    const normalized = normalizeLook({
      hair: "hair-spikes",
      top: "missing-top",
      bottom: "missing-bottom",
      expression: "unknown",
      view: "sideways",
    } as never, "femme");

    expect(normalized.hair).toBe("hair-bob");
    expect(normalized.top).toBe(defaultLooks.femme.top);
    expect(normalized.bottom).toBe(defaultLooks.femme.bottom);
    expect(normalized.expression).toBe("normal");
  });

  it("accepts compatible character-specific items", () => {
    const normalized = normalizeLook({
      hair: "hair-bantu",
      bottom: "bottom-skirt",
      expression: "happy",
      view: "back",
    }, "femme");

    expect(normalized.hair).toBe("hair-bantu");
    expect(normalized.bottom).toBe("bottom-skirt");
    expect(normalized.expression).toBe("happy");
    expect(normalized.view).toBe("back");
  });

  it("maps legacy chain, glasses, and bag accessories", () => {
    const normalized = normalizeLook({
      accessory: "acc-chain",
    } as never, "masc");

    expect(normalized.chain).toBe("chain-gold");
  });
});
