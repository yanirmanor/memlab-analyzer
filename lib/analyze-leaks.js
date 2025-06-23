// Import necessary modules
const { BrowserInteractionResultReader, findLeaks } = require("@memlab/api");
const path = require("path"); // For handling file paths
const fs = require("fs/promises"); // For asynchronous file system operations (writing reports)
const { format } = require("util"); // Optional: Can be used for string formatting if needed

/**
 * Helper function to format memory sizes (bytes) into a human-readable string (KB, MB, GB).
 * @param {number} bytes - The number of bytes.
 * @param {number} [decimals=2] - The number of decimal places to display.
 * @returns {string} - The formatted size string.
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0 || typeof bytes !== "number" || isNaN(bytes))
    return "0 Bytes"; // Handle zero or invalid input
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  // Calculate the appropriate size unit index
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // Format the number with the specified decimals and append the unit
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Generates a formatted text report string from the detected leaks.
 * @param {Array<object>} leaks - An array of leak objects found by Memlab.
 * @param {string} workDir - The absolute path to the snapshot directory.
 * @returns {string} - The formatted text report.
 */
function generateTextReport(leaks, workDir) {
  let report = `--- Memlab Leak Analysis Report ---\n`;
  report += `Timestamp: ${new Date().toISOString()}\n`;
  report += `Snapshot Directory: ${workDir}\n`;
  report += `Leaks Found: ${leaks.length}\n`;
  report += `-----------------------------------\n\n`;

  if (leaks.length === 0) {
    report += `✅ No memory leaks detected.\n`;
  } else {
    report += `🚨 Memory Leaks Detected:\n`;
    leaks.forEach((leak, index) => {
      report += `\nLeak #${index + 1}:\n`;
      report += `  Retained Size: ${formatBytes(leak.retainedSize)}\n`;
      report += `  Leaked Nodes: ${leak.nodes?.length ?? "N/A"}\n`;
      report += `  Trace:\n`;
      if (leak.trace && Array.isArray(leak.trace.path)) {
        leak.trace.path.forEach((node, i) => {
          const indent = "    ".repeat(i + 1);
          let nodeStr = node.name || node.type || `Node ${node.id}`;
          if (node.edge) {
            nodeStr = `-[${node.edge}]-> ${nodeStr}`;
          }
          report += `${indent}${nodeStr} (id: ${
            node.id
          }, retainedSize: ${formatBytes(node.retainedSize || 0)})\n`;
        });
      } else if (leak.trace && typeof leak.trace.toString === "function") {
        report += `    ${leak.trace.toString().split("\n").join("\n    ")}\n`;
      } else {
        report += "    Trace details unavailable or in an unexpected format.\n";
      }
      report += `-----------------------------------\n`;
    });
  }
  return report;
}

/**
 * Analyzes memory snapshots using Memlab and generates a report.
 * @param {string} [workDir="./memlab-snapshots"] - The directory containing Memlab snapshots.
 * @param {string} [outputFormat="console"] - The desired report format ("console", "json", "text").
 * @param {string} [outputFile="memlab-report"] - The base name for the output file (without extension).
 * @returns {Promise<Array<object>>} - A promise that resolves with the array of detected leaks.
 */
async function analyzeMemoryLeaks(
  workDir = "./memlab-snapshots",
  outputFormat = "console",
  outputFile = "memlab-report"
) {
  const absoluteWorkDir = path.resolve(workDir);
  let leaks = [];

  try {
    console.log(`Analyzing memory snapshots from ${absoluteWorkDir}...`);
    const reader = BrowserInteractionResultReader.from(absoluteWorkDir);
    leaks = await findLeaks(reader);
    console.log("Memory leak analysis completed.");
    if (outputFormat === "json") {
      const reportData = {
        reportTimestamp: new Date().toISOString(),
        snapshotDirectory: absoluteWorkDir,
        leaksFound: leaks.length,
        leaks: leaks,
      };
      const reportJson = JSON.stringify(reportData, null, 2);
      const filePath = path.resolve(`${outputFile}.json`);
      await fs.writeFile(filePath, reportJson);
      console.log(`💾 JSON report saved to: ${filePath}`);
    } else if (outputFormat === "text") {
      const reportText = generateTextReport(leaks, absoluteWorkDir);
      const filePath = path.resolve(`${outputFile}.txt`);
      await fs.writeFile(filePath, reportText);
      console.log(`💾 Text report saved to: ${filePath}`);
    } else {
      const reportText = generateTextReport(leaks, absoluteWorkDir);
      console.log("\n" + reportText);
    }
    return leaks;
  } catch (error) {
    console.error("❌ Error during memory leak analysis:", error);
    if (outputFormat === "json" || outputFormat === "text") {
      try {
        const errorFilePath = path.resolve(`${outputFile}-error.log`);
        let errorContent = `Analysis Error at ${new Date().toISOString()}\n`;
        errorContent += `Directory: ${absoluteWorkDir}\n`;
        errorContent += `Format: ${outputFormat}\n`;
        errorContent += `Output File Base: ${outputFile}\n\n`;
        errorContent += `Error Stack:\n${error.stack || error}`;
        await fs.writeFile(errorFilePath, errorContent);
        console.error(`📄 Analysis error details saved to: ${errorFilePath}`);
      } catch (writeError) {
        console.error(
          "Additionally, failed to write error log file:",
          writeError
        );
      }
    }
    throw error;
  }
}

module.exports = { analyzeMemoryLeaks, formatBytes, generateTextReport };
