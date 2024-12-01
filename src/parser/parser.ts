import { Lexer } from "@/lexer/lexer.ts";
import { Token, TokenType } from "@/lexer/token.ts";
import {
  BlockStatement,
  CallExpression,
  Expression,
  ExpressionStatement,
  FunctionDeclaration,
  Identifier,
  Location,
  Parameter,
  Program,
  Statement,
  StringLiteral,
  TypeNode,
} from "./ast.ts";

export class Parser {
  private currentToken!: Token;
  private peekToken!: Token;
  private lexer: Lexer;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.nextToken();
    this.peekToken = this.lexer.nextToken();
    console.log("Initial current token:", this.currentToken);
    console.log("Initial peek token:", this.peekToken);
  }

  /**
   * Advances the parser to the next token
   */
  private nextToken(): void {
    this.currentToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
    console.log("Advanced - current:", this.currentToken);
    console.log("Advanced - peek:", this.peekToken);
  }

  /**
   * Returns current token's location for error reporting
   */
  private currentLocation(): Location {
    return {
      line: this.currentToken.line,
      column: this.currentToken.column,
    };
  }

  /**
   * Throws a parser error with location information
   */
  private throwError(message: string): never {
    throw new Error(
      `Parser error at line ${this.currentToken.line}, column ${this.currentToken.column}: ${message}`,
    );
  }

  /**
   * Check if current token is of expected type and advance
   */
  private expectToken(type: TokenType): Token {
    const token = this.currentToken;
    if (token.type !== type) {
      this.throwError(`Expected ${type}, got ${token.type}`);
    }
    this.nextToken();
    return token;
  }

  /**
   * Consume any semicolons
   */
  private consumeSemicolons(): void {
    while (this.currentToken.type === TokenType.SEMICOLON) {
      this.nextToken();
    }
  }

  /**
   * Parse a type node
   */
  private parseType(): TypeNode {
    const location = this.currentLocation();
    let typeType: "int" | "string" | "bool";

    switch (this.currentToken.type) {
      case TokenType.INT_TYPE:
        typeType = "int";
        break;
      case TokenType.STRING_TYPE:
        typeType = "string";
        break;
      case TokenType.BOOL_TYPE:
        typeType = "bool";
        break;
      default:
        this.throwError(`Expected type, got ${this.currentToken.type}`);
    }

    this.nextToken();
    return {
      type: "TypeNode",
      typeType,
      location,
    };
  }

  /**
   * Parse function parameters
   */
  private parseFunctionParameters(): Parameter[] {
    const parameters: Parameter[] = [];

    // No parameters case: ()
    if (this.currentToken.type === TokenType.RPAREN) {
      return parameters;
    }

    // Parse first parameter
    let param = this.parseParameter();
    parameters.push(param);

    // Parse additional parameters: ', parameter'*
    while (this.currentToken.type === TokenType.COMMA) {
      this.nextToken(); // consume comma
      param = this.parseParameter();
      parameters.push(param);
    }

    return parameters;
  }

  /**
   * Parse a single parameter
   */
  private parseParameter(): Parameter {
    const location = this.currentLocation();

    // Parse parameter name
    const name = this.expectToken(TokenType.IDENT).literal;

    // Parse parameter type
    const paramType = this.parseType();

    return {
      name,
      type: paramType,
      location,
    };
  }

  /**
   * Main entry point for parsing a program
   */
  public parseProgram(): Program {
    // Parse package declaration
    this.expectToken(TokenType.PACKAGE);
    const packageName = this.expectToken(TokenType.IDENT).literal;
    this.consumeSemicolons();

    const program: Program = {
      type: "Program",
      package: packageName,
      declarations: [],
      location: this.currentLocation(),
    };

    // Parse declarations
    while (this.currentToken.type !== TokenType.EOF) {
      if (this.currentToken.type === TokenType.FUNC) {
        const decl = this.parseFunctionDeclaration();
        program.declarations.push(decl);
      }
      this.consumeSemicolons();
    }

    return program;
  }

  /**
   * Parse a function declaration
   */
  private parseFunctionDeclaration(): FunctionDeclaration {
    const location = this.currentLocation();
    this.nextToken(); // consume 'func'

    const name = this.expectToken(TokenType.IDENT).literal;

    this.expectToken(TokenType.LPAREN);
    const parameters = this.parseFunctionParameters();
    this.expectToken(TokenType.RPAREN);

    let returnType: TypeNode | null = null;
    if (
      this.currentToken.type === TokenType.INT_TYPE ||
      this.currentToken.type === TokenType.STRING_TYPE ||
      this.currentToken.type === TokenType.BOOL_TYPE
    ) {
      returnType = this.parseType();
    }

    this.expectToken(TokenType.LBRACE);
    const body = this.parseBlockStatement();

    return {
      type: "FunctionDeclaration",
      name,
      parameters,
      returnType,
      body,
      location,
    };
  }

  /**
   * Parse a block statement
   */
  private parseBlockStatement(): BlockStatement {
    const statements: Statement[] = [];
    const location = this.currentLocation();

    while (
      this.currentToken.type !== TokenType.RBRACE &&
      this.currentToken.type !== TokenType.EOF
    ) {
      const stmt = this.parseStatement();
      statements.push(stmt);
      this.consumeSemicolons();
    }

    this.expectToken(TokenType.RBRACE);

    return {
      type: "BlockStatement",
      statements,
      location,
    };
  }

  /**
   * Parse a statement
   */
  private parseStatement(): Statement {
    switch (this.currentToken.type) {
      case TokenType.IDENT:
        return this.parseExpressionStatement();
      default:
        this.throwError(`Unexpected token ${this.currentToken.type}`);
    }
  }

  /**
   * Parse an expression statement
   */
  private parseExpressionStatement(): ExpressionStatement {
    const expression = this.parseExpression();

    return {
      type: "ExpressionStatement",
      expression,
      location: this.currentLocation(),
    };
  }

  /**
   * Parse an expression
   */
  private parseExpression(): Expression {
    if (this.currentToken.literal === "print") {
      return this.parseCallExpression();
    }
    this.throwError(`Unexpected expression token ${this.currentToken.type}`);
  }

  /**
   * Parse a function call
   */
  private parseCallExpression(): CallExpression {
    const func: Identifier = {
      type: "Identifier",
      value: this.currentToken.literal,
      location: this.currentLocation(),
    };

    this.nextToken(); // consume function name
    this.expectToken(TokenType.LPAREN);

    const args: Expression[] = [];

    if (this.currentToken.type === TokenType.STRING) {
      const strLit: StringLiteral = {
        type: "StringLiteral",
        value: this.currentToken.literal,
        location: this.currentLocation(),
      };
      args.push(strLit);
      this.nextToken();
    }

    this.expectToken(TokenType.RPAREN);

    return {
      type: "CallExpression",
      function: func,
      arguments: args,
      location: this.currentLocation(),
    };
  }
}
