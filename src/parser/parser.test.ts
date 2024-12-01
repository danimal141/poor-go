import { describe, it } from "std/testing/bdd.ts";
import { assertEquals } from "std/assert/mod.ts";
import { Parser } from "@/parser/parser.ts";
import { Lexer } from "@/lexer/lexer.ts";
import {
  CallExpression,
  ExpressionStatement,
  FunctionDeclaration,
  InfixExpression,
  IntegerLiteral,
} from "@/parser/ast.ts";

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

  it("should parse integer expression", () => {
    const input = `package main

func main() {
  print(4 + 3)
}`;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    console.log("Parsing input:", input);
    console.log("Generated AST:", JSON.stringify(program, null, 2));

    assertEquals(program.type, "Program");
    assertEquals(program.package, "main");
    assertEquals(program.declarations.length, 1);

    const mainFunc = program.declarations[0] as FunctionDeclaration;
    assertEquals(mainFunc.type, "FunctionDeclaration");
    assertEquals(mainFunc.name, "main");
    assertEquals(mainFunc.parameters.length, 0);

    const printStmt = mainFunc.body.statements[0] as ExpressionStatement;
    assertEquals(printStmt.type, "ExpressionStatement");

    const callExpr = printStmt.expression as CallExpression;
    assertEquals(callExpr.type, "CallExpression");
    assertEquals(callExpr.function.value, "print");
    assertEquals(callExpr.arguments.length, 1);

    const addExpr = callExpr.arguments[0] as InfixExpression;
    assertEquals(addExpr.type, "InfixExpression");
    assertEquals(addExpr.operator, "+");

    const leftNum = addExpr.left as IntegerLiteral;
    assertEquals(leftNum.type, "IntegerLiteral");
    assertEquals(leftNum.value, 4);

    const rightNum = addExpr.right as IntegerLiteral;
    assertEquals(rightNum.type, "IntegerLiteral");
    assertEquals(rightNum.value, 3);
  });
});
