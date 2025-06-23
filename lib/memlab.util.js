/**
 * MemLab Integration for Playwright
 *
 * This module provides functions to take heap snapshots and create the required
 * directory structure for MemLab analysis.
 */
const fs = require("fs").promises;
const path = require("path");

/**
 * Tags for the different snapshot phases
 */
const SnapshotTag = {
  BASELINE: "baseline", // s1.heapsnapshot - initial page load (SBP)
  TARGET: "target", // s2.heapsnapshot - after target interaction (STP)
  FINAL: "final", // s3.heapsnapshot - after reverting target interaction (SBP')
};

/**
 * Take a JavaScript heap snapshot from the browser and save it to disk
 *
 * @param {Page} page - Playwright page object
 * @param {string} tag - One of: 'baseline', 'target', 'final'
 * @param {string} outputDir - Directory where snapshots will be saved
 * @returns {Promise<string>} Path to the saved snapshot file
 */
async function takeJSHeapSnapshot(page, tag, outputDir = "./memlab-output") {
  // Validate tag
  if (!Object.values(SnapshotTag).includes(tag)) {
    throw new Error(
      `Invalid tag: ${tag}. Must be one of: ${Object.values(SnapshotTag).join(
        ", "
      )}`
    );
  }

  // Create the required directory structure
  const dataDir = path.join(outputDir, "data", "cur");
  await fs.mkdir(dataDir, { recursive: true });

  // Map tags to snapshot file names
  const snapshotFileMap = {
    [SnapshotTag.BASELINE]: "s1.heapsnapshot",
    [SnapshotTag.TARGET]: "s2.heapsnapshot",
    [SnapshotTag.FINAL]: "s3.heapsnapshot",
  };

  const snapshotFileName = snapshotFileMap[tag];
  const snapshotPath = path.join(dataDir, snapshotFileName);

  // Connect to CDP (Chrome DevTools Protocol)
  const cdpClient = await page.context().newCDPSession(page);

  // Trigger garbage collection before taking snapshot (optional but recommended)
  await cdpClient.send("HeapProfiler.collectGarbage");

  // Take the heap snapshot
  console.log(`Taking ${tag} heap snapshot...`);

  // The snapshot is returned in chunks
  const chunks = [];
  cdpClient.on("HeapProfiler.addHeapSnapshotChunk", (event) => {
    chunks.push(event.chunk);
  });

  await cdpClient.send("HeapProfiler.takeHeapSnapshot", {
    reportProgress: false,
  });

  // Write chunks to file individually to avoid string length limitations
  const fileHandle = await fs.open(snapshotPath, "w");
  for (const chunk of chunks) {
    await fileHandle.writeFile(chunk);
  }
  await fileHandle.close();

  console.log(`Heap snapshot saved to: ${snapshotPath}`);
  return snapshotPath;
}

async function createSnapSeqMetadata(metadata, outputDir = "./memlab-output") {
  const fs = require("fs").promises;
  const path = require("path");
  const dataDir = path.join(outputDir, "data", "cur");
  const metadataPath = path.join(dataDir, "snap-seq.json");

  const types = ["baseline", "target", "final"];
  const names = ["page-load", "action-on-page", "revert"];
  const heapSizes = metadata.heapSizes || [null, null, null];

  const tabsOrder = (metadata.heapSizes || [null, null, null]).map(
    (size, i) => ({
      name: names[i] || `step-${i + 1}`,
      snapshot: true,
      type: types[i] || "unknown",
      idx: i + 1,
      JSHeapUsedSize: size,
    })
  );

  await fs.writeFile(metadataPath, JSON.stringify(tabsOrder, null, 2));
}

/**
 * Create the run-meta.json file with browser configuration
 *
 * @param {Object} config - Browser and test configuration
 * @param {string} outputDir - Directory where the file will be saved
 * @returns {Promise<void>}
 */
async function createRunMetadata(config, outputDir = "./memlab-output") {
  const dataDir = path.join(outputDir, "data", "cur");
  const metadataPath = path.join(dataDir, "run-meta.json");

  const runMetaData = {
    browser: {
      name: config.browserName || "chromium",
      version: config.browserVersion || "",
      userAgent: config.userAgent || "",
    },
    timestamp: Date.now(),
    testName: config.testName || "memory-leak-test",
    // Add any other metadata you need
  };

  await fs.writeFile(metadataPath, JSON.stringify(runMetaData, null, 2));
}

/**
 * Complete example of a memory leak test with MemLab integration
 */
async function runMemoryLeakTest(page, testConfig) {
  const { baseUrl, targetSelector, outputDir } = testConfig;

  // Create output directory structure
  await fs.mkdir(path.join(outputDir, "data", "cur"), { recursive: true });

  // Step 1: Navigate to the base URL
  await page.goto(baseUrl);
  await page.waitForLoadState("networkidle");

  // Take baseline snapshot (s1.heapsnapshot - SBP)
  await takeJSHeapSnapshot(page, SnapshotTag.BASELINE, outputDir);

  // Step 2: Perform the target action
  await page.click(targetSelector);
  await page.waitForLoadState("networkidle");

  // Take target snapshot (s2.heapsnapshot - STP)
  await takeJSHeapSnapshot(page, SnapshotTag.TARGET, outputDir);

  // Step 3: Revert the action (e.g., navigate back or close dialog)
  await page.goBack();
  // Or some other way to revert the action
  await page.waitForLoadState("networkidle");

  // Take final snapshot (s3.heapsnapshot - SBP')
  await takeJSHeapSnapshot(page, SnapshotTag.FINAL, outputDir);

  // Create metadata files
  await createSnapSeqMetadata(
    {
      urls: [baseUrl, `${baseUrl}#after-action`, baseUrl],
      titles: ["Base Page", "Target Page", "Base Page After Revert"],
      baseUrl,
      actionName: "click-target-element",
    },
    outputDir
  );

  await createRunMetadata(
    {
      browserName: "chromium",
      testName: "memory-leak-test",
    },
    outputDir
  );

  console.log(`MemLab test artifacts generated at: ${outputDir}/data/cur`);
}

module.exports = {
  takeJSHeapSnapshot,
  createSnapSeqMetadata,
  createRunMetadata,
  runMemoryLeakTest,
  SnapshotTag,
};
