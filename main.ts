import { parseArgs } from "std/cli/parse_args.ts";
import { Lexer } from "@/lexer/lexer.ts";
import { Parser } from "@/parser/parser.ts";
import { SemanticAnalyzer } from "@/semantic/analyzer.ts";
import { LLVMGenerator } from "@/codegen/generator.ts";
import { CompilerPipeline } from "@/compiler/pipeline.ts";

async function main() {
  // Parse command line arguments using parseArgs
  const flags = parseArgs(Deno.args, {
    string: ["output", "o"],
    boolean: ["help", "emit-llvm", "verbose"],
    default: {
      output: "a.out",
      "emit-llvm": false,
      verbose: false,
    },
    alias: {
      o: "output"
    },
  });

  if (flags["help"] || flags._.length === 0) {
    console.log("Usage: poor-go [options] <source-file>");
    console.log("Options:");
    console.log("  -o, --output <file>  Output file name");
    console.log("  --emit-llvm          Output LLVM IR");
    console.log("  --verbose            Show compilation process");
    console.log("  --help               Show this help");
    Deno.exit(0);
  }

  try {
    // Read input file
    const sourceFile = flags._[0]?.toString();
    if (!sourceFile) {
      throw new Error("No input file specified");
    }

    const source = await Deno.readTextFile(sourceFile);

    if (flags["verbose"]) {
      console.log(`Compiling ${sourceFile}...`);
    }

    // Lexical analysis
    const lexer = new Lexer(source);

    // Syntax analysis
    const parser = new Parser(lexer);
    const ast = parser.parseProgram();

    // Semantic analysis
    const analyzer = new SemanticAnalyzer();
    analyzer.analyze(ast);

    // Generate LLVM IR
    const generator = new LLVMGenerator();
    const llvmIR = generator.generate(ast);

    // Compile to executable
    const compiler = new CompilerPipeline();
    // デフォルト値が設定されているので必ず string 型
    const outFile = flags["output"] || "a.out";

    const result = await compiler.compile(llvmIR, {
      outputPath: outFile,
      emitLLVM: Boolean(flags["emit-llvm"]),
      verbose: Boolean(flags["verbose"]),
    });

    if (!result.success) {
      console.error("Compilation failed:", result.error);
      Deno.exit(1);
    }

    if (flags["verbose"]) {
      console.log(`Successfully compiled to ${outFile}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Compilation failed:", errorMessage);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
