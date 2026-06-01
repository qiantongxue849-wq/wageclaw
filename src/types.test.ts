import { describe, it, expect } from "vitest";
import type { WageClawState, PetState, Theme, Mood, CountMode, Currency, PetStyle, TransactionCategory } from "./types";
import { createDefaultState } from "./composables/useWageClaw";

describe("type definitions", () => {
  describe("WageClawState", () => {
    it("createDefaultState returns a valid WageClawState", () => {
      const state: WageClawState = createDefaultState();
      expect(state).toBeDefined();
      expect(typeof state.nickname).toBe("string");
      expect(typeof state.salary).toBe("number");
      expect(typeof state.walletBalance).toBe("number");
      expect(typeof state.rageBalance).toBe("number");
      expect(typeof state.pawBalance).toBe("number");
      expect(typeof state.privacyMode).toBe("boolean");
      expect(typeof state.onboardingDone).toBe("boolean");
    });

    it("has valid theme type", () => {
      const state = createDefaultState();
      const validThemes: Theme[] = ["forest", "arcade", "sakura", "ink", "citrus"];
      expect(validThemes).toContain(state.theme);
    });

    it("has valid mood type", () => {
      const state = createDefaultState();
      const validMoods: Mood[] = ["rage", "stable", "numb"];
      expect(validMoods).toContain(state.mood);
    });

    it("has valid countMode type", () => {
      const state = createDefaultState();
      const validModes: CountMode[] = ["natural", "workday"];
      expect(validModes).toContain(state.countMode);
    });

    it("has valid petStyle type", () => {
      const state = createDefaultState();
      const validStyles: PetStyle[] = ["rageBlob", "capybaraZen", "lazyCat", "lazyDog", "honestCow"];
      expect(validStyles).toContain(state.petStyle);
    });
  });

  describe("PetState", () => {
    it("has all required numeric fields", () => {
      const pet: PetState = createDefaultState().pet;
      expect(typeof pet.rage).toBe("number");
      expect(typeof pet.growth).toBe("number");
      expect(typeof pet.light).toBe("number");
      expect(typeof pet.mana).toBe("number");
      expect(typeof pet.satiety).toBe("number");
      expect(typeof pet.affection).toBe("number");
      expect(typeof pet.bloodPressure).toBe("number");
      expect(typeof pet.touchCount).toBe("number");
      expect(typeof pet.touchHeat).toBe("number");
    });

    it("has valid interaction mode", () => {
      const pet: PetState = createDefaultState().pet;
      expect(["normal", "rage"]).toContain(pet.interactionMode);
    });
  });

  describe("Transaction", () => {
    it("has valid category type", () => {
      const validCategories: TransactionCategory[] = ["income", "expense", "wish", "mall", "pet"];
      expect(validCategories).toHaveLength(5);
    });

    it("currency type has wallet, paw, and rage", () => {
      const validCurrencies: Currency[] = ["wallet", "paw", "rage"];
      expect(validCurrencies).toHaveLength(3);
    });
  });
});
