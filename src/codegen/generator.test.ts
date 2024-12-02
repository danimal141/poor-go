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

      // Debug output
      console.log("Generated IR:", ir);

      assertEquals(
        ir.includes("\\0A"),
        true,
        `IR should contain "\\0A" for newline.\nGenerated IR:\n${ir}`,
      );
    });
  });

  it("should generate correct IR for complex arithmetic expressions", () => {
    const input = `package main
    func main() {
      print(4 + 3 * 2)
      print(10 - 6 / 2)
    }`;
    const ir = generateIR(input);

    const requiredParts = [
      "declare i32 @printf",
      '@.str.int.fmt = private unnamed_addr constant [4 x i8] c"%d\\0A\\00"',
      "define i32 @main()",
      // First print statement: 4 + (3 * 2)
      "%1 = mul nsw i32 3, 2",
      "%2 = add nsw i32 4, %1",
      "%3 = call i32 (i8*, ...) @printf",
      // Second print statement: 10 - (6 / 2)
      "%4 = sdiv i32 6, 2",
      "%5 = sub nsw i32 10, %4",
      "%6 = call i32 (i8*, ...) @printf",
      "ret i32 0",
    ];

    for (const part of requiredParts) {
      assertEquals(
        ir.includes(part),
        true,
        `Expected IR to contain "${part}"\nActual IR:\n${ir}`,
      );
    }
  });
});
