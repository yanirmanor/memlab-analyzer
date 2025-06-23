# memlab-analyzer

CLI and utilities for analyzing memory leaks with MemLab and Playwright.

## Installation

```
npm install -g ./memlab-analyzer
```

## Usage

### CLI

Analyze memory leaks from a directory of MemLab snapshots:

```
analyze-leaks [snapshotDir] [outputFormat] [outputFile]
```

- `snapshotDir`: Directory containing MemLab snapshots (default: `./memlab-snapshots`)
- `outputFormat`: `console`, `json`, or `text` (default: `console`)
- `outputFile`: Base name for output file (default: `memlab-report`)

### As a Library

#### 1. Take Snapshots in Playwright

```js
const {
  takeJSHeapSnapshot,
  SnapshotTag,
  createSnapSeqMetadata,
  createRunMetadata,
} = require("memlab-analyzer/lib/memlab.util");

// Example Playwright test
import { test } from "@playwright/test";

test("Memory leak snapshot example", async ({ page, browser }) => {
  const workDir = "./memlab-snapshots";
  await page.goto("https://your-app-url.com");
  await takeJSHeapSnapshot(page, SnapshotTag.BASELINE, workDir);

  // Simulate user action
  await page.click("#some-button");
  await takeJSHeapSnapshot(page, SnapshotTag.TARGET, workDir);

  // Revert action
  await page.goBack();
  await takeJSHeapSnapshot(page, SnapshotTag.FINAL, workDir);

  // Create metadata for MemLab
  await createSnapSeqMetadata(
    {
      urls: [
        "https://your-app-url.com",
        "https://your-app-url.com/after-action",
        "https://your-app-url.com",
      ],
      titles: ["Base", "After Action", "Base Again"],
      baseUrl: "https://your-app-url.com",
      actionName: "click-some-button",
    },
    workDir
  );

  await createRunMetadata(
    {
      browserName: browser._initializer.name || "chromium",
      browserVersion: await page.evaluate(() => navigator.userAgent),
      testName: "memory-leak-test",
    },
    workDir
  );
});
```

#### 2. Analyze the Snapshots

```js
const { analyzeMemoryLeaks } = require("memlab-analyzer/lib/analyze-leaks");

(async () => {
  const leaks = await analyzeMemoryLeaks("./memlab-snapshots2", "console");
  if (leaks.length) {
    console.log("Leaks found:", leaks);
  } else {
    console.log("No leaks detected.");
  }
})();
```

## API

### `memlab.util.js`

- `takeJSHeapSnapshot(page, tag, outputDir)`
- `createSnapSeqMetadata(metadata, outputDir)`
- `createRunMetadata(config, outputDir)`
- `SnapshotTag` (enum)

### `analyze-leaks.js`

- `analyzeMemoryLeaks(workDir, outputFormat, outputFile)`
- `formatBytes(bytes, decimals)`
- `generateTextReport(leaks, workDir)`

## Example

```
analyze-leaks ./memlab-snapshots text my-report
```

## License

MIT
