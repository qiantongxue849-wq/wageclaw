import { describe, it, expect } from "vitest";
import {
  parts,
  petStageSeries,
  mallItems,
  themeLabels,
  modeLabels,
  moodCopy,
  transactionCategories,
  workEvents,
  screenTitles,
  sampleStories
} from "./catalog";

describe("catalog data integrity", () => {
  describe("parts", () => {
    it("has at least 30 wish fragments", () => {
      expect(parts.length).toBeGreaterThanOrEqual(30);
    });

    it("all parts have required fields", () => {
      for (const part of parts) {
        expect(part.id).toBeTruthy();
        expect(part.wishItemId).toBeTruthy();
        expect(part.name).toBeTruthy();
        expect(part.ratio).toBeGreaterThan(0);
        expect(part.ratio).toBeLessThanOrEqual(1);
        expect(part.narrative).toBeTruthy();
      }
    });

    it("all part IDs are unique", () => {
      const ids = parts.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("petStageSeries", () => {
    it("has stages for all 5 pet styles", () => {
      expect(Object.keys(petStageSeries)).toHaveLength(5);
      expect(petStageSeries.rageBlob).toBeDefined();
      expect(petStageSeries.capybaraZen).toBeDefined();
      expect(petStageSeries.lazyCat).toBeDefined();
      expect(petStageSeries.lazyDog).toBeDefined();
      expect(petStageSeries.honestCow).toBeDefined();
    });

    it("each style has exactly 10 evolution stages", () => {
      for (const [style, stages] of Object.entries(petStageSeries)) {
        expect(stages, `${style} should have stages`).toHaveLength(10);
      }
    });

    it("stages have increasing thresholds", () => {
      for (const [style, stages] of Object.entries(petStageSeries)) {
        for (let i = 1; i < stages.length; i++) {
          expect(stages[i].threshold, `${style} stage ${i} threshold should increase`).toBeGreaterThan(
            stages[i - 1].threshold
          );
        }
      }
    });

    it("stages have levels 1-10", () => {
      for (const [style, stages] of Object.entries(petStageSeries)) {
        stages.forEach((stage, i) => {
          expect(stage.level, `${style} stage ${i} level`).toBe(i + 1);
        });
      }
    });

    it("first stage starts at threshold 0", () => {
      for (const [style, stages] of Object.entries(petStageSeries)) {
        expect(stages[0].threshold, `${style} first stage`).toBe(0);
      }
    });

    it("all stages have required fields", () => {
      for (const [style, stages] of Object.entries(petStageSeries)) {
        for (const stage of stages) {
          expect(stage.id, `${style} stage id`).toBeTruthy();
          expect(stage.name, `${style} stage name`).toBeTruthy();
          expect(stage.palette, `${style} stage palette`).toBeDefined();
          expect(stage.palette.body, `${style} palette body`).toBeTruthy();
        }
      }
    });
  });

  describe("mallItems", () => {
    it("has at least 15 mall items", () => {
      expect(mallItems.length).toBeGreaterThanOrEqual(15);
    });

    it("all items have required fields", () => {
      for (const item of mallItems) {
        expect(item.id).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(item.price).toBeGreaterThan(0);
        expect(item.description).toBeTruthy();
        expect(item.icon).toBeTruthy();
      }
    });

    it("all item IDs are unique", () => {
      const ids = mallItems.map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("physical items have wishable flag", () => {
      const physicalItems = mallItems.filter((i) => i.kind === "physical");
      expect(physicalItems.length).toBeGreaterThan(0);
      for (const item of physicalItems) {
        expect(item.wishable).toBe(true);
      }
    });
  });

  describe("themeLabels", () => {
    it("has at least 5 themes", () => {
      expect(Object.keys(themeLabels).length).toBeGreaterThanOrEqual(5);
    });

    it("all theme labels are non-empty strings", () => {
      for (const [key, label] of Object.entries(themeLabels)) {
        expect(label, `theme ${key}`).toBeTruthy();
      }
    });
  });

  describe("workEvents", () => {
    it("has at least 5 work events", () => {
      expect(workEvents.length).toBeGreaterThanOrEqual(5);
    });

    it("all events have choices", () => {
      for (const event of workEvents) {
        expect(event.choices.length, `event ${event.id} choices`).toBeGreaterThanOrEqual(2);
      }
    });

    it("all event IDs are unique", () => {
      const ids = workEvents.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("static data maps", () => {
    it("modeLabels has natural and workday", () => {
      expect(modeLabels.natural).toBeDefined();
      expect(modeLabels.workday).toBeDefined();
    });

    it("moodCopy has all 3 moods", () => {
      expect(moodCopy.rage).toBeDefined();
      expect(moodCopy.stable).toBeDefined();
      expect(moodCopy.numb).toBeDefined();
    });

    it("transactionCategories has all 5 categories", () => {
      expect(Object.keys(transactionCategories)).toHaveLength(5);
      expect(transactionCategories.income).toBeDefined();
      expect(transactionCategories.expense).toBeDefined();
      expect(transactionCategories.wish).toBeDefined();
      expect(transactionCategories.mall).toBeDefined();
      expect(transactionCategories.pet).toBeDefined();
    });

    it("screenTitles has all screen keys", () => {
      expect(Object.keys(screenTitles).length).toBeGreaterThanOrEqual(5);
    });

    it("sampleStories has at least 3 stories", () => {
      expect(sampleStories.length).toBeGreaterThanOrEqual(3);
    });
  });
});
