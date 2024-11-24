// src/parser/ast_test.ts
import { describe, it } from "https://deno.land/std/testing/bdd.ts";
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std/assert/mod.ts";
import {
  BooleanLiteral,
  CallExpression,
  ForStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  InfixExpression,
  IntegerLiteral,
  Parameter,
  Program,
  ReturnStatement,
  StringLiteral,
  TypeNode,
  VariableDeclaration,
} from "@/parser/ast.ts";

describe("AST Nodes", () => {
  const dummyLoc = { line: 1, column: 1 };

  describe("Program", () => {
    it("creates program node", () => {
      const program: Program = {
        type: "Program",
        package: "main",
        declarations: [],
        location: dummyLoc,
      };

      assertEquals(program.type, "Program");
      assertEquals(program.package, "main");
      assertEquals(program.declarations.length, 0);
    });
  });

  describe("Declarations", () => {
    it("creates function declaration node", () => {
      const returnType: TypeNode = {
        type: "TypeNode",
        typeType: "int",
        location: dummyLoc,
      };

      const parameter: Parameter = {
        name: "x",
        type: {
          type: "TypeNode",
          typeType: "int",
          location: dummyLoc,
        },
        location: dummyLoc,
      };

      const funcDecl: FunctionDeclaration = {
        type: "FunctionDeclaration",
        name: "add",
        parameters: [parameter],
        returnType,
        body: {
          type: "BlockStatement",
          statements: [],
          location: dummyLoc,
        },
        location: dummyLoc,
      };

      assertEquals(funcDecl.type, "FunctionDeclaration");
      assertEquals(funcDecl.name, "add");
      assertEquals(funcDecl.parameters.length, 1);

      const firstParam = funcDecl.parameters[0];
      assertExists(firstParam, "First parameter should exist");
      assertEquals(firstParam.name, "x");

      assertExists(funcDecl.returnType, "Return type should exist");
      assertEquals(funcDecl.returnType.typeType, "int");
    });

    it("creates variable declaration node", () => {
      const varDecl: VariableDeclaration = {
        type: "VariableDeclaration",
        name: "x",
        declType: {
          type: "TypeNode",
          typeType: "int",
          location: dummyLoc,
        },
        init: {
          type: "IntegerLiteral",
          value: 5,
          location: dummyLoc,
        },
        location: dummyLoc,
      };

      assertEquals(varDecl.type, "VariableDeclaration");
      assertEquals(varDecl.name, "x");
      assertExists(varDecl.declType, "Type should exist");
      assertEquals(varDecl.declType.typeType, "int");

      assertEquals(varDecl.init.type, "IntegerLiteral");
      if (varDecl.init.type === "IntegerLiteral") {
        assertEquals(varDecl.init.value, 5);
      }
    });
  });

  describe("Statements", () => {
    it("creates return statement node", () => {
      const returnStmt: ReturnStatement = {
        type: "ReturnStatement",
        returnValue: {
          type: "IntegerLiteral",
          value: 42,
          location: dummyLoc,
        },
        location: dummyLoc,
      };

      assertEquals(returnStmt.type, "ReturnStatement");
      assertEquals(returnStmt.returnValue.type, "IntegerLiteral");
      if (returnStmt.returnValue.type === "IntegerLiteral") {
        assertEquals(returnStmt.returnValue.value, 42);
      }
    });

    it("creates if statement node", () => {
      const ifStmt: IfStatement = {
        type: "IfStatement",
        condition: {
          type: "BooleanLiteral",
          value: true,
          location: dummyLoc,
        },
        consequence: {
          type: "BlockStatement",
          statements: [],
          location: dummyLoc,
        },
        alternative: null,
        location: dummyLoc,
      };

      assertEquals(ifStmt.type, "IfStatement");
      assertEquals(ifStmt.condition.type, "BooleanLiteral");
      if (ifStmt.condition.type === "BooleanLiteral") {
        assertEquals(ifStmt.condition.value, true);
      }
      assertEquals(ifStmt.alternative, null);
    });

    it("creates for statement node", () => {
      const forStmt: ForStatement = {
        type: "ForStatement",
        init: {
          type: "VariableDeclaration",
          name: "i",
          declType: null,
          init: {
            type: "IntegerLiteral",
            value: 0,
            location: dummyLoc,
          },
          location: dummyLoc,
        },
        condition: {
          type: "InfixExpression",
          operator: "<",
          left: {
            type: "Identifier",
            value: "i",
            location: dummyLoc,
          },
          right: {
            type: "IntegerLiteral",
            value: 10,
            location: dummyLoc,
          },
          location: dummyLoc,
        },
        update: {
          type: "InfixExpression",
          operator: "+",
          left: {
            type: "Identifier",
            value: "i",
            location: dummyLoc,
          },
          right: {
            type: "IntegerLiteral",
            value: 1,
            location: dummyLoc,
          },
          location: dummyLoc,
        },
        body: {
          type: "BlockStatement",
          statements: [],
          location: dummyLoc,
        },
        location: dummyLoc,
      };

      assertEquals(forStmt.type, "ForStatement");
      assertExists(forStmt.init, "Init should exist");
      assertEquals(forStmt.init.type, "VariableDeclaration");
      assertExists(forStmt.condition, "Condition should exist");
      assertEquals(forStmt.condition.type, "InfixExpression");
      if (forStmt.condition.type === "InfixExpression") {
        assertEquals(forStmt.condition.operator, "<");
      }
    });
  });

  describe("Expressions", () => {
    it("creates identifier node", () => {
      const ident: Identifier = {
        type: "Identifier",
        value: "x",
        location: dummyLoc,
      };

      assertEquals(ident.type, "Identifier");
      assertEquals(ident.value, "x");
    });

    it("creates literal nodes", () => {
      const intLit: IntegerLiteral = {
        type: "IntegerLiteral",
        value: 42,
        location: dummyLoc,
      };

      const strLit: StringLiteral = {
        type: "StringLiteral",
        value: "hello",
        location: dummyLoc,
      };

      const boolLit: BooleanLiteral = {
        type: "BooleanLiteral",
        value: true,
        location: dummyLoc,
      };

      assertEquals(intLit.value, 42);
      assertEquals(strLit.value, "hello");
      assertEquals(boolLit.value, true);
    });

    it("creates infix expression node", () => {
      const infixExpr: InfixExpression = {
        type: "InfixExpression",
        operator: "+",
        left: {
          type: "IntegerLiteral",
          value: 5,
          location: dummyLoc,
        },
        right: {
          type: "IntegerLiteral",
          value: 3,
          location: dummyLoc,
        },
        location: dummyLoc,
      };

      assertEquals(infixExpr.type, "InfixExpression");
      assertEquals(infixExpr.operator, "+");
      assertEquals(infixExpr.left.type, "IntegerLiteral");
      assertEquals(infixExpr.right.type, "IntegerLiteral");

      if (infixExpr.left.type === "IntegerLiteral") {
        assertEquals(infixExpr.left.value, 5);
      }
      if (infixExpr.right.type === "IntegerLiteral") {
        assertEquals(infixExpr.right.value, 3);
      }
    });

    it("creates call expression node", () => {
      const callExpr: CallExpression = {
        type: "CallExpression",
        function: {
          type: "Identifier",
          value: "add",
          location: dummyLoc,
        },
        arguments: [
          {
            type: "IntegerLiteral",
            value: 1,
            location: dummyLoc,
          },
          {
            type: "IntegerLiteral",
            value: 2,
            location: dummyLoc,
          },
        ],
        location: dummyLoc,
      };

      assertEquals(callExpr.type, "CallExpression");
      assertEquals(callExpr.function.value, "add");
      assertEquals(callExpr.arguments.length, 2);

      const firstArg = callExpr.arguments[0];
      const secondArg = callExpr.arguments[1];

      assertExists(firstArg, "First argument should exist");
      assertExists(secondArg, "Second argument should exist");

      if (firstArg.type === "IntegerLiteral") {
        assertEquals(firstArg.value, 1);
      }
      if (secondArg.type === "IntegerLiteral") {
        assertEquals(secondArg.value, 2);
      }
    });
  });
});
