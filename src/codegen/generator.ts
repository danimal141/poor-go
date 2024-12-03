import {
  CallExpression,
  Expression,
  FunctionDeclaration,
  Program,
} from "@/parser/ast.ts";

export class LLVMGenerator {
  private output: string[] = [];
  private stringCounter = 0;
  private currentVarNumber = 1; // Track the current instruction number

  constructor() {
    this.emitModuleHeader();
  }

  /**
   * Emits the LLVM module header including necessary declarations
   */
  private emitModuleHeader(): void {
    this.output.push("declare i32 @printf(i8* nocapture readonly, ...)\n");
    // String format for print
    this.output.push(
      `@.str.fmt = private unnamed_addr constant [3 x i8] c"%s\\00", align 1\n`,
    );
    // Integer format for print
    this.output.push(
      `@.str.int.fmt = private unnamed_addr constant [4 x i8] c"%d\\0A\\00", align 1\n`,
    );
  }

  /**
   * Generates the next unique variable name with correct numbering
   */
  private nextVar(): string {
    return `%${this.currentVarNumber++}`;
  }

  /**
   * Generates the next unique string constant name
   */
  private nextStringConst(): string {
    return `@.str.${++this.stringCounter}`;
  }

  /**
   * Processes string literal for LLVM IR
   */
  private processStringLiteral(
    str: string,
  ): { processed: string; length: number } {
    let processed = "";
    let length = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === "\\") {
        length++;
        processed += "\\";
      } else if (char === "\n") {
        length++;
        processed += "\\0A";
      } else {
        length++;
        processed += char;
      }
    }

    return { processed, length };
  }

  /**
   * Generates LLVM IR for an integer expression
   */
  private emitIntegerExpression(expr: Expression): string {
    switch (expr.type) {
      case "IntegerLiteral":
        return expr.value.toString();
      case "InfixExpression": {
        const left = this.emitIntegerExpression(expr.left);
        const right = this.emitIntegerExpression(expr.right);
        const result = this.nextVar();

        switch (expr.operator) {
          case "+":
            this.output.push(`  ${result} = add nsw i32 ${left}, ${right}`);
            return result;
          case "-":
            this.output.push(`  ${result} = sub nsw i32 ${left}, ${right}`);
            return result;
          case "*":
            this.output.push(`  ${result} = mul nsw i32 ${left}, ${right}`);
            return result;
          case "/":
            this.output.push(`  ${result} = sdiv i32 ${left}, ${right}`);
            return result;
          default:
            throw new Error(`Unsupported operator: ${expr.operator}`);
        }
      }
      default:
        throw new Error(`Unsupported expression type: ${expr.type}`);
    }
  }

  /**
   * Generates LLVM IR for a print statement
   */
  private emitPrint(expr: Expression): void {
    if (expr.type === "StringLiteral") {
      const { processed, length } = this.processStringLiteral(expr.value);
      const strConst = this.nextStringConst();

      // Define string constant
      this.output.push(
        `${strConst} = private unnamed_addr constant [${
          length + 1
        } x i8] c"${processed}\\00", align 1\n`,
      );

      const fmtPtr = this.nextVar();
      const strPtr = this.nextVar();
      const callResult = this.nextVar();

      this.output.push(
        `  ${fmtPtr} = getelementptr [3 x i8], [3 x i8]* @.str.fmt, i64 0, i64 0`,
      );
      this.output.push(
        `  ${strPtr} = getelementptr [${length + 1} x i8], [${
          length + 1
        } x i8]* ${strConst}, i64 0, i64 0`,
      );
      this.output.push(
        `  ${callResult} = call i32 (i8*, ...) @printf(i8* ${fmtPtr}, i8* ${strPtr})`,
      );
    } else {
      const intResult = this.emitIntegerExpression(expr);
      const callResult = this.nextVar();
      this.output.push(
        `  ${callResult} = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @.str.int.fmt, i64 0, i64 0), i32 ${intResult})`,
      );
    }
  }

  /**
   * Emits the main function with the given statements
   */
  private emitMainFunction(mainFunction: FunctionDeclaration): void {
    this.output.push("define i32 @main() {\n");
    this.output.push("entry:\n");

    // Process all statements in the function body
    for (const stmt of mainFunction.body.statements) {
      if (stmt.type === "ExpressionStatement") {
        const expr = stmt.expression;
        if (expr.type === "CallExpression") {
          const callExpr = expr as CallExpression;
          if (
            callExpr.function.value === "print" &&
            callExpr.arguments.length > 0
          ) {
            const arg = callExpr.arguments[0];
            if (arg) {
              this.emitPrint(arg);
            }
          }
        }
      }
    }

    this.output.push("  ret i32 0\n");
    this.output.push("}\n");
  }

  /**
   * Main entry point: generates LLVM IR for the entire program
   */
  public generate(ast: Program): string {
    // Reset counters at the start of generation
    this.currentVarNumber = 1;
    this.stringCounter = 0;

    const mainFunction = ast.declarations[0];
    if (mainFunction?.type === "FunctionDeclaration") {
      this.emitMainFunction(mainFunction as FunctionDeclaration);
    }

    return this.output.join("\n");
  }
}
