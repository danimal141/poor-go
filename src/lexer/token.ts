// Update src/lexer/token.ts
export const TokenType = {
  // Special tokens
  ILLEGAL: "ILLEGAL",
  EOF: "EOF",

  // Identifiers + literals
  IDENT: "IDENT",
  INT: "INT",
  STRING: "STRING",

  // Operators
  ASSIGN: "=",
  PLUS: "+",
  MINUS: "-",
  BANG: "!",
  ASTERISK: "*",
  SLASH: "/",

  // Comparison operators
  EQ: "==",
  NOT_EQ: "!=",
  LT: "<",
  GT: ">",
  LTE: "<=",
  GTE: ">=",

  // Delimiters
  COMMA: ",",
  SEMICOLON: ";",
  COLON: ":",

  LPAREN: "(",
  RPAREN: ")",
  LBRACE: "{",
  RBRACE: "}",

  // Keywords
  FUNC: "FUNC",
  RETURN: "RETURN",
  IF: "IF",
  ELSE: "ELSE",
  FOR: "FOR",
  VAR: "VAR",

  INT_TYPE: "INT_TYPE",
  STRING_TYPE: "STRING_TYPE",
  BOOL_TYPE: "BOOL_TYPE",

  TRUE: "TRUE",
  FALSE: "FALSE",

  PACKAGE: "PACKAGE",
} as const;

export type TokenType = typeof TokenType[keyof typeof TokenType];

export interface Token {
  type: TokenType;
  literal: string;
  line: number;
  column: number;
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

export function lookupIdent(ident: string): TokenType {
  return KEYWORDS.get(ident) || TokenType.IDENT;
}
