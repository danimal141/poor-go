import { Lexer } from "@/lexer/lexer.ts";
import { Token, TokenType } from "@/lexer/token.ts";
import {
  BlockStatement,
  BooleanLiteral,
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
    // console.log("Initial current token:", this.currentToken);
    // console.log("Initial peek token:", this.peekToken);
  }

  /**
   * Advances the parser to the next token
   */
  private nextToken(): void {
    this.currentToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
    // console.log("Advanced - current:", this.currentToken);
    // console.log("Advanced - peek:", this.peekToken);
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
   * Parse function declaration
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
      case TokenType.RETURN:
        return this.parseReturnStatement();
      default:
        this.throwError(`Unexpected token ${this.currentToken.type}`);
    }
  }

  /**
   * Parse return statement
   */
  private parseReturnStatement(): Statement {
    const location = this.currentLocation();
    this.nextToken(); // consume 'return'

    const returnValue = this.parseExpression();

    if (this.currentToken.type === TokenType.SEMICOLON) {
      this.nextToken(); // consume semicolon
    }

    return {
      type: "ReturnStatement",
      returnValue,
      location,
    };
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
   * Parse a function call
   */
  private parseCallExpression(): CallExpression {
    const location = this.currentLocation();
    const func: Identifier = {
      type: "Identifier",
      value: this.currentToken.literal,
      location,
    };

    this.nextToken(); // consume function name
    this.expectToken(TokenType.LPAREN);

    const args: Expression[] = [];
    if (this.currentToken.type !== TokenType.RPAREN) {
      args.push(this.parseExpression());

      while (this.currentToken.type === TokenType.COMMA) {
        this.nextToken();
        args.push(this.parseExpression());
      }
    }

    this.expectToken(TokenType.RPAREN);

    return {
      type: "CallExpression",
      function: func,
      arguments: args,
      location,
    };
  }

  /**
   * Parse an expression
   */
  private parseExpression(): Expression {
    if (this.currentToken.literal === "print") {
      return this.parseCallExpression();
    }
    return this.parseAdditive();
  }

  /**
   * Parse additive expression (e.g. a + b, a - b)
   */
  private parseAdditive(): Expression {
    let left = this.parseMultiplicative();

    while (
      this.currentToken.type === TokenType.PLUS ||
      this.currentToken.type === TokenType.MINUS
    ) {
      const operator = this.currentToken.literal;
      this.nextToken(); // consume operator
      const right = this.parseMultiplicative();

      left = {
        type: "InfixExpression",
        operator,
        left,
        right,
        location: this.currentLocation(),
      };
    }

    return left;
  }

  /**
   * Parse multiplicative expression (e.g. a * b, a / b)
   */
  private parseMultiplicative(): Expression {
    let left = this.parsePrimary();

    while (
      this.currentToken.type === TokenType.ASTERISK ||
      this.currentToken.type === TokenType.SLASH
    ) {
      const operator = this.currentToken.literal;
      this.nextToken(); // consume operator
      const right = this.parsePrimary();

      left = {
        type: "InfixExpression",
        operator,
        left,
        right,
        location: this.currentLocation(),
      };
    }

    return left;
  }

  /**
   * Parse expression with parentheses
   */
  private parsePrimary(): Expression {
    const location = this.currentLocation();

    switch (this.currentToken.type) {
      case TokenType.LPAREN: {
        this.nextToken(); // consume '('
        const expr = this.parseExpression();
        this.expectToken(TokenType.RPAREN); // consume ')'
        return expr;
      }
      case TokenType.INT: {
        const value = parseInt(this.currentToken.literal, 10);
        this.nextToken();
        return {
          type: "IntegerLiteral",
          value,
          location,
        };
      }
      case TokenType.STRING: {
        const strLit: StringLiteral = {
          type: "StringLiteral",
          value: this.currentToken.literal,
          location,
        };
        this.nextToken();
        return strLit;
      }
      case TokenType.TRUE:
      case TokenType.FALSE: {
        const boolLit: BooleanLiteral = {
          type: "BooleanLiteral",
          value: this.currentToken.type === TokenType.TRUE,
          location,
        };
        this.nextToken();
        return boolLit;
      }
      case TokenType.IDENT: {
        if (this.currentToken.literal === "print") {
          return this.parseCallExpression();
        }
        const ident: Identifier = {
          type: "Identifier",
          value: this.currentToken.literal,
          location,
        };
        this.nextToken();
        return ident;
      }
      default:
        this.throwError(`Unexpected token ${this.currentToken.type}`);
    }
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
}
