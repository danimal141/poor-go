import { describe, it } from "std/testing/bdd.ts";
import { assertEquals } from "std/assert/mod.ts";
import { Parser } from "@/parser/parser.ts";
import { Lexer } from "@/lexer/lexer.ts";
import { FunctionDeclaration } from "@/parser/ast.ts";

// Target output:
//  {
//   type: "Program",
//   package: "main",
//   declarations: [{
//     type: "FunctionDeclaration",
//     name: "main",
//     parameters: [],
//     returnType: null,
//     body: {
//       type: "BlockStatement",
//       statements: [{
//         type: "ExpressionStatement",
//         expression: {
//           type: "CallExpression",
//           function: {
//             type: "Identifier",
//             value: "print"
//           },
//           arguments: [{
//             type: "StringLiteral",
//             value: "Hello World!"
//           }]
//         }
//       }]
//     }
//   }]
// }

describe("Parser", () => {
  it("should parse Hello World program", () => {
    const input = `package main { print("Hello World!") }`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();

    // Check basic program structure
    assertEquals(program.type, "Program");
    assertEquals(program.package, "main");
    assertEquals(program.declarations.length, 1);

    // Check main function declaration
    const mainFunc = program.declarations[0] as FunctionDeclaration;
    assertEquals(mainFunc.type, "FunctionDeclaration");
    assertEquals(mainFunc.name, "main");
    assertEquals(mainFunc.parameters.length, 0);
    assertEquals(mainFunc.returnType, null);
    assertEquals(mainFunc.body.statements.length, 1);
  });

  it("should require package keyword", () => {
    const input = `main { print("Hello World!") }`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    try {
      parser.parseProgram();
      throw new Error("Expected parser to throw an error");
    } catch (error) {
      if (error instanceof Error) {
        assertEquals(
          error.message.includes("must start with 'package' keyword"),
          true,
          "Error message should mention package keyword requirement",
        );
      }
    }
  });

  it("should require package name", () => {
    const input = `package { print("Hello World!") }`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    try {
      parser.parseProgram();
      throw new Error("Expected parser to throw an error");
    } catch (error) {
      if (error instanceof Error) {
        assertEquals(
          error.message.includes("Expected package name"),
          true,
          "Error message should mention package name requirement",
        );
      }
    }
  });

  it("should require opening brace", () => {
    const input = `package main print("Hello World!")`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    try {
      parser.parseProgram();
      throw new Error("Expected parser to throw an error");
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      assertEquals(
        error.message.includes("Expected '{' after package declaration"),
        true,
        "Error message should mention missing '{'",
      );
    }
  });
});
