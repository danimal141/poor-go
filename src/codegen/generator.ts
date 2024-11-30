import {
  CallExpression,
  FunctionDeclaration,
  Program,
  StringLiteral,
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
   * Generates LLVM IR for a print statement
   * @param value The string constant identifier to print
   * Returns: Array of LLVM IR instructions for the print operation
   */
  private emitPrint(value: string): string[] {
    const fmtPtr = this.nextVar(); // Will be %1
    const strPtr = this.nextVar(); // Will be %2
    const callResult = this.nextVar(); // Will be %3

    return [
      `${fmtPtr} = getelementptr [3 x i8], [3 x i8]* @.str.fmt, i64 0, i64 0`,
      `${strPtr} = getelementptr [${value.length + 1} x i8], [${
        value.length + 1
      } x i8]* ${value}, i64 0, i64 0`,
      `${callResult} = call i32 (i8*, ...) @printf(i8* ${fmtPtr}, i8* ${strPtr})`,
    ];
  }

  /**
   * Main entry point: generates LLVM IR for the entire program
   * @param ast The AST representing the program
   * Returns: Complete LLVM IR as a string
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
            if (arg && arg.type === "StringLiteral") {
              const strLit = arg as StringLiteral;
              const strVar = this.emitStringLiteral(strLit.value);
              statements.push(...this.emitPrint(strVar));
            }
          }
        }
      }
    }

    this.emitMainFunction(statements);
    return this.output.join("\n");
  }
}
