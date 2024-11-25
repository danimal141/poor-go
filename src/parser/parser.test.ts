import { describe, it } from "std/testing/bdd.ts";
import { assertEquals } from "std/assert/mod.ts";
import { Parser } from "@/parser/parser.ts";
import { Lexer } from "@/lexer/lexer.ts";
import {
  CallExpression,
  ExpressionStatement,
  FunctionDeclaration,
  StringLiteral,
} from "@/parser/ast.ts";

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

    // Check print statement
    const printStmt = mainFunc.body.statements[0] as ExpressionStatement;
    assertEquals(printStmt.type, "ExpressionStatement");

    const callExpr = printStmt.expression as CallExpression;
    assertEquals(callExpr.type, "CallExpression");
    assertEquals(callExpr.function.type, "Identifier");
    assertEquals(callExpr.function.value, "print");

    // Check print argument
    assertEquals(callExpr.arguments.length, 1);
    const arg = callExpr.arguments[0] as StringLiteral;
    assertEquals(arg.type, "StringLiteral");
    assertEquals(arg.value, "Hello World!");
  });

  it("should report an error for invalid package name", () => {
    const input = `package other { print("Hello World!") }`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    try {
      parser.parseProgram();
      throw new Error("Expected parser to throw an error");
    } catch (error) {
      if (error instanceof Error) {
        assertEquals(
          error.message.includes("Package name must be 'main'"),
          true,
          "Error message should mention package name must be 'main'",
        );
      }
    }
  });

  it("should report an error for missing brackets", () => {
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
        error.message.includes("Expected '{'"),
        true,
        `Error message should mention missing '{' but got: ${error.message}`,
      );
    }
  });
});
