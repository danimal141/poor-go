import { parseArgs } from "std/cli/parse_args.ts";
import { Lexer } from "@/lexer/lexer.ts";
import { Parser } from "@/parser/parser.ts";
import { SemanticAnalyzer } from "@/semantic/analyzer.ts";
import { LLVMGenerator } from "@/codegen/generator.ts";
import { CompilerPipeline } from "@/compiler/pipeline.ts";

// Define available commands as a union type
type Command = "build" | "help" | "version";

// Command handlers
type CommandHandler = (args: string[]) => Promise<void>;

const commands: Record<Command, CommandHandler> = {
  build: handleBuild,
  help: handleHelp,
  version: handleVersion,
};

// Compiler version
const VERSION = "0.1.0";

/**
 * Displays help message for the specified command or general help
 */
function showHelp(command?: string): void {
  if (command === "build") {
    console.log("Usage: pgo build [options] <source-file>");
    console.log("\nOptions:");
    console.log("  -o, --output <file>    Output file name (default: a.out)");
    console.log("  --emit-llvm            Output LLVM IR");
    console.log("  --verbose              Show compilation process");
    console.log("  -O<level>              Optimization level (0-3)");
    return;
  }

  console.log("PoorGo Compiler v" + VERSION);
  console.log("\nUsage: pgo <command> [options]");
  console.log("\nCommands:");
  console.log("  build         Compile a source file");
  console.log("  help          Show this help message");
  console.log("  version       Show version information");
  console.log("\nRun 'pgo help <command>' for more information on a command.");
}

/**
 * Handles the build command
 */
async function handleBuild(args: string[]): Promise<void> {
  // Parse build command arguments
  const flags = parseArgs(args, {
    string: ["output", "o", "O"],
    boolean: ["help", "emit-llvm", "verbose"],
    default: {
      output: "a.out",
      "emit-llvm": false,
      verbose: false,
      O: "0",
    },
    alias: {
      o: "output",
      h: "help",
    },
  });

  if (flags.help || flags._.length === 0) {
    showHelp("build");
    return;
  }

  try {
    // Read input file
    const sourceFile = flags._[0]?.toString();
    if (!sourceFile) {
      throw new Error("No input file specified");
    }

    let source: string;
    try {
      source = await Deno.readTextFile(sourceFile);
    } catch (error) {
      throw new Error(`Failed to read source file: ${sourceFile}`);
    }

    if (flags.verbose) {
      console.log(`Compiling ${sourceFile}...`);
    }

    // Run compilation pipeline
    const lexer = new Lexer(source);
    const parser = new Parser(lexer);
    const ast = parser.parseProgram();

    const analyzer = new SemanticAnalyzer();
    analyzer.analyze(ast);

    const generator = new LLVMGenerator();
    const llvmIR = generator.generate(ast);

    // Compile to executable
    const compiler = new CompilerPipeline();
    const outFile = flags.output || "a.out";

    const result = await compiler.compile(llvmIR, {
      outputPath: outFile,
      emitLLVM: Boolean(flags["emit-llvm"]),
      verbose: Boolean(flags.verbose),
      optimizationLevel: parseInt(flags.O),
    });

    if (!result.success) {
      throw new Error("Compilation failed: " + result.error);
    }

    if (flags.verbose) {
      console.log(`Successfully compiled to ${outFile}`);
    }

  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

/**
 * Handles the help command
 */
async function handleHelp(args: string[]): Promise<void> {
  const command = args[0];
  showHelp(command);
}

/**
 * Handles the version command
 */
async function handleVersion(_args: string[]): Promise<void> {
  console.log(`pgo version ${VERSION}`);
}

/**
 * Main entry point
 */
if (import.meta.main) {
  try {
    const args = Deno.args;
    if (args.length === 0) {
      showHelp();
      Deno.exit(1);
    }

    const command = args[0] as string;
    const handler = commands[command as Command];

    if (!handler) {
      console.error(`Unknown command: ${command}`);
      console.log("Available commands:", Object.keys(commands).join(", "));
      showHelp();
      Deno.exit(1);
    }

    await handler(args.slice(1));
  } catch (error) {
    console.error("Fatal error:", error);
    Deno.exit(1);
  }
}
