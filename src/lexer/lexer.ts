import { lookupIdent, Token, TokenType } from "./token.ts";
import { LexicalError } from "@/common/errors.ts";

/**
 * Lexer class for PoorGo
 * Converts source code into a sequence of tokens
 */
export class Lexer {
  private input: string;
  private position = 0; // Current position in input (points to current char)
  private readPosition = 0; // Current reading position in input (after current char)
  private ch = ""; // Current char under examination
  private line = 1; // Current line number
  private column = 1; // Current column number
  private lastToken: Token | null = null; // Last token generated

  constructor(input: string) {
    this.input = input;
    this.readChar();
  }

  /**
   * Returns current character for debugging
   */
  public getCurrentChar(): string {
    return this.ch;
  }

  /**
   * Returns current location for error reporting
   */
  private currentLocation(): { line: number; column: number } {
    return {
      line: this.line,
      column: this.column,
    };
  }

  /**
   * Reads the next character and advances the position
   */
  private readChar(): void {
    if (this.readPosition >= this.input.length) {
      this.ch = "";
    } else {
      this.ch = this.input.charAt(this.readPosition);
    }
    this.position = this.readPosition;
    this.readPosition++;

    if (this.ch === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
  }

  /**
   * Skips whitespace and handles automatic semicolon insertion
   */
  private skipWhitespace(): Token | null {
    while (this.isWhitespace(this.ch)) {
      if (this.ch === "\n" && this.needsSemicolon()) {
        const token = this.createToken(TokenType.SEMICOLON, ";");
        this.readChar();
        return token;
      }
      this.readChar();
    }
    return null;
  }

  /**
   * Checks if automatic semicolon should be inserted
   */
  private needsSemicolon(): boolean {
    if (!this.lastToken) return false;
    return (
      this.lastToken.type === TokenType.IDENT ||
      this.lastToken.type === TokenType.STRING ||
      this.lastToken.type === TokenType.INT ||
      this.lastToken.type === TokenType.RPAREN ||
      this.lastToken.type === TokenType.RBRACE
    );
  }

  /**
   * Checks if character is whitespace
   */
  private isWhitespace(ch: string): boolean {
    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
  }

  /**
   * Reads an identifier from the input
   */
  private readIdentifier(): string {
    const position = this.position;
    while (this.isLetter(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  /**
   * Processes escape sequences in strings
   */
  private processEscapeSequence(): string {
    switch (this.ch) {
      case "n": return "\n";
      case "t": return "\t";
      case "r": return "\r";
      case "\\": return "\\";
      case '"': return '"';
      case "0": return "\0";
      default:
        throw new LexicalError(
          `Invalid escape sequence: \\${this.ch}`,
          this.currentLocation()
        );
    }
  }

  /**
   * Reads a string literal from the input with proper escape sequence handling
   */
  private readString(): string {
    this.readChar(); // Skip opening quote

    let result = "";
    while (this.ch !== '"' && this.ch !== "") {
      if (this.ch === "\\") {
        this.readChar(); // Skip backslash
        if (this.ch.length === 0) {
          throw new LexicalError(
            "Unterminated escape sequence in string literal",
            this.currentLocation()
          );
        }
        result += this.processEscapeSequence();
        this.readChar();
      } else {
        result += this.ch;
        this.readChar();
      }
    }

    if (this.ch !== '"') {
      throw new LexicalError(
        "Unterminated string literal",
        this.currentLocation()
      );
    }

    this.readChar(); // Skip closing quote
    return result;
  }

  /**
   * Reads a number from the input
   */
  private readNumber(): string {
    const position = this.position;
    while (this.isDigit(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  /**
   * Creates a token with the current position information
   */
  private createToken(type: TokenType, literal: string): Token {
    return {
      type,
      literal,
      line: this.line,
      column: this.column - literal.length,
    };
  }

  /**
   * Returns the next token in the input
   */
  public nextToken(): Token {
    const semiToken = this.skipWhitespace();
    if (semiToken) {
      this.lastToken = semiToken;
      return semiToken;
    }

    let token: Token;

    if (this.ch === "") {
      if (this.needsSemicolon()) {
        token = this.createToken(TokenType.SEMICOLON, ";");
        this.lastToken = token;
        return token;
      }
      token = this.createToken(TokenType.EOF, "");
      this.lastToken = token;
      return token;
    }

    switch (this.ch) {
      case '"':
        token = this.createToken(TokenType.STRING, this.readString());
        break;

      case "(":
        token = this.createToken(TokenType.LPAREN, "(");
        this.readChar();
        break;

      case ")":
        token = this.createToken(TokenType.RPAREN, ")");
        this.readChar();
        break;

      case "{":
        token = this.createToken(TokenType.LBRACE, "{");
        this.readChar();
        break;

      case "}":
        token = this.createToken(TokenType.RBRACE, "}");
        this.readChar();
        break;

      case "+":
        token = this.createToken(TokenType.PLUS, "+");
        this.readChar();
        break;

      case "-":
        token = this.createToken(TokenType.MINUS, "-");
        this.readChar();
        break;

      case "*":
        token = this.createToken(TokenType.ASTERISK, "*");
        this.readChar();
        break;

      case "/":
        token = this.createToken(TokenType.SLASH, "/");
        this.readChar();
        break;

      default:
        if (this.isDigit(this.ch)) {
          const literal = this.readNumber();
          token = this.createToken(TokenType.INT, literal);
        } else if (this.isLetter(this.ch)) {
          const literal = this.readIdentifier();
          token = this.createToken(lookupIdent(literal), literal);
        } else {
          token = this.createToken(TokenType.ILLEGAL, this.ch);
          this.readChar();
        }
        break;
    }

    this.lastToken = token;
    return token;
  }

  /**
   * Checks if a character is a letter or underscore
   */
  private isLetter(ch: string): boolean {
    return /[a-zA-Z_]/.test(ch);
  }

  /**
   * Checks if a character is a digit
   */
  private isDigit(ch: string): boolean {
    return /[0-9]/.test(ch);
  }

  /**
   * Scans all tokens in the input
   */
  public scan(): Token[] {
    const tokens: Token[] = [];
    let token: Token;

    do {
      token = this.nextToken();
      tokens.push(token);
    } while (token.type !== TokenType.EOF);

    return tokens;
  }
}
