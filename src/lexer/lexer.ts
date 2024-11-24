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
      this.ch = this.input.charAt(this.readPosition);
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
      this.ch === " " ||
      this.ch === "\t" ||
      this.ch === "\n" ||
      this.ch === "\r"
    ) {
      this.readChar();
    }
  }

  /**
   * Skips a single-line comment.
   */
  private skipSingleLineComment(): void {
    while (this.ch !== "\n" && this.ch !== "") {
      this.readChar();
    }
  }

  /**
   * Skips a multi-line comment.
   * Returns true if the comment was properly terminated, false otherwise.
   */
  private skipMultiLineComment(): boolean {
    this.readChar(); // consume the current "/"
    this.readChar(); // consume the "*"

    while (true) {
      if (this.ch === "") {
        return false; // Unterminated comment
      }
      if (this.ch === "*" && this.peekChar() === "/") {
        this.readChar(); // consume the "*"
        this.readChar(); // consume the "/"
        return true;
      }
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
   * Reads a string literal, handling escape sequences.
   * String literals are enclosed in double quotes.
   */
  private readString(): string {
    const position = this.position + 1; // Skip the opening quote
    this.readChar(); // Consume the opening quote

    while (this.ch !== '"' && this.ch !== "" && this.ch !== "\n") {
      this.readChar();
    }

    const str = this.input.slice(position, this.position);
    if (this.ch === '"') {
      this.readChar(); // Consume the closing quote
      return str;
    }

    return str; // String was not properly terminated
  }

  /**
   * Main interface of the Lexer.
   * Returns the next token from the input.
   */
  public nextToken(): Token {
    this.skipWhitespace();

    const token: Token = {
      type: TokenType.ILLEGAL,
      literal: this.ch,
      line: this.line,
      column: this.column,
    };

    switch (this.ch) {
      case "=":
        if (this.peekChar() === "=") {
          this.readChar();
          token.type = TokenType.EQ;
          token.literal = "==";
        } else {
          token.type = TokenType.ASSIGN;
          token.literal = "=";
        }
        break;

      case "!":
        if (this.peekChar() === "=") {
          this.readChar();
          token.type = TokenType.NOT_EQ;
          token.literal = "!=";
        } else {
          token.type = TokenType.BANG;
          token.literal = "!";
        }
        break;

      case "<":
        if (this.peekChar() === "=") {
          this.readChar();
          token.type = TokenType.LTE;
          token.literal = "<=";
        } else {
          token.type = TokenType.LT;
          token.literal = "<";
        }
        break;

      case ">":
        if (this.peekChar() === "=") {
          this.readChar();
          token.type = TokenType.GTE;
          token.literal = ">=";
        } else {
          token.type = TokenType.GT;
          token.literal = ">";
        }
        break;

      case "/":
        if (this.peekChar() === "/") {
          this.skipSingleLineComment();
          return this.nextToken();
        } else if (this.peekChar() === "*") {
          if (!this.skipMultiLineComment()) {
            token.type = TokenType.ILLEGAL;
            token.literal = "Unterminated multi-line comment";
            return token;
          }
          return this.nextToken();
        } else {
          token.type = TokenType.SLASH;
          token.literal = "/";
        }
        break;

      case '"':
        token.type = TokenType.STRING;
        token.literal = this.readString();
        return token;

      case "+":
        token.type = TokenType.PLUS;
        token.literal = "+";
        break;

      case "-":
        token.type = TokenType.MINUS;
        token.literal = "-";
        break;

      case "*":
        token.type = TokenType.ASTERISK;
        token.literal = "*";
        break;

      case ";":
        token.type = TokenType.SEMICOLON;
        token.literal = ";";
        break;

      case ":":
        token.type = TokenType.COLON;
        token.literal = ":";
        break;

      case "(":
        token.type = TokenType.LPAREN;
        token.literal = "(";
        break;

      case ")":
        token.type = TokenType.RPAREN;
        token.literal = ")";
        break;

      case ",":
        token.type = TokenType.COMMA;
        token.literal = ",";
        break;

      case "{":
        token.type = TokenType.LBRACE;
        token.literal = "{";
        break;

      case "}":
        token.type = TokenType.RBRACE;
        token.literal = "}";
        break;

      case "":
        token.type = TokenType.EOF;
        token.literal = "";
        break;

      default:
        if (this.isLetter(this.ch)) {
          token.literal = this.readIdentifier();
          token.type = lookupIdent(token.literal);
          return token;
        } else if (this.isDigit(this.ch)) {
          token.type = TokenType.INT;
          token.literal = this.readNumber();
          return token;
        } else {
          token.type = TokenType.ILLEGAL;
          token.literal = this.ch;
        }
    }

    this.readChar();
    return token;
  }

  /**
   * Returns all tokens from the input.
   * Continues scanning until it reaches EOF token.
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

  /**
   * Checks if a character is a letter or underscore.
   */
  private isLetter(ch: string): boolean {
    return /[a-zA-Z_]/.test(ch);
  }

  /**
   * Checks if a character is a digit.
   */
  private isDigit(ch: string): boolean {
    return /[0-9]/.test(ch);
  }
}
