import { describe, it } from "std/testing/bdd.ts";
import { assertEquals } from "std/assert/mod.ts";
import { Parser } from "@/parser/parser.ts";
import { Lexer } from "@/lexer/lexer.ts";
import { LLVMGenerator } from "@/codegen/generator.ts";

describe("LLVMGenerator", () => {
  const generateIR = (input: string): string => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const ast = parser.parseProgram();
    const generator = new LLVMGenerator();
    return generator.generate(ast);
  };

  describe("print statement", () => {
    it("should generate correct IR for hello world", () => {
      const input = `package main

func main() {
  print("hello")
}`;
      const ir = generateIR(input);

      // Verify required components are present
      const requiredParts = [
        "declare i32 @printf",
        "@.str.fmt = private unnamed_addr constant [3 x i8]",
        "define i32 @main()",
        "entry:",
        "call i32 (i8*, ...) @printf",
        "ret i32 0",
      ];

      for (const part of requiredParts) {
        assertEquals(
          ir.includes(part),
          true,
          `Generated IR should contain "${part}"\nGenerated IR:\n${ir}`,
        );
      }
    });

    it("should handle string with special characters", () => {
      const input = `package main

func main() {
  print("hello\\nworld")
}`;
      const ir = generateIR(input);
      assertEquals(
        ir.includes("\\0A"),
        true,
        `IR should contain "\\0A" for newline.\nGenerated IR:\n${ir}`,
      );
    });
  });

  describe("arithmetic expressions", () => {
    it("should generate correct IR for integer expressions", () => {
      const input = `package main
      func main() {
        print(42)
      }`;
      const ir = generateIR(input);

      const requiredParts = [
        '@.str.int.fmt = private unnamed_addr constant [4 x i8] c"%d\\0A\\00"',
        "call i32 (i8*, ...) @printf",
      ];

      for (const part of requiredParts) {
        assertEquals(
          ir.includes(part),
          true,
          `Expected IR to contain "${part}"\nActual IR:\n${ir}`,
        );
      }
    });

    it("should generate correct IR for complex arithmetic expressions", () => {
      const input = `package main
      func main() {
        print(4 + 3 * 2)
        print(10 - 6 / 2)
      }`;
      const ir = generateIR(input);

      // Check instruction ordering and numbering
      const instructions = [
        "%1 = mul nsw i32 3, 2", // First multiplication: 3 * 2
        "%2 = add nsw i32 4, %1", // Then addition: 4 + result
        "%3 = call i32 (i8*, ...)", // First print call
        "%4 = sdiv i32 6, 2", // Division: 6 / 2
        "%5 = sub nsw i32 10, %4", // Then subtraction: 10 - result
        "%6 = call i32 (i8*, ...)", // Second print call
      ];

      for (const instruction of instructions) {
        assertEquals(
          ir.includes(instruction),
          true,
          `Expected IR to contain instruction: "${instruction}"\nActual IR:\n${ir}`,
        );
      }

      // Check instruction order
      const irLines = ir.split("\n");
      let lastIndex = -1;
      for (const instruction of instructions) {
        const currentIndex = irLines.findIndex((line) =>
          line.trim().startsWith(instruction)
        );
        assertEquals(
          currentIndex > lastIndex,
          true,
          `Instruction "${instruction}" is not in the correct order`,
        );
        lastIndex = currentIndex;
      }
    });
  });
});
