#!/usr/bin/env node

import { KSUID } from "./ksuid";
import { isKSUIDError } from "./errors";

interface CLIArgs {
  count: number;
  format: string;
  template: string;
  verbose: boolean;
  args: string[];
}

function parseArgs(args: string[]): CLIArgs {
  const parsed: CLIArgs = {
    count: 1,
    format: "string",
    template: "",
    verbose: false,
    args: [],
  };

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-n" && i + 1 < args.length) {
      parsed.count = parseInt(args[++i], 10);
      if (isNaN(parsed.count) || parsed.count <= 0) {
        parsed.count = 1;
      }
    } else if (arg === "-f" && i + 1 < args.length) {
      parsed.format = args[++i];
    } else if (arg === "-t" && i + 1 < args.length) {
      parsed.template = args[++i];
    } else if (arg === "-v") {
      parsed.verbose = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith("-")) {
      parsed.args.push(arg);
    }
  }

  return parsed;
}

function printHelp(): void {
  console.log(`Usage: ksuid [options] [KSUIDs...]

Generate and inspect KSUIDs.

Options:
  -n NUM     Generate NUM KSUIDs (default: 1)
  -f FORMAT  Output format: string, inspect, time, timestamp, payload, raw, template (default: string)
  -t TEXT    Template for custom formatting (use with -f template)
  -v         Verbose mode (show KSUID before formatted output)
  -h, --help Show this help message

Formats:
  string     Base62 string representation (default)
  inspect    Detailed breakdown of KSUID components
  time       Human readable timestamp
  timestamp  Unix timestamp (seconds since epoch)  
  payload    Raw payload bytes
  raw        Raw KSUID bytes

Examples:
  ksuid                           Generate one KSUID
  ksuid -n 5                      Generate five KSUIDs
  ksuid -f inspect 0o5Fs0EELR0fUjHjbCnEtdUwx3e    Inspect a specific KSUID
  ksuid -f time 0o5Fs0EELR0fUjHjbCnEtdUwx3e        Show timestamp as readable date
  ksuid -v -f payload 0o5Fs0EELR0fUjHjbCnEtdUwx3e  Show payload with verbose output`);
}

function printString(ksuid: KSUID): void {
  console.log(ksuid.toString());
}

function printInspect(ksuid: KSUID): void {
  const inspectFormat = `
REPRESENTATION:

  String: ${ksuid.toString()}
     Raw: ${ksuid.toBuffer().toString("hex").toUpperCase()}

COMPONENTS:

       Time: ${new Date((ksuid.timestamp + 1400000000) * 1000).toISOString()}
  Timestamp: ${ksuid.timestamp}
    Payload: ${ksuid.payload.toString("hex").toUpperCase()}

`;
  console.log(inspectFormat);
}

function printTime(ksuid: KSUID): void {
  const timestamp = (ksuid.timestamp + 1400000000) * 1000;
  console.log(new Date(timestamp).toISOString());
}

function printTimestamp(ksuid: KSUID): void {
  console.log(String(ksuid.timestamp));
}

function printPayload(ksuid: KSUID): void {
  process.stdout.write(ksuid.payload);
}

function printRaw(ksuid: KSUID): void {
  process.stdout.write(ksuid.toBuffer());
}

function printTemplate(ksuid: KSUID, template: string): void {
  if (!template) {
    console.error("Template format requires -t option");
    process.exit(1);
  }

  const timestamp = (ksuid.timestamp + 1400000000) * 1000;
  const data = {
    String: ksuid.toString(),
    Raw: ksuid.toBuffer().toString("hex").toUpperCase(),
    Time: new Date(timestamp).toISOString(),
    Timestamp: ksuid.timestamp,
    Payload: ksuid.payload.toString("hex").toUpperCase(),
  };

  let result = template;
  for (const [key, value] of Object.entries(data)) {
    // Support both Go template syntax ({{ .Field }}) and simple syntax ({{ Field }})
    result = result.replace(
      new RegExp("{{\\s*\\.?" + key + "\\s*}}", "g"),
      value.toString()
    );
  }

  console.log(result);
}

function main(): void {
  const args = parseArgs(process.argv);

  let printFunction: (ksuid: KSUID) => void;

  switch (args.format) {
    case "string":
      printFunction = printString;
      break;
    case "inspect":
      printFunction = printInspect;
      break;
    case "time":
      printFunction = printTime;
      break;
    case "timestamp":
      printFunction = printTimestamp;
      break;
    case "payload":
      printFunction = printPayload;
      break;
    case "raw":
      printFunction = printRaw;
      break;
    case "template":
      printFunction = (ksuid: KSUID) => printTemplate(ksuid, args.template);
      break;
    default:
      console.error(`Bad formatting function: ${args.format}`);
      process.exit(1);
  }

  // If no KSUIDs provided, generate new ones
  const ksuids: string[] = args.args;
  if (ksuids.length === 0) {
    for (let i = 0; i < args.count; i++) {
      ksuids.push(KSUID.random().toString());
    }
  }

  // Parse and process each KSUID
  for (const ksuidString of ksuids) {
    try {
      const ksuid = KSUID.parse(ksuidString);

      if (args.verbose) {
        process.stdout.write(`${ksuid.toString()}: `);
      }

      printFunction(ksuid);
    } catch (error) {
      if (isKSUIDError(error)) {
        console.error(`Error: ${error.message}`);
        if (error.input && error.expected && error.actual) {
          console.error(`  Expected: ${error.expected}`);
          console.error(`  Received: ${error.actual}`);
        }
        console.error(`  Error Code: ${error.code}`);
      } else if (error instanceof Error) {
        console.error(`Error when parsing "${ksuidString}": ${error.message}`);
      } else {
        console.error(
          `Unexpected error when parsing "${ksuidString}": ${String(error)}`
        );
      }
      console.error("");
      printHelp();
      process.exit(1);
    }
  }
}

// Only run main if this file is executed directly
if (require.main === module) {
  main();
}
