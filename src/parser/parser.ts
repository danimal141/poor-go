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
  Program,
  Statement,
  StringLiteral,
} from "@/parser/ast.ts";

export class Parser {
  private lexer: Lexer;
  private currentToken!: Token;
  private peekToken!: Token;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    // to fill in currentToken and peerToken
    this.nextToken();
    this.nextToken();
  }

  private nextToken(): void {
    this.currentToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  private currentLocation(): Location {
    return {
      line: this.currentToken.line,
      column: this.currentToken.column,
    };
  }

  private throwError(message: string): never {
    throw new Error(
      `Parser error at line ${this.currentToken.line}, column ${this.currentToken.column}: ${message}`,
    );
  }

  private checkToken(token: Token, type: TokenType): boolean {
    return token.type === type;
  }

  private expectPeek(type: TokenType): void {
    if (!this.checkToken(this.peekToken, type)) {
      this.throwError(
        `Expected next token to be '${type}', got '${this.peekToken.type}' instead`,
      );
    }
    this.nextToken();
  }

  parseProgram(): Program {
    if (!this.checkToken(this.currentToken, TokenType.PACKAGE)) {
      this.throwError("Program must start with 'package' keyword");
    }

    this.nextToken();

    if (this.currentToken.literal !== "main") {
      this.throwError("Package name must be 'main'");
    }

    const program: Program = {
      type: "Program",
      package: "main",
      declarations: [],
      location: this.currentLocation(),
    };

    // Move to next token after 'main'
    this.nextToken();

    // Now we expect a '{'
    if (!this.checkToken(this.currentToken, TokenType.LBRACE)) {
      this.throwError("Expected '{' after package declaration");
    }

    const mainFunction: FunctionDeclaration = {
      type: "FunctionDeclaration",
      name: "main",
      parameters: [],
      returnType: null,
      body: this.parseBlock(),
      location: this.currentLocation(),
    };

    program.declarations.push(mainFunction);
    return program;
  }

  private parseBlock(): BlockStatement {
    const block: BlockStatement = {
      type: "BlockStatement",
      statements: [],
      location: this.currentLocation(),
    };

    this.nextToken();

    while (
      !this.checkToken(this.currentToken, TokenType.RBRACE) &&
      !this.checkToken(this.currentToken, TokenType.EOF)
    ) {
      const stmt = this.parseStatement();
      block.statements.push(stmt);
      this.nextToken();
    }

    if (!this.checkToken(this.currentToken, TokenType.RBRACE)) {
      this.throwError("Expected '}'");
    }

    return block;
  }

  private parseStatement(): Statement {
    if (this.currentToken.literal === "print") {
      return this.parseExpressionStatement();
    }
    this.throwError(`Unexpected token ${this.currentToken.type}`);
  }

  private parseExpressionStatement(): ExpressionStatement {
    const stmt: ExpressionStatement = {
      type: "ExpressionStatement",
      expression: this.parseExpression(),
      location: this.currentLocation(),
    };

    if (this.checkToken(this.peekToken, TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return stmt;
  }

  private parseExpression(): Expression {
    if (this.currentToken.literal === "print") {
      return this.parseCallExpression();
    }
    this.throwError(`Unexpected expression token ${this.currentToken.type}`);
  }

  private parseCallExpression(): CallExpression {
    const func: Identifier = {
      type: "Identifier",
      value: this.currentToken.literal,
      location: this.currentLocation(),
    };

    this.nextToken();
    if (!this.checkToken(this.currentToken, TokenType.LPAREN)) {
      this.throwError("Expected '(' after function name");
    }

    this.nextToken();
    const args = this.parseCallArguments();

    return {
      type: "CallExpression",
      function: func,
      arguments: args,
      location: this.currentLocation(),
    };
  }

  private parseCallArguments(): Expression[] {
    const args: Expression[] = [];

    if (this.checkToken(this.currentToken, TokenType.RPAREN)) {
      return args;
    }

    if (this.checkToken(this.currentToken, TokenType.STRING)) {
      args.push(this.parseCallArgument());

      while (this.checkToken(this.peekToken, TokenType.COMMA)) {
        this.nextToken();
        this.nextToken();
        args.push(this.parseCallArgument());
      }
    }

    this.expectPeek(TokenType.RPAREN);
    return args;
  }

  private parseCallArgument(): Expression {
    if (this.checkToken(this.currentToken, TokenType.STRING)) {
      return this.parseStringLiteral();
    }
    this.throwError(`Unexpected argument token ${this.currentToken.type}`);
  }

  private parseStringLiteral(): StringLiteral {
    return {
      type: "StringLiteral",
      value: this.currentToken.literal,
      location: this.currentLocation(),
    };
  }
}