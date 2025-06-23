#!/usr/bin/env node
const { analyzeMemoryLeaks } = require("../lib/analyze-leaks");

const args = process.argv.slice(2);
const workDir = args[0] || "./memlab-snapshots";
const outputFormat = args[1] || "console";
const outputFile = args[2] || "memlab-report";

console.log(`Starting analysis with:`);
console.log(`  Directory: ${workDir}`);
console.log(`  Format:    ${outputFormat}`);
if (outputFormat === "json" || outputFormat === "text") {
  console.log(
    `  Output File: ${outputFile}.${outputFormat === "json" ? "json" : "txt"}`
  );
}

analyzeMemoryLeaks(workDir, outputFormat, outputFile)
  .then((leaks) => {
    console.log("\n✅ Analysis process finished.");
    if (leaks && leaks.length > 0) {
      console.warn(
        `⚠️ Found ${leaks.length} potential memory leak(s). Review details.`
      );
      const detailsFound = leaks.some(
        (leak) => leak.retainedSize > 0 || (leak.nodes && leak.nodes.length > 0)
      );
      if (!detailsFound && outputFormat !== "json") {
        console.warn(
          "   (Note: Leak details like size/trace seem missing. Check raw data or Memlab version/config)"
        );
      }
    } else {
      console.log("✨ No leaks detected.");
    }
  })
  .catch((err) => {
    console.error("🛑 Analysis script failed.");
    process.exit(1);
  });
