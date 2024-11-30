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
} from "@/parser/ast.ts";

export class Parser {
  private lexer: Lexer;
  private currentToken!: Token;
  private peekToken!: Token;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    // To fill in current / peer tokens
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

  // private expectPeek(type: TokenType): void {
  //   if (!this.checkToken(this.peekToken, type)) {
  //     this.throwError(
  //       `Expected next token to be '${type}', got '${this.peekToken.type}' instead`,
  //     );
  //   }
  //   this.nextToken();
  // }

  private parseFunctionDeclaration(): FunctionDeclaration {
    const location = this.currentLocation();
    this.nextToken(); // consume 'func'

    // Parse function name
    if (!this.checkToken(this.currentToken, TokenType.IDENT)) {
      this.throwError("Expected function name");
    }
    const name = this.currentToken.literal;
    this.nextToken();

    // Parse parameters
    if (!this.checkToken(this.currentToken, TokenType.LPAREN)) {
      this.throwError("Expected '(' after function name");
    }
    const parameters = this.parseFunctionParameters();

    // Parse return type (optional)
    const returnType = this.parseOptionalType();

    // Parse function body
    if (!this.checkToken(this.currentToken, TokenType.LBRACE)) {
      this.throwError("Expected '{' after function declaration");
    }

    return {
      type: "FunctionDeclaration",
      name,
      parameters,
      returnType,
      body: this.parseBlock(),
      location,
    };
  }

  private parseFunctionParameters(): Parameter[] {
    const parameters: Parameter[] = [];

    this.nextToken(); // consume '('

    while (!this.checkToken(this.currentToken, TokenType.RPAREN)) {
      if (!this.checkToken(this.currentToken, TokenType.IDENT)) {
        this.throwError("Expected parameter name");
      }

      const paramName = this.currentToken.literal;
      const paramLocation = this.currentLocation();
      this.nextToken();

      // Parse parameter type
      if (
        !this.checkToken(this.currentToken, TokenType.INT_TYPE) &&
        !this.checkToken(this.currentToken, TokenType.STRING_TYPE) &&
        !this.checkToken(this.currentToken, TokenType.BOOL_TYPE)
      ) {
        this.throwError("Expected parameter type");
      }

      // Map token type to TypeNode typeType
      const typeType = ((): "int" | "string" | "bool" => {
        switch (this.currentToken.literal) {
          case "int":
            return "int";
          case "string":
            return "string";
          case "bool":
            return "bool";
          default:
            this.throwError("Invalid type");
            return "int"; // unreachable
        }
      })();

      parameters.push({
        name: paramName,
        type: {
          type: "TypeNode",
          typeType,
          location: this.currentLocation(),
        },
        location: paramLocation,
      });

      this.nextToken();

      if (this.checkToken(this.currentToken, TokenType.COMMA)) {
        this.nextToken();
      }
    }

    this.nextToken(); // consume ')'
    return parameters;
  }

  private parseOptionalType(): TypeNode | null {
    if (
      this.checkToken(this.currentToken, TokenType.INT_TYPE) ||
      this.checkToken(this.currentToken, TokenType.STRING_TYPE) ||
      this.checkToken(this.currentToken, TokenType.BOOL_TYPE)
    ) {
      const typeType = ((): "int" | "string" | "bool" => {
        switch (this.currentToken.literal) {
          case "int":
            return "int";
          case "string":
            return "string";
          case "bool":
            return "bool";
          default:
            this.throwError("Invalid type");
            return "int"; // unreachable
        }
      })();

      const typeNode: TypeNode = {
        type: "TypeNode",
        typeType,
        location: this.currentLocation(),
      };
      this.nextToken();
      return typeNode;
    }
    return null;
  }

  private parseBlock(): BlockStatement {
    const block: BlockStatement = {
      type: "BlockStatement",
      statements: [],
      location: this.currentLocation(),
    };

    this.nextToken(); // consume '{'

    while (
      !this.checkToken(this.currentToken, TokenType.RBRACE) &&
      !this.checkToken(this.currentToken, TokenType.EOF)
    ) {
      const stmt = this.parseStatement();
      if (stmt) {
        block.statements.push(stmt);
      }
      this.nextToken();
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

    this.nextToken(); // consume function name

    if (!this.checkToken(this.currentToken, TokenType.LPAREN)) {
      this.throwError("Expected '(' after function name");
    }

    this.nextToken(); // consume '('

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
      this.nextToken(); // consume ')'
      return args;
    }

    if (this.checkToken(this.currentToken, TokenType.STRING)) {
      const strLit: StringLiteral = {
        type: "StringLiteral",
        value: this.currentToken.literal,
        location: this.currentLocation(),
      };
      args.push(strLit);

      this.nextToken(); // consume string literal
    } else {
      this.throwError(`Unexpected argument token ${this.currentToken.type}`);
    }

    if (!this.checkToken(this.currentToken, TokenType.RPAREN)) {
      this.throwError(
        `Expected ')' after argument, got ${this.currentToken.type}`,
      );
    }
    this.nextToken(); // consume ')'

    return args;
  }

  // private logToken(prefix: string) {
  //   console.log(`${prefix}: {
  //     type: ${this.currentToken.type},
  //     literal: "${this.currentToken.literal}",
  //     line: ${this.currentToken.line},
  //     column: ${this.currentToken.column}
  //   }`);
  // }

  // private parseCallArgument(): Expression {
  //   switch (this.currentToken.type) {
  //     // deno-lint-ignore no-case-declarations
  //     case TokenType.STRING:
  //       const strLit: StringLiteral = {
  //         type: "StringLiteral",
  //         value: this.currentToken.literal,
  //         location: this.currentLocation(),
  //       };
  //       return strLit;
  //     default:
  //       this.throwError(`Unexpected argument token ${this.currentToken.type}`);
  //   }
  // }

  // private parseStringLiteral(): StringLiteral {
  //   return {
  //     type: "StringLiteral",
  //     value: this.currentToken.literal,
  //     location: this.currentLocation(),
  //   };
  // }

  public parseProgram(): Program {
    // Parse package declaration
    if (!this.checkToken(this.currentToken, TokenType.PACKAGE)) {
      this.throwError("Program must start with 'package' keyword");
    }
    this.nextToken();

    // Package name should be an identifier
    if (!this.checkToken(this.currentToken, TokenType.IDENT)) {
      this.throwError("Expected package name");
    }
    const packageName = this.currentToken.literal;
    this.nextToken();

    const program: Program = {
      type: "Program",
      package: packageName,
      declarations: [],
      location: this.currentLocation(),
    };

    // Parse function declarations or block
    if (this.checkToken(this.currentToken, TokenType.FUNC)) {
      // Explicit function declaration
      const funcDecl = this.parseFunctionDeclaration();
      program.declarations.push(funcDecl);
    } else if (!this.checkToken(this.currentToken, TokenType.LBRACE)) {
      this.throwError("Expected '{' after package declaration");
    } else {
      // Implicit main function
      const mainFunction: FunctionDeclaration = {
        type: "FunctionDeclaration",
        name: "main",
        parameters: [],
        returnType: null,
        body: this.parseBlock(),
        location: this.currentLocation(),
      };
      program.declarations.push(mainFunction);
    }

    return program;
  }
}
