import {
  CallExpression,
  Expression,
  FunctionDeclaration,
  InfixExpression,
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
      case "InfixExpression":
        return this.checkInfixExpression(expr);
      default:
        throw new SemanticError(
          `Expression type not yet supported: ${expr.type}`,
          expr,
        );
    }
  }

  /**
   * Check infix expression types (e.g., a + b)
   */
  private checkInfixExpression(expr: InfixExpression): Type {
    const leftType = this.inferType(expr.left);
    const rightType = this.inferType(expr.right);

    switch (expr.operator) {
      case "+": {
        // Check numeric types first
        if (leftType !== "int" || rightType !== "int") {
          throw new SemanticError(
            "Cannot perform arithmetic on non-numeric types",
            expr,
          );
        }
        return "int";
      }
      default:
        throw new SemanticError(
          `Operator not yet supported: ${expr.operator}`,
          expr,
        );
    }
  }

  // Type definitions for built-in functions
  private readonly builtinFunctions: Record<string, FunctionType> = {
    print: {
      parameters: ["string" as Type, "int" as Type], // Allow both string and int
      returnType: "void" as Type,
    },
  };

  /**
   * Type check function calls
   */
  private checkCallExpression(expr: CallExpression): Type {
    const funcName = expr.function.value;
    const funcType = this.builtinFunctions[funcName];

    if (!funcType) {
      throw new SemanticError(`Undefined function: ${funcName}`, expr);
    }

    // Check argument count
    if (expr.arguments.length !== 1) {
      throw new SemanticError(
        `Function ${funcName} expects 1 argument, but got ${expr.arguments.length}`,
        expr,
      );
    }

    // Check argument exists and get its type
    const arg = expr.arguments[0];
    if (!arg) {
      throw new SemanticError(
        `Function ${funcName} expects 1 argument, but none was provided`,
        expr,
      );
    }

    // Check argument type
    const argType = this.inferType(arg);
    if (!funcType.parameters.includes(argType)) {
      throw new SemanticError(
        `Cannot print value of type ${argType}`,
        arg,
      );
    }

    return funcType.returnType;
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
}
