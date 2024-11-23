// src/lexer/token.ts

export enum TokenType {
  // Special tokens
  ILLEGAL = "ILLEGAL",  // Unknown characters
  EOF = "EOF",         // End of file

  // Identifiers + literals
  IDENT = "IDENT",     // add, foobar, x, y, ...
  INT = "INT",         // 123456
  STRING = "STRING",   // "hello world"

  // Operators
  ASSIGN = "=",
  PLUS = "+",
  MINUS = "-",
  BANG = "!",
  ASTERISK = "*",
  SLASH = "/",

  // Comparison operators
  EQ = "==",
  NOT_EQ = "!=",
  LT = "<",
  GT = ">",
  LTE = "<=",
  GTE = ">=",

  // Delimiters
  COMMA = ",",
  SEMICOLON = ";",
  COLON = ":",

  LPAREN = "(",
  RPAREN = ")",
  LBRACE = "{",
  RBRACE = "}",

  // Keywords
  FUNC = "FUNC",
  RETURN = "RETURN",
  IF = "IF",
  ELSE = "ELSE",
  FOR = "FOR",
  VAR = "VAR",

  INT_TYPE = "INT_TYPE",
  STRING_TYPE = "STRING_TYPE",
  BOOL_TYPE = "BOOL_TYPE",

  TRUE = "TRUE",
  FALSE = "FALSE",

  PACKAGE = "PACKAGE",
}

export interface Token {
  type: TokenType;     // Type of the token
  literal: string;     // Actual string value
  line: number;        // Line number in source
  column: number;      // Column number in source
}

// Keyword map
export const KEYWORDS = new Map<string, TokenType>([
  ["func", TokenType.FUNC],
  ["return", TokenType.RETURN],
  ["if", TokenType.IF],
  ["else", TokenType.ELSE],
  ["for", TokenType.FOR],
  ["var", TokenType.VAR],
  ["int", TokenType.INT_TYPE],
  ["string", TokenType.STRING_TYPE],
  ["bool", TokenType.BOOL_TYPE],
  ["true", TokenType.TRUE],
  ["false", TokenType.FALSE],
  ["package", TokenType.PACKAGE],
]);

// Check if the identifier is a keyword
export function lookupIdent(ident: string): TokenType {
  return KEYWORDS.get(ident) || TokenType.IDENT;
}
