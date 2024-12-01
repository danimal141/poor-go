import {
  CallExpression,
  Expression,
  FunctionDeclaration,
  Program,
} from "@/parser/ast.ts";

/**
 * LLVM IR Generator for PoorGo
 * Converts AST to LLVM IR string representation
 */
export class LLVMGenerator {
  private output: string[] = [];
  private varCounter = 0;
  private stringCounter = 0;

  constructor() {
    this.emitModuleHeader();
  }

  /**
   * Emits the LLVM module header including necessary declarations
   * and global string format constant
   */
  private emitModuleHeader(): void {
    this.output.push("declare i32 @printf(i8* nocapture readonly, ...)\n");
    this.output.push(
      `@.str.fmt = private unnamed_addr constant [3 x i8] c"%s\\00", align 1\n`,
    );
  }

  /**
   * Generates the next unique variable name
   * Returns: A string in the format %n where n is an incrementing number
   */
  private nextVar(): string {
    return `%${++this.varCounter}`;
  }

  /**
   * Generates the next unique string constant identifier
   * Returns: A string in the format @.str.n where n is an incrementing number
   */
  private nextStringConst(): string {
    return `@.str.${this.stringCounter++}`;
  }

  /**
   * Processes a string literal to handle escape sequences and returns the LLVM IR representation
   * @param str The input string to process
   * Returns: An object containing the processed string and its length
   */
  private processStringLiteral(
    str: string,
  ): { processed: string; length: number } {
    let processed = "";
    let length = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === "\\" && i + 1 < str.length) {
        // Handle escape sequences
        const nextChar = str[++i];
        switch (nextChar) {
          case "n":
            processed += "\\0A"; // Newline
            length++;
            break;
          case "r":
            processed += "\\0D"; // Carriage return
            length++;
            break;
          case "t":
            processed += "\\09"; // Tab
            length++;
            break;
          case '"':
            processed += '\\"'; // Quote
            length++;
            break;
          case "\\":
            processed += "\\\\"; // Backslash
            length++;
            break;
          default:
            processed += "\\" + nextChar;
            length += 2;
        }
      } else {
        processed += char;
        length++;
      }
    }

    return { processed, length };
  }

  /**
   * Emits a string literal as a global constant
   * @param value The string value to emit
   * Returns: The identifier for the emitted string constant
   */
  private emitStringLiteral(value: string): string {
    const { processed, length } = this.processStringLiteral(value);
    const globalId = this.nextStringConst();

    // Add null terminator to the length
    this.output.push(
      `${globalId} = private unnamed_addr constant [${
        length + 1
      } x i8] c"${processed}\\00", align 1\n`,
    );

    return globalId;
  }

  /**
   * Emits the main function with the given statements
   * @param statements Array of LLVM IR statements to include in the main function
   */
  private emitMainFunction(statements: string[]): void {
    this.output.push("define i32 @main() {\n");
    this.output.push("entry:\n");
    statements.forEach((stmt) => this.output.push("  " + stmt));
    this.output.push("  ret i32 0\n");
    this.output.push("}\n");
  }

  /**
   * Generates LLVM IR for a numeric expression
   */
  private emitIntegerExpression(expr: Expression): string {
    switch (expr.type) {
      case "IntegerLiteral":
        return expr.value.toString();
      case "InfixExpression": {
        // Get the left and right operands
        const left = this.emitIntegerExpression(expr.left);
        const right = this.emitIntegerExpression(expr.right);
        const result = this.nextVar();

        switch (expr.operator) {
          case "+":
            // Specify type for LLVM add instruction
            this.output.push(`  ${result} = add i32 ${left}, ${right}`);
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
   * Emits string literal as a global constant and returns LLVM IR instructions
   */
  // private emitPrintString(strVar: string): string[] {
  //   const fmtPtr = this.nextVar();
  //   const strPtr = this.nextVar();
  //   const callResult = this.nextVar();

  //   return [
  //     `${fmtPtr} = getelementptr [3 x i8], [3 x i8]* @.str.fmt, i64 0, i64 0`,
  //     `${strPtr} = getelementptr [${strVar.length + 1} x i8], [${
  //       strVar.length + 1
  //     } x i8]* ${strVar}, i64 0, i64 0`,
  //     `${callResult} = call i32 (i8*, ...) @printf(i8* ${fmtPtr}, i8* ${strPtr})`,
  //   ];
  // }

  /**
   * Generates LLVM IR for a print statement
   */
  private emitPrint(expr: Expression): string[] {
    if (expr.type === "StringLiteral") {
      const strVar = this.emitStringLiteral(expr.value);
      const fmtPtr = this.nextVar();
      const strPtr = this.nextVar();
      const callResult = this.nextVar();

      return [
        `${fmtPtr} = getelementptr [3 x i8], [3 x i8]* @.str.fmt, i64 0, i64 0`,
        `${strPtr} = getelementptr [${expr.value.length + 1} x i8], [${
          expr.value.length + 1
        } x i8]* ${strVar}, i64 0, i64 0`,
        `${callResult} = call i32 (i8*, ...) @printf(i8* ${fmtPtr}, i8* ${strPtr})`,
      ];
    } else {
      // For integer printing
      const intResult = this.emitIntegerExpression(expr);
      const callResult = this.nextVar();

      // Add integer format string
      const intFmt = "@.str.int.fmt";
      if (
        !this.output.includes(
          `${intFmt} = private unnamed_addr constant [4 x i8] c"%d\\0A\\00", align 1`,
        )
      ) {
        this.output.unshift(
          `${intFmt} = private unnamed_addr constant [4 x i8] c"%d\\0A\\00", align 1`,
        );
      }

      return [
        `${callResult} = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* ${intFmt}, i64 0, i64 0), i32 ${intResult})`,
      ];
    }
  }

  /**
   * Main entry point: generates LLVM IR for the entire program
   */
  public generate(ast: Program): string {
    const statements: string[] = [];

    const firstDecl = ast.declarations[0];
    if (firstDecl?.type === "FunctionDeclaration") {
      const funcDecl = firstDecl as FunctionDeclaration;
      const firstStmt = funcDecl.body.statements[0];
      if (firstStmt?.type === "ExpressionStatement") {
        const expr = firstStmt.expression;
        if (expr.type === "CallExpression") {
          const callExpr = expr as CallExpression;
          if (
            callExpr.function.value === "print" && callExpr.arguments.length > 0
          ) {
            const arg = callExpr.arguments[0];
            if (arg) { // Add null check
              statements.push(...this.emitPrint(arg));
            }
          }
        }
      }
    }

    this.emitMainFunction(statements);
    return this.output.join("\n");
  }
}
