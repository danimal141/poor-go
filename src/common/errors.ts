import { Location } from "@/parser/ast.ts";

/**
 * Base class for all compiler errors
 */
export abstract class CompilerError extends Error {
  constructor(
    message: string,
    public readonly location: Location,
    public readonly phase: 'lexical' | 'syntax' | 'semantic' | 'codegen'
  ) {
    super(`${phase} error at line ${location.line}, column ${location.column}: ${message}`);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, CompilerError.prototype);
  }
}

/**
 * Lexical analysis errors
 */
export class LexicalError extends CompilerError {
  constructor(message: string, location: Location) {
    super(message, location, 'lexical');
    Object.setPrototypeOf(this, LexicalError.prototype);
  }
}

/**
 * Syntax analysis errors
 */
export class SyntaxError extends CompilerError {
  constructor(message: string, location: Location) {
    super(message, location, 'syntax');
    Object.setPrototypeOf(this, SyntaxError.prototype);
  }
}

/**
 * Semantic analysis errors
 */
export class SemanticError extends CompilerError {
  constructor(message: string, location: Location) {
    super(message, location, 'semantic');
    Object.setPrototypeOf(this, SemanticError.prototype);
  }
}

/**
 * Code generation errors
 */
export class CodegenError extends CompilerError {
  constructor(message: string, location: Location) {
    super(message, location, 'codegen');
    Object.setPrototypeOf(this, CodegenError.prototype);
  }
}

/**
 * Error collector for gathering multiple errors during compilation
 */
export class ErrorCollector {
  private errors: CompilerError[] = [];

  add(error: CompilerError): void {
    this.errors.push(error);
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): CompilerError[] {
    return [...this.errors];
  }

  clear(): void {
    this.errors = [];
  }

  /**
   * Throws the first error if any exist
   */
  throwIfErrors(): void {
    if (this.hasErrors()) {
      throw this.errors[0];
    }
  }

  /**
   * Returns a formatted error report
   */
  getErrorReport(): string {
    if (!this.hasErrors()) {
      return "No errors";
    }

    return this.errors
      .map((error, index) => `${index + 1}. ${error.message}`)
      .join('\n');
  }
}
