import { CompileResult } from "./types.ts";

interface CompileOptions {
  outputPath: string;
  emitLLVM: boolean;
  optimizationLevel?: number;
  verbose?: boolean;
}

export class CompilerPipeline {
  /**
   * Checks if required LLVM tools are available in the system
   */
  private async checkLLVMTools(): Promise<boolean> {
    try {
      const llcVersion = new Deno.Command("llc", {
        args: ["--version"],
        stderr: "null",
        stdout: "null",
      });

      const clangVersion = new Deno.Command("clang", {
        args: ["--version"],
        stderr: "null",
        stdout: "null",
      });

      const [llcResult, clangResult] = await Promise.all([
        llcVersion.output(),
        clangVersion.output(),
      ]);

      return llcResult.success && clangResult.success;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Generates assembly and executable from LLVM IR
   */
  private async compileLLVMIR(
    irPath: string,
    outputPath: string,
    options: CompileOptions,
  ): Promise<CompileResult> {
    try {
      // Generate assembly from LLVM IR
      const llc = new Deno.Command("llc", {
        args: [
          `-O${options.optimizationLevel ?? 0}`,
          "-filetype=asm",
          irPath,
          "-o",
          `${outputPath}.s`,
        ],
        stderr: "piped",
        stdout: "piped",
      });

      const llcResult = await llc.output();
      if (!llcResult.success) {
        return {
          success: false,
          error: new TextDecoder().decode(llcResult.stderr),
        };
      }

      // Generate executable from assembly
      const clang = new Deno.Command("clang", {
        args: [`${outputPath}.s`, "-o", outputPath],
        stderr: "piped",
        stdout: "piped",
      });

      const clangResult = await clang.output();
      if (!clangResult.success) {
        return {
          success: false,
          error: new TextDecoder().decode(clangResult.stderr),
        };
      }

      // Cleanup temporary assembly file
      await Deno.remove(`${outputPath}.s`);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Main compilation pipeline
   * Takes LLVM IR and generates executable or LLVM IR file
   */
  async compile(
    llvmIR: string,
    options: CompileOptions,
  ): Promise<CompileResult> {
    // Check for LLVM tools
    if (!await this.checkLLVMTools()) {
      return {
        success: false,
        error:
          "LLVM tools (llc, clang) not found. Please install LLVM toolchain.",
      };
    }

    try {
      // Write LLVM IR to temporary file
      const irPath = `${options.outputPath}.ll`;
      await Deno.writeTextFile(irPath, llvmIR);

      if (options.verbose) {
        console.log(`LLVM IR written to ${irPath}`);
      }

      // If only LLVM IR output is requested, we're done
      if (options.emitLLVM) {
        return { success: true };
      }

      // Compile to executable
      const result = await this.compileLLVMIR(
        irPath,
        options.outputPath,
        options,
      );

      // Cleanup IR file unless explicitly requested
      if (!options.emitLLVM) {
        await Deno.remove(irPath).catch(() => {});
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
