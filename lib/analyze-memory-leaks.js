const { BrowserInteractionResultReader, findLeaks } = require("@memlab/api");

async function analyzeMemoryLeaks(workDir = "./memlab-snapshots") {
  try {
    console.log(`Analyzing memory snapshots from ${workDir}...`);

    // Load the memory snapshots from the working directory
    const reader = BrowserInteractionResultReader.from(workDir);

    // Find memory leaks
    const leaks = await findLeaks(reader);

    console.log("Memory leak analysis completed.");
    // console.log("Memory leaks:", JSON.stringify(leaks, null, 2));

    return leaks;
  } catch (error) {
    console.error("Error analyzing memory leaks:", error);
    throw error;
  }
}

// Execute the function if this script is run directly
if (require.main === module) {
  // Allow passing a custom work directory as a command line argument
  const workDir = process.argv[2] || "./memlab-snapshots";
  analyzeMemoryLeaks(workDir)
    .then(() => {
      console.log("Analysis complete");
    })
    .catch((err) => {
      console.error("Analysis failed:", err);
      process.exit(1);
    });
}

// Export the function so it can be used from other scripts
module.exports = { analyzeMemoryLeaks };

// const { findLeaks, BrowserInteractionResultReader } = require("@memlab/api");

// (async function () {
//   const reader = BrowserInteractionResultReader.from("./memlab-snapshots2");
//   const leaks = await findLeaks(reader);
// })();
