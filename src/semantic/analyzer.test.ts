import { describe, it } from "std/testing/bdd.ts";
import { assertThrows } from "std/assert/mod.ts";
import { Parser } from "@/parser/parser.ts";
import { Lexer } from "@/lexer/lexer.ts";
import { SemanticAnalyzer, SemanticError } from "@/semantic/analyzer.ts";

describe("SemanticAnalyzer", () => {
  const parse = (input: string) => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    return parser.parseProgram();
  };

  describe("print statement analysis", () => {
    it("should accept valid string literal in print", () => {
      const input = `package main { print("hello") }`;
      const ast = parse(input);
      const analyzer = new SemanticAnalyzer();

      analyzer.analyze(ast);
    });

    it("should reject print without arguments", () => {
      const input = `package main { print() }`;
      const ast = parse(input);
      const analyzer = new SemanticAnalyzer();

      assertThrows(
        () => analyzer.analyze(ast),
        SemanticError,
        "Function print expects 1 arguments",
      );
    });
  });

  describe("package validation", () => {
    it("should reject non-main package", () => {
      const input = `package other { print("hello") }`;
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
      const input = `package main { print("hello") }`;
      const ast = parse(input);
      const analyzer = new SemanticAnalyzer();

      analyzer.analyze(ast);
    });

    it("should reject main function with parameters", () => {
      const input = `package main func main(x int) { print("hello") }`;
      const ast = parse(input);
      const analyzer = new SemanticAnalyzer();

      assertThrows(
        () => analyzer.analyze(ast),
        SemanticError,
        "main function cannot have parameters",
      );
    });
  });
});
