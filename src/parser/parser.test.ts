import { describe, it } from "std/testing/bdd.ts";
import { assertEquals } from "std/assert/mod.ts";
import { Parser } from "@/parser/parser.ts";
import { Lexer } from "@/lexer/lexer.ts";
import {
  CallExpression,
  ExpressionStatement,
  FunctionDeclaration,
  InfixExpression,
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

  it("should parse complex arithmetic expressions", () => {
    const input = `package main
    func main() {
      print(4 + 3 * 2)
      print(10 - 6 / 2)
    }`;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assertEquals(program.type, "Program");
    assertEquals(program.package, "main");
    assertEquals(program.declarations.length, 1);

    const mainFunc = program.declarations[0] as FunctionDeclaration;
    assertEquals(mainFunc.type, "FunctionDeclaration");
    assertEquals(mainFunc.name, "main");
    assertEquals(mainFunc.parameters.length, 0);
    assertEquals(mainFunc.body.statements.length, 2);

    // First print statement: 4 + 3 * 2
    const firstPrint = mainFunc.body.statements[0] as ExpressionStatement;
    const firstCall = firstPrint.expression as CallExpression;
    assertEquals(firstCall.type, "CallExpression");
    assertEquals(firstCall.function.value, "print");
    assertEquals(firstCall.arguments.length, 1);

    const firstArg = firstCall.arguments[0] as InfixExpression;
    assertEquals(firstArg.type, "InfixExpression");
    assertEquals(firstArg.operator, "+");

    const rightOperand = firstArg.right as InfixExpression;
    assertEquals(rightOperand.type, "InfixExpression");
    assertEquals(rightOperand.operator, "*");

    // Second print statement: 10 - 6 / 2
    const secondPrint = mainFunc.body.statements[1] as ExpressionStatement;
    const secondCall = secondPrint.expression as CallExpression;
    assertEquals(secondCall.type, "CallExpression");
    assertEquals(secondCall.function.value, "print");
    assertEquals(secondCall.arguments.length, 1);

    const secondArg = secondCall.arguments[0] as InfixExpression;
    assertEquals(secondArg.type, "InfixExpression");
    assertEquals(secondArg.operator, "-");

    const rightOperand2 = secondArg.right as InfixExpression;
    assertEquals(rightOperand2.type, "InfixExpression");
    assertEquals(rightOperand2.operator, "/");
  });
});
