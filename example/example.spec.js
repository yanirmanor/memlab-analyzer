import { test, expect } from "@playwright/test";
const {
  takeJSHeapSnapshot,
  SnapshotTag,
  createSnapSeqMetadata,
  createRunMetadata,
} = require("memlab-analyzer");
const fs = require("fs");

test.describe("Memory Analysis Example", () => {
  // Define working directory for snapshots
  const workDir = "./memlab-snapshots";
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir);
  }

  test("simple memory snapshot flow", async ({ page, browser }) => {
    // Step 1: Go to Playwright homepage
    await page.goto("https://playwright.dev/");
    await page.waitForTimeout(2000);
    await takeJSHeapSnapshot(page, SnapshotTag.BASELINE, workDir);

    // Step 2: Click the 'Get started' link
    await page.getByRole("link", { name: "Get started" }).click();
    await page.waitForTimeout(2000);
    await takeJSHeapSnapshot(page, SnapshotTag.TARGET, workDir);

    // Step 3: Go back to homepage
    await page.goBack();
    await page.waitForTimeout(2000);
    await takeJSHeapSnapshot(page, SnapshotTag.FINAL, workDir);

    // Create required metadata files
    await createSnapSeqMetadata(
      {
        urls: [
          "https://playwright.dev/",
          "https://playwright.dev/docs/intro",
          "https://playwright.dev/",
        ],
        titles: ["Homepage", "Get Started Page", "Homepage After Back"],
        baseUrl: "https://playwright.dev/",
        actionName: "open-get-started",
      },
      workDir
    );

    await createRunMetadata(
      {
        browserName: browser._initializer?.name || "chromium",
        browserVersion: await page.evaluate(() => navigator.userAgent),
        testName: "playwright-memory-leak-test",
      },
      workDir
    );

    console.log("Snapshots taken successfully");
    expect(true).toBe(true);
  });
});
