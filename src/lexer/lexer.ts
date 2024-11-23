import { lookupIdent, Token, TokenType } from "./token.ts";

export class Lexer {
  private input: string; // input source code
  private position: number; // current position in input (points to current char)
  private readPosition: number; // current reading position in input (after current char)
  private ch: string; // current char under examination
  private line: number; // current line number
  private column: number; // current column number

  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.readPosition = 0;
    this.ch = "";
    this.line = 1;
    this.column = 0;

    this.readChar(); // Initialize the first character
  }

  // Read next character and advance our position in the input string
  private readChar(): void {
    if (this.readPosition >= this.input.length) {
      this.ch = "\0";
    } else {
      this.ch = this.input.charAt(this.readPosition);
    }

    // Update positions
    this.position = this.readPosition;
    this.readPosition++;

    // Update line and column
    if (this.ch === "\n") {
      this.line++;
      this.column = 0; // Reset column at newline
    } else {
      this.column = this.position + 1; // Make column 1-based
    }
  }

  // Peek at next character without advancing position
  private peekChar(): string {
    if (this.readPosition >= this.input.length) {
      return "\0";
    }
    return this.input.charAt(this.readPosition);
  }

  // Skip whitespace
  private skipWhitespace(): void {
    while (
      this.ch === " " ||
      this.ch === "\t" ||
      this.ch === "\n" ||
      this.ch === "\r"
    ) {
      this.readChar();
    }
  }

  // Read an identifier (variable name, keywords, etc)
  private readIdentifier(): string {
    const position = this.position;
    while (isLetter(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  // Read a number
  private readNumber(): string {
    const position = this.position;

    while (isDigit(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  // Get the next token
  public nextToken(): Token {
    this.skipWhitespace();

    const makeToken = (
      type: TokenType,
      literal: string,
      advanceChar = true,
    ): Token => {
      if (advanceChar) {
        this.readChar();
      }
      return {
        type,
        literal,
        line: this.line,
        column: this.column,
      };
    };

    switch (this.ch) {
      case "=":
        if (this.peekChar() === "=") {
          this.readChar();
          return makeToken(TokenType.EQ, "==");
        }
        return makeToken(TokenType.ASSIGN, "=");

      case "+":
        return makeToken(TokenType.PLUS, "+");
      case "-":
        return makeToken(TokenType.MINUS, "-");
      case "*":
        return makeToken(TokenType.ASTERISK, "*");
      case "/":
        return makeToken(TokenType.SLASH, "/");
      case "!":
        if (this.peekChar() === "=") {
          this.readChar();
          return makeToken(TokenType.NOT_EQ, "!=");
        }
        return makeToken(TokenType.BANG, "!");

      case "<":
        if (this.peekChar() === "=") {
          this.readChar();
          return makeToken(TokenType.LTE, "<=");
        }
        return makeToken(TokenType.LT, "<");

      case ">":
        if (this.peekChar() === "=") {
          this.readChar();
          return makeToken(TokenType.GTE, ">=");
        }
        return makeToken(TokenType.GT, ">");

      case ";":
        return makeToken(TokenType.SEMICOLON, ";");
      case ":":
        return makeToken(TokenType.COLON, ":");
      case ",":
        return makeToken(TokenType.COMMA, ",");
      case "(":
        return makeToken(TokenType.LPAREN, "(");
      case ")":
        return makeToken(TokenType.RPAREN, ")");
      case "{":
        return makeToken(TokenType.LBRACE, "{");
      case "}":
        return makeToken(TokenType.RBRACE, "}");
      case "\0":
        return makeToken(TokenType.EOF, "", false);

      default:
        if (isLetter(this.ch)) {
          const literal = this.readIdentifier();
          return makeToken(lookupIdent(literal), literal, false);
        }
        if (isDigit(this.ch)) {
          const literal = this.readNumber();
          return makeToken(TokenType.INT, literal, false);
        }
        return makeToken(TokenType.ILLEGAL, this.ch);
    }
  }
}

// Helper functions
function isLetter(ch: string): boolean {
  return /[a-zA-Z_]/.test(ch);
}

function isDigit(ch: string): boolean {
  return /[0-9]/.test(ch);
}
