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

To use `memlab-analyzer` as a library in your project:

```js
const { analyzeMemoryLeaks, formatBytes, generateTextReport } = require("memlab-analyzer");

// Example:
(async () => {
  const leaks = await analyzeMemoryLeaks("./memlab-snapshots", "console");
  if (leaks.length) {
    console.log("Leaks found:", leaks);
  } else {
    console.log("No leaks detected.");
  }
})();
```

## API

When you `require("memlab-analyzer")`, you get an object with the following functions:

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
