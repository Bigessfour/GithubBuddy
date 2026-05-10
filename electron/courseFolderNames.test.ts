import { describe, it, expect } from "vitest";
import { parseDayFolderName, parseWeekFolderName } from "./courseFolderNames";

describe("parseWeekFolderName", () => {
  it.each([
    ["week1", 1],
    ["Week10", 10],
    ["Week14-CICDPipeline", 14],
    ["week-2", 2],
    ["week_3", 3],
    ["week 4", 4],
    ["w5", 5],
    ["w12-notes", 12],
    ["readme", null],
    ["week", null],
  ])("%s → %s", (name, n) => {
    expect(parseWeekFolderName(name)).toBe(n);
  });
});

describe("parseDayFolderName", () => {
  it.each([
    ["day1", 1],
    ["Day02", 2],
    ["Day04-AM", 4],
    ["DAY4PM-AI_Useage", 4],
    ["day-3", 3],
    ["day_4", 4],
    ["day 5", 5],
    ["d6", 6],
    ["d7-lab", 7],
    ["notes", null],
  ])("%s → %s", (name, n) => {
    expect(parseDayFolderName(name)).toBe(n);
  });
});
