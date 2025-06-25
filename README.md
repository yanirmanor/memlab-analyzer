# memlab-analyzer

CLI and utilities for analyzing memory leaks with MemLab and Playwright.

## Installation

To install the CLI globally:

```bash
npm install -g memlab-analyzer
```

To install as a dependency in your project:

```bash
npm install memlab-analyzer
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

You can use `memlab-analyzer` to both take snapshots in your Playwright tests and to analyze them.

#### 1. Taking Snapshots in Playwright

Import the necessary utilities:

```js
const {
  takeJSHeapSnapshot,
  SnapshotTag,
  createSnapSeqMetadata,
  createRunMetadata,
  analyzeMemoryLeaks, // also available for direct analysis
  formatBytes, // utility
  generateTextReport, // utility
} = require("memlab-analyzer");

// Example Playwright test (ensure you have Playwright installed: `npm install --save-dev @playwright/test`)
// import { test } from "@playwright/test"; // If using ES Modules in your test files

test("Memory leak snapshot example", async ({ page, browser }) => {
  const workDir = "./memlab-snapshots"; // Ensure this directory exists or is created

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
      // Optionally, provide heap sizes if you have them from other means, otherwise, they might be estimated or default
      // heapSizes: [baselineHeapSize, targetHeapSize, finalHeapSize]
    },
    workDir
  );

  await createRunMetadata(
    {
      browserName: browser.browserType().name(), // More reliable way to get browser name
      browserVersion: browser.version(), // More reliable way to get browser version
      testName: "memory-leak-test",
      // userAgent: await page.evaluate(() => navigator.userAgent) // if needed
    },
    workDir
  );
});
```

#### 2. Analyzing the Snapshots

```js
// Continuing the example or in a separate script:
// const { analyzeMemoryLeaks } = require("memlab-analyzer"); // Already imported above if in same scope

(async () => {
  const workDir = "./memlab-snapshots"; // Directory where snapshots were saved
  const leaks = await analyzeMemoryLeaks(workDir, "console"); // Or "json", "text"
  if (leaks.length > 0) {
    console.log("Leaks found:", leaks);
  } else {
    console.log("No leaks detected.");
  }
})();
```

## API

When you `require("memlab-analyzer")`, you get an object with the following functions:

**Snapshotting Utilities (from `memlab.util.js`):**

- `takeJSHeapSnapshot(page, tag, outputDir)`: Takes a heap snapshot using Playwright's CDP session.
  - `page`: Playwright Page object.
  - `tag`: String, one of `SnapshotTag.BASELINE`, `SnapshotTag.TARGET`, `SnapshotTag.FINAL`.
  - `outputDir`: Directory to save snapshot files (e.g., `./memlab-snapshots`).
- `SnapshotTag`: An object (enum) with string values: `{ BASELINE: "baseline", TARGET: "target", FINAL: "final" }`.
- `createSnapSeqMetadata(metadata, outputDir)`: Creates the `snap-seq.json` file required by MemLab.
- `createRunMetadata(config, outputDir)`: Creates the `run-meta.json` file.

**Analysis Functions (from `analyze-leaks.js`):**

- `analyzeMemoryLeaks(workDir, outputFormat, outputFile)`: Analyzes memory snapshots.
  - `workDir` (string, optional): Directory with Memlab snapshots. Default: `./memlab-snapshots`.
  - `outputFormat` (string, optional): `console`, `json`, or `text`. Default: `console`.
  - `outputFile` (string, optional): Base name for report files (if `json` or `text`). Default: `memlab-report`.
  - Returns: Promise resolving to an array of detected leaks.
- `formatBytes(bytes, decimals)`: Utility to format byte counts into human-readable strings (KB, MB, etc.).
- `generateTextReport(leaks, workDir)`: Generates a string report from leak data.

## Example

```
analyze-leaks ./memlab-snapshots text my-report
```

## License

MIT

## Contributing

This project uses [Changesets](https://github.com/changesets/changesets) to manage releases. If you are contributing code that you believe should trigger a new version of the package (e.g., bug fixes, new features, breaking changes), please include a changeset with your pull request.

To add a changeset:

1. After making your code changes, run the following command:
   ```bash
   npm run changeset
   ```
2. Follow the prompts from the Changesets CLI to select the type of change (patch, minor, or major) for each modified package (in this case, just `memlab-analyzer`) and write a brief description of your changes. This description will be used in the changelog.
3. Commit the generated changeset file (located in the `.changeset` directory) along with your code changes.

This helps automate the versioning and changelog generation process.
