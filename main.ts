import { parse } from "std/flags/mod.ts";
import { Lexer } from "@/lexer/lexer.ts";
import { Parser } from "@/parser/parser.ts";
import { SemanticAnalyzer } from "@/semantic/analyzer.ts";
import { LLVMGenerator } from "@/codegen/generator.ts";

async function main() {
  // Parse command line arguments
  const flags = parse(Deno.args, {
    string: ["o", "output"],
    boolean: ["help", "emit-llvm"],
    default: { o: "a.out", "emit-llvm": false },
  });

  if (flags.help || flags._.length === 0) {
    console.log("Usage: poor-go [options] <source-file>");
    console.log("Options:");
    console.log("  -o, --output <file>  Output file name");
    console.log("  --emit-llvm          Output LLVM IR");
    console.log("  --help               Show this help");
    Deno.exit(0);
  }

  try {
    // Read input file
    const sourceFile = flags._[0].toString();
    const source = await Deno.readTextFile(sourceFile);

    // Compile
    const lexer = new Lexer(source);
    const parser = new Parser(lexer);
    const ast = parser.parseProgram();

    // Semantic analysis
    const analyzer = new SemanticAnalyzer();
    analyzer.analyze(ast);

    // Generate LLVM IR
    const generator = new LLVMGenerator();
    const llvmIR = generator.generate(ast);

    // Output handling
    const outFile = flags.o || flags.output;
    if (flags["emit-llvm"]) {
      // Output LLVM IR to file
      await Deno.writeTextFile(outFile + ".ll", llvmIR);
      console.log(`LLVM IR written to ${outFile}.ll`);
    } else {
      // In future: call LLVM tools to generate executable
      console.error("Binary output not yet implemented");
      Deno.exit(1);
    }
  } catch (error) {
    console.error("Compilation failed:", error.message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
