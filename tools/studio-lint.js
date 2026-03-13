#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { lintArtifact, readJson } = require('./studio-schema-lib');

function parseArgs(argv) {
  const parsed = { _: [], json: false };
  for (const token of argv) {
    if (token === '--json') {
      parsed.json = true;
      continue;
    }
    parsed._.push(token);
  }
  return parsed;
}

function printUsage() {
  console.log('Usage:');
  console.log('  node tools/studio-lint.js <file-or-directory> [more paths] [--json]');
}

function collectJsonFiles(inputPath) {
  const absolutePath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Path does not exist: ${inputPath}`);
  }

  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    if (!absolutePath.endsWith('.json')) {
      throw new Error(`Expected a JSON file: ${inputPath}`);
    }
    return [absolutePath];
  }

  const files = [];
  for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
    const nextPath = path.join(absolutePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(nextPath));
      continue;
    }
    if (entry.isFile() && nextPath.endsWith('.json')) {
      files.push(nextPath);
    }
  }
  return files.sort();
}

function resolveInputFiles(inputs) {
  const files = new Set();
  for (const inputPath of inputs) {
    for (const filePath of collectJsonFiles(inputPath)) {
      files.add(filePath);
    }
  }
  return [...files].sort();
}

function buildReport(filePaths) {
  const report = {
    checked_files: filePaths.length,
    schema_error_count: 0,
    boundary_lint_count: 0,
    files: []
  };

  for (const filePath of filePaths) {
    let artifact;
    let parseError = null;
    try {
      artifact = readJson(filePath);
    } catch (error) {
      parseError = String(error.message || error);
    }

    let schemaErrors = [];
    let boundaryLints = [];
    let artifactType = null;
    let schemaPath = null;

    if (parseError) {
      schemaErrors = [parseError];
    } else {
      const lintResult = lintArtifact(artifact);
      artifactType = lintResult.artifactType;
      schemaPath = lintResult.schemaPath;
      schemaErrors = lintResult.schemaErrors;
      boundaryLints = lintResult.boundaryLints;
    }

    report.schema_error_count += schemaErrors.length;
    report.boundary_lint_count += boundaryLints.length;
    report.files.push({
      file: filePath,
      artifact_type: artifactType,
      schema_file: schemaPath,
      schema_errors: schemaErrors,
      boundary_lints: boundaryLints
    });
  }

  return report;
}

function printHuman(report) {
  console.log('AICOS Studio Lint');
  console.log('');
  console.log(`- checked files: ${report.checked_files}`);
  console.log(`- schema errors: ${report.schema_error_count}`);
  console.log(`- boundary lints: ${report.boundary_lint_count}`);

  for (const fileReport of report.files) {
    if (fileReport.schema_errors.length === 0 && fileReport.boundary_lints.length === 0) {
      continue;
    }

    console.log('');
    console.log(`File: ${fileReport.file}`);
    if (fileReport.schema_errors.length > 0) {
      console.log('Schema errors');
      for (const error of fileReport.schema_errors) {
        console.log(`- ${error}`);
      }
    }
    if (fileReport.boundary_lints.length > 0) {
      console.log('Boundary lints');
      for (const lint of fileReport.boundary_lints) {
        console.log(`- ${lint.code} at ${lint.path}: ${lint.message}`);
      }
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args._.length === 0) {
    printUsage();
    process.exit(1);
  }

  const filePaths = resolveInputFiles(args._);
  const report = buildReport(filePaths);

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report);
  }

  if (report.schema_error_count > 0 || report.boundary_lint_count > 0) {
    process.exit(1);
  }
}

main();
