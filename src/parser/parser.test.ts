import { describe, it } from "std/testing/bdd.ts";
import { assertEquals } from "std/assert/mod.ts";
import { Parser } from "@/parser/parser.ts";
import { Lexer } from "@/lexer/lexer.ts";
import { FunctionDeclaration } from "@/parser/ast.ts";

describe("Parser", () => {
  it("should parse Hello World program", () => {
    const input = `package main

func main() {
  print("Hello World!")
}`;

    console.log("Parsing input:", input);

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    // Debug: Print AST
    console.log("Generated AST:", JSON.stringify(program, null, 2));

    // Check basic program structure
    assertEquals(program.type, "Program");
    assertEquals(program.package, "main");
    assertEquals(
      program.declarations.length,
      1,
      "Program should have exactly one declaration",
    );

    // Check main function declaration
    const mainFunc = program.declarations[0] as FunctionDeclaration;
    assertEquals(mainFunc.type, "FunctionDeclaration");
    assertEquals(mainFunc.name, "main");
    assertEquals(mainFunc.parameters.length, 0);
    assertEquals(mainFunc.returnType, null);
    assertEquals(mainFunc.body.statements.length, 1);
  });
});
