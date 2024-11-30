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

  private emitModuleHeader(): void {
    this.output.push("declare i32 @printf(i8* nocapture readonly, ...)\n");
    this.emitStringHelpers();
  }

  private emitStringHelpers(): void {
    this.output.push(
      `@.str = private unnamed_addr constant [2 x i8] c"%s\\00", align 1\n`,
    );
  }

  private nextVar(): string {
    return `%${this.varCounter++}`;
  }

  private nextStringConst(): string {
    return `@.str.${this.stringCounter++}`;
  }

  /**
   * Convert string literal to LLVM IR escaped string
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
            processed += "\\0A";
            length++;
            break;
          case "r":
            processed += "\\0D";
            length++;
            break;
          case "t":
            processed += "\\09";
            length++;
            break;
          case '"':
            processed += '\\"';
            length++;
            break;
          case "\\":
            processed += "\\\\";
            length++;
            break;
          default:
            // Unrecognized escape sequence, treat as literal characters
            processed += "\\" + nextChar;
            length += 2;
        }
      } else {
        // Regular character
        processed += char;
        length++;
      }
    }

    return { processed, length };
  }

  /**
   * Emit string literal as global constant
   */
  private emitStringLiteral(value: string): string {
    const { processed, length } = this.processStringLiteral(value);
    const globalId = this.nextStringConst();

    // +1 for null terminator
    this.output.push(
      `${globalId} = private unnamed_addr constant [${
        length + 1
      } x i8] c"${processed}\\00", align 1\n`,
    );

    return globalId;
  }

  private emitMainFunction(statements: string[]): void {
    this.output.push("define i32 @main() {\n");
    this.output.push("entry:\n");
    statements.forEach((stmt) => this.output.push("  " + stmt));
    this.output.push("  ret i32 0\n");
    this.output.push("}\n");
  }

  private emitPrint(value: string): string[] {
    const strPtr = this.nextVar();
    const fmtPtr = this.nextVar();
    const callResult = this.nextVar();

    return [
      `${fmtPtr} = getelementptr [2 x i8], [2 x i8]* @.str, i64 0, i64 0`,
      `${strPtr} = getelementptr [${value.length + 1} x i8], [${
        value.length + 1
      } x i8]* ${value}, i64 0, i64 0`,
      `${callResult} = call i32 (i8*, ...) @printf(i8* ${fmtPtr}, i8* ${strPtr})`,
    ];
  }

  public generate(ast: any): string {
    const statements: string[] = [];

    if (
      ast.declarations[0]?.body?.statements[0]?.expression?.type ===
        "CallExpression"
    ) {
      const callExpr = ast.declarations[0].body.statements[0].expression;
      if (callExpr.function.value === "print") {
        const strValue = callExpr.arguments[0].value;
        const strVar = this.emitStringLiteral(strValue);
        statements.push(...this.emitPrint(strVar));
      }
    }

    this.emitMainFunction(statements);
    return this.output.join("\n");
  }
}
