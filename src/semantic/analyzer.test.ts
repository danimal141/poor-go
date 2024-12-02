import { describe, it } from "std/testing/bdd.ts";
import { assertThrows } from "std/assert/mod.ts";
import { Parser } from "@/parser/parser.ts";
import { Lexer } from "@/lexer/lexer.ts";
import { SemanticError } from "@/semantic/analyzer.ts";
import { SemanticAnalyzer } from "@/semantic/analyzer.ts";

describe("SemanticAnalyzer", () => {
  const parse = (input: string) => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    return parser.parseProgram();
  };

  describe("print statement analysis", () => {
    it("should accept valid string literal in print", () => {
      const input = `package main
func main() {
  print("hello")
}`;
      const ast = parse(input);
      const analyzer = new SemanticAnalyzer();
      analyzer.analyze(ast); // Should not throw
    });

    it("should reject print without arguments", () => {
      const input = `package main
func main() {
  print()
}`;
      const ast = parse(input);
      const analyzer = new SemanticAnalyzer();

      assertThrows(
        () => analyzer.analyze(ast),
        SemanticError,
        "Function print expects 1 argument",
      );
    });
  });

  describe("package validation", () => {
    it("should reject non-main package", () => {
      const input = `package other
func main() {
  print("hello")
}`;
      const ast = parse(input);
      const analyzer = new SemanticAnalyzer();

      assertThrows(
        () => analyzer.analyze(ast),
        SemanticError,
        'Package must be "main"',
      );
    });
  });

  describe("main function validation", () => {
    it("should accept valid main function", () => {
      const input = `package main
func main() {
  print("hello")
}`;
      const ast = parse(input);
      const analyzer = new SemanticAnalyzer();
      analyzer.analyze(ast); // Should not throw
    });

    it("should reject main function with parameters", () => {
      const input = `package main
func main(x int) {
  print("hello")
}`;
      const ast = parse(input);
      const analyzer = new SemanticAnalyzer();

      assertThrows(
        () => analyzer.analyze(ast),
        SemanticError,
        "main function cannot have parameters",
      );
    });

    it("should reject main function with return type", () => {
      const input = `package main
func main() int {
  print("hello")
  return 0
}`;
      const ast = parse(input);
      const analyzer = new SemanticAnalyzer();

      assertThrows(
        () => analyzer.analyze(ast),
        SemanticError,
        "main function cannot have explicit return type",
      );
    });
  });

  describe("arithmetic expressions", () => {
    it("should accept valid arithmetic expressions", () => {
      const input = `package main
    func main() {
      print(4 + 3 * 2)
      print(10 - 6 / 2)
    }`;
      const ast = parse(input);
      const analyzer = new SemanticAnalyzer();
      analyzer.analyze(ast); // Should not throw
    });

    it("should reject invalid arithmetic expressions", () => {
      const input = `package main
func main() {
  print("hello" + 3)
}`;
      const ast = parse(input);
      const analyzer = new SemanticAnalyzer();

      assertThrows(
        () => analyzer.analyze(ast),
        SemanticError,
        "Cannot perform arithmetic operation '+' on types",
      );
    });

    it("should reject arithmetic with boolean operands", () => {
      const input = `package main
      func main() {
        print(true + 1)
      }`;
      const ast = parse(input);
      const analyzer = new SemanticAnalyzer();

      assertThrows(
        () => analyzer.analyze(ast),
        SemanticError,
        "Cannot perform arithmetic operation '+' on types",
      );
    });

    it("should validate all arithmetic operators", () => {
      const operators = ["+", "-", "*", "/"];
      const inputs = operators.map((op) => `
        package main
        func main() {
          print(3 ${op} 2)
        }`);

      inputs.forEach((input) => {
        const ast = parse(input);
        const analyzer = new SemanticAnalyzer();
        analyzer.analyze(ast); // Should not throw
      });
    });

    describe("specific operator tests", () => {
      const createTestInput = (expr: string) => `
        package main
        func main() {
          print(${expr})
        }`;

      const operators = ["+", "-", "*", "/"];
      operators.forEach((op) => {
        it(`should handle ${op} operator with integers`, () => {
          const input = createTestInput(`5 ${op} 3`);
          const ast = parse(input);
          const analyzer = new SemanticAnalyzer();
          analyzer.analyze(ast); // Should not throw
        });

        it(`should reject ${op} operator with mixed types`, () => {
          const tests = [
            { expr: `"hello" ${op} 42`, desc: "string and int" },
            { expr: `42 ${op} "world"`, desc: "int and string" },
            { expr: `true ${op} 10`, desc: "bool and int" },
            { expr: `5 ${op} false`, desc: "int and bool" },
          ];

          tests.forEach(({ expr, desc }) => {
            const input = createTestInput(expr);
            const ast = parse(input);
            const analyzer = new SemanticAnalyzer();

            assertThrows(
              () => analyzer.analyze(ast),
              SemanticError,
              "Cannot perform arithmetic operation",
              `Failed for ${desc} with operator ${op}`,
            );
          });
        });
      });
    });

    it("should handle complex expressions", () => {
      const input = `package main
      func main() {
        print(((4 + 3) * 2) - (10 / 2))
      }`;
      const ast = parse(input);
      const analyzer = new SemanticAnalyzer();
      analyzer.analyze(ast); // Should not throw
    });
  });
});
