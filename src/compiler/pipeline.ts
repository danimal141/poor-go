import { join } from "std/path/mod.ts";

interface CompileOptions {
  outputPath: string;
  emitLLVM: boolean;
  optimizationLevel?: number;
}

export class CompilerPipeline {
  private async checkLLVMTools(): Promise<boolean> {
    try {
      const llc = new Deno.Command("llc", { args: ["--version"] });
      const clang = new Deno.Command("clang", { args: ["--version"] });

      await llc.output();
      await clang.output();
      return true;
    } catch (error) {
      console.error("LLVM tools not found. Please install LLVM toolchain.");
      return false;
    }
  }

  private async compileLLVMIR(
    irPath: string,
    outputPath: string,
    optimizationLevel = 0,
  ): Promise<boolean> {
    try {
      // Generate assembly
      const llc = new Deno.Command("llc", {
        args: [
          `-O${optimizationLevel}`,
          "-filetype=asm",
          irPath,
          "-o",
          `${outputPath}.s`,
        ],
      });
      const llcResult = await llc.output();
      if (!llcResult.success) throw new Error("LLC compilation failed");

      // Generate executable
      const clang = new Deno.Command("clang", {
        args: [
          `${outputPath}.s`,
          "-o",
          outputPath,
        ],
      });
      const clangResult = await clang.output();
      if (!clangResult.success) throw new Error("Clang compilation failed");

      // Cleanup assembly file
      await Deno.remove(`${outputPath}.s`);
      return true;
    } catch (error) {
      console.error("Compilation error:", error.message);
      return false;
    }
  }

  async compile(llvmIR: string, options: CompileOptions): Promise<boolean> {
    if (!await this.checkLLVMTools()) {
      return false;
    }

    // Write LLVM IR to temporary file
    const irPath = `${options.outputPath}.ll`;
    await Deno.writeTextFile(irPath, llvmIR);

    if (options.emitLLVM) {
      console.log(`LLVM IR written to ${irPath}`);
      return true;
    }

    // Compile to executable
    const success = await this.compileLLVMIR(
      irPath,
      options.outputPath,
      options.optimizationLevel,
    );

    // Cleanup IR file if not requested to keep
    if (!options.emitLLVM) {
      await Deno.remove(irPath);
    }

    return success;
  }
}
