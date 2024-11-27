// src/semantic/analyzer.ts
import {
  CallExpression,
  Expression,
  FunctionDeclaration,
  Node,
  Program,
  Statement,
} from "@/parser/ast.ts";

// Types in PoorGo type system
export type Type = "void" | "int" | "string" | "bool" | "unknown";

// Type information for functions
interface FunctionType {
  parameters: Type[];
  returnType: Type;
}

// Type definitions for built-in functions
const builtinFunctions: Record<string, FunctionType> = {
  print: {
    parameters: ["string"],
    returnType: "void",
  },
} as const;

// Custom error class for semantic analysis errors
export class SemanticError extends Error {
  constructor(
    message: string,
    public readonly node: Node,
  ) {
    super(
      `Semantic Error at line ${node.location.line}, column ${node.location.column}: ${message}`,
    );
    Object.setPrototypeOf(this, SemanticError.prototype);
  }
}

export class SemanticAnalyzer {
  private readonly scopeStack: Map<string, Type>[] = [];

  // Manipulate scope stack
  private pushScope(): void {
    this.scopeStack.push(new Map<string, Type>());
  }

  private popScope(): void {
    if (this.scopeStack.length === 0) {
      throw new Error("Internal error: Cannot pop empty scope stack");
    }
    this.scopeStack.pop();
  }

  // Resolve variable type through scope chain
  private resolve(name: string): Type {
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      const scope = this.scopeStack[i];
      if (!scope) continue;
      const type = scope.get(name);
      if (type) return type;
    }
    throw new Error(`Undefined variable: ${name}`);
  }

  // Infer expression type
  private inferType(expr: Expression): Type {
    switch (expr.type) {
      case "StringLiteral":
        return "string";
      case "IntegerLiteral":
        return "int";
      case "BooleanLiteral":
        return "bool";
      case "Identifier":
        return this.resolve(expr.value);
      case "CallExpression":
        return this.checkCallExpression(expr);
      case "PrefixExpression":
      case "InfixExpression":
        throw new SemanticError(
          `Expression type not yet supported: ${expr.type}`,
          expr,
        );
    }
  }

  // Type check function calls
  private checkCallExpression(expr: CallExpression): Type {
    const funcName = expr.function.value;
    const funcType = builtinFunctions[funcName];

    if (!funcType) {
      throw new SemanticError(`Undefined function: ${funcName}`, expr);
    }

    // Check argument count
    if (expr.arguments.length !== funcType.parameters.length) {
      throw new SemanticError(
        `Function ${funcName} expects ${funcType.parameters.length} arguments, but got ${expr.arguments.length}`,
        expr,
      );
    }

    // Check argument types
    for (let i = 0; i < expr.arguments.length; i++) {
      const arg = expr.arguments[i];
      if (!arg) {
        throw new SemanticError(
          `Missing argument ${i + 1} for function ${funcName}`,
          expr,
        );
      }
      const argType = this.inferType(arg);
      const expectedType = funcType.parameters[i];
      if (argType !== expectedType) {
        throw new SemanticError(
          `Argument ${
            i + 1
          } of function ${funcName} expects type ${expectedType}, but got ${argType}`,
          arg,
        );
      }
    }

    return funcType.returnType;
  }

  // Entry point for analysis
  public analyze(program: Program): void {
    this.pushScope();

    // Validate package
    if (program.package !== "main") {
      throw new SemanticError(`Package must be "main"`, program);
    }

    // Analyze declarations
    for (const decl of program.declarations) {
      if (decl.type !== "FunctionDeclaration") {
        throw new SemanticError(
          `Unsupported declaration type: ${decl.type}`,
          decl,
        );
      }
      this.analyzeFunctionDeclaration(decl as FunctionDeclaration);
    }

    this.popScope();
  }

  // Analyze function declaration
  private analyzeFunctionDeclaration(func: FunctionDeclaration): void {
    this.pushScope();

    // Validate main function
    if (func.name === "main") {
      if (func.parameters.length > 0) {
        throw new SemanticError(
          "main function cannot have parameters",
          func,
        );
      }
      if (func.returnType !== null) {
        throw new SemanticError(
          "main function cannot have explicit return type",
          func,
        );
      }
    }

    // Analyze function body
    for (const stmt of func.body.statements) {
      this.analyzeStatement(stmt);
    }

    this.popScope();
  }

  // Analyze statement
  private analyzeStatement(stmt: Statement): void {
    if (stmt.type === "ExpressionStatement") {
      this.inferType(stmt.expression);
    }
  }
}
