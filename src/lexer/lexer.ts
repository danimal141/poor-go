// Reference: https://github.com/golang/go/blob/go1.23.0/src/text/scanner/scanner.go

import { lookupIdent, Token, TokenType } from "./token.ts";

/**
 * Lexer transforms input strings into a sequence of tokens.
 * For example, the input "x = 5 + 10;" is transformed into:
 * IDENT("x") -> ASSIGN("=") -> INT("5") -> PLUS("+") -> INT("10") -> SEMICOLON(";")
 */
export class Lexer {
  // Source input being tokenized
  private input: string;

  // State management for tokenization
  private position = 0; // Points to current character position
  private readPosition = 0; // Points to next character position
  private ch = ""; // Current character under examination

  // Location tracking for error reporting
  private line = 1; // Current line number
  private column = 0; // Current column number

  constructor(input: string) {
    this.input = input;
    this.readChar(); // Initialize the first character
  }

  /**
   * Advances the lexer's position and reads the next character.
   * Also manages line and column numbers for error reporting.
   */
  private readChar(): void {
    if (this.readPosition >= this.input.length) {
      this.ch = ""; // End of input
    } else {
      this.ch = this.input.charAt(this.readPosition); // Use charAt() for type safety
    }

    this.position = this.readPosition;
    this.readPosition += 1;

    // Update line and column numbers
    if (this.ch === "\n") {
      this.line += 1;
      this.column = 0;
    } else {
      this.column += 1;
    }
  }

  /**
   * Looks at the next character without advancing the lexer's position.
   * Used for handling two-character tokens like '==', '!=', etc.
   */
  private peekChar(): string {
    if (this.readPosition >= this.input.length) {
      return "";
    }
    return this.input.charAt(this.readPosition);
  }

  /**
   * Advances the lexer's position past any whitespace characters.
   */
  private skipWhitespace(): void {
    while (
      this.ch === " " || this.ch === "\t" || this.ch === "\n" ||
      this.ch === "\r"
    ) {
      this.readChar();
    }
  }

  /**
   * Reads a sequence of characters that form an identifier.
   * Identifiers start with a letter and can contain letters and underscores.
   */
  private readIdentifier(): string {
    const position = this.position;
    while (this.isLetter(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  /**
   * Reads a sequence of digits that form a number.
   */
  private readNumber(): string {
    const position = this.position;
    while (this.isDigit(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  /**
   * Main interface of the Lexer.
   * Returns the next token from the input.
   * When it reaches the end of input, it returns EOF token.
   */
  public nextToken(): Token {
    this.skipWhitespace();

    // Initialize token with current position information
    const token: Token = {
      type: TokenType.ILLEGAL,
      literal: this.ch,
      line: this.line,
      column: this.column,
    };

    // Process current character and determine token type
    switch (this.ch) {
      case "=":
        if (this.peekChar() === "=") {
          // Handle two-character token '=='
          const ch = this.ch;
          this.readChar();
          token.type = TokenType.EQ;
          token.literal = ch + this.ch;
        } else {
          // Single character assignment token
          token.type = TokenType.ASSIGN;
          token.literal = this.ch;
        }
        break;
      case "!":
        if (this.peekChar() === "=") {
          // Handle two-character token '!='
          const ch = this.ch;
          this.readChar();
          token.type = TokenType.NOT_EQ;
          token.literal = ch + this.ch;
        } else {
          token.type = TokenType.BANG;
          token.literal = this.ch;
        }
        break;
      case "<":
        if (this.peekChar() === "=") {
          // Handle two-character token '<='
          const ch = this.ch;
          this.readChar();
          token.type = TokenType.LTE;
          token.literal = ch + this.ch;
        } else {
          token.type = TokenType.LT;
          token.literal = this.ch;
        }
        break;
      case ">":
        if (this.peekChar() === "=") {
          // Handle two-character token '>='
          const ch = this.ch;
          this.readChar();
          token.type = TokenType.GTE;
          token.literal = ch + this.ch;
        } else {
          token.type = TokenType.GT;
          token.literal = this.ch;
        }
        break;
      case "+":
        token.type = TokenType.PLUS;
        token.literal = this.ch;
        break;
      case "-":
        token.type = TokenType.MINUS;
        token.literal = this.ch;
        break;
      case "/":
        token.type = TokenType.SLASH;
        token.literal = this.ch;
        break;
      case "*":
        token.type = TokenType.ASTERISK;
        token.literal = this.ch;
        break;
      // Single character tokens
      case ";":
        token.type = TokenType.SEMICOLON;
        token.literal = this.ch;
        break;
      case ":":
        token.type = TokenType.COLON;
        token.literal = this.ch;
        break;
      case "(":
        token.type = TokenType.LPAREN;
        token.literal = this.ch;
        break;
      case ")":
        token.type = TokenType.RPAREN;
        token.literal = this.ch;
        break;
      case ",":
        token.type = TokenType.COMMA;
        token.literal = this.ch;
        break;
      case "{":
        token.type = TokenType.LBRACE;
        token.literal = this.ch;
        break;
      case "}":
        token.type = TokenType.RBRACE;
        token.literal = this.ch;
        break;
      case "":
        token.type = TokenType.EOF;
        token.literal = "";
        break;
      default:
        if (this.isLetter(this.ch)) {
          // Handle identifiers and keywords
          token.literal = this.readIdentifier();
          token.type = lookupIdent(token.literal); // Check if it's a keyword
          return token; // Early return as readIdentifier has already advanced the position
        } else if (this.isDigit(this.ch)) {
          // Handle integer literals
          token.type = TokenType.INT;
          token.literal = this.readNumber();
          return token; // Early return as readNumber has already advanced the position
        } else {
          // Unknown character
          token.type = TokenType.ILLEGAL;
          token.literal = this.ch;
        }
    }

    this.readChar(); // Advance to next character
    return token;
  }

  /**
   * Checks if a character is a letter or underscore.
   * Used for identifying the start and continuation of identifiers.
   */
  private isLetter(ch: string): boolean {
    return /[a-zA-Z_]/.test(ch);
  }

  /**
   * Checks if a character is a digit.
   * Used for identifying numeric literals.
   */
  private isDigit(ch: string): boolean {
    return /[0-9]/.test(ch);
  }
}
