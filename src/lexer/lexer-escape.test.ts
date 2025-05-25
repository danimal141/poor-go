import { describe, it } from "std/testing/bdd.ts";
import { assertEquals, assertThrows } from "std/assert/mod.ts";
import { Lexer } from "./lexer.ts";
import { TokenType } from "./token.ts";
import { LexicalError } from "@/common/errors.ts";

describe("Lexer - Escape Sequences", () => {
  describe("valid escape sequences", () => {
    it("should handle newline escape sequence", () => {
      const input = '"hello\\nworld"';
      const lexer = new Lexer(input);
      const token = lexer.nextToken();

      assertEquals(token.type, TokenType.STRING);
      assertEquals(token.literal, "hello\nworld");
    });

    it("should handle tab escape sequence", () => {
      const input = '"hello\\tworld"';
      const lexer = new Lexer(input);
      const token = lexer.nextToken();

      assertEquals(token.type, TokenType.STRING);
      assertEquals(token.literal, "hello\tworld");
    });

    it("should handle carriage return escape sequence", () => {
      const input = '"hello\\rworld"';
      const lexer = new Lexer(input);
      const token = lexer.nextToken();

      assertEquals(token.type, TokenType.STRING);
      assertEquals(token.literal, "hello\rworld");
    });

    it("should handle backslash escape sequence", () => {
      const input = '"hello\\\\world"';
      const lexer = new Lexer(input);
      const token = lexer.nextToken();

      assertEquals(token.type, TokenType.STRING);
      assertEquals(token.literal, "hello\\world");
    });

    it("should handle quote escape sequence", () => {
      const input = '"hello\\"world"';
      const lexer = new Lexer(input);
      const token = lexer.nextToken();

      assertEquals(token.type, TokenType.STRING);
      assertEquals(token.literal, 'hello"world');
    });

    it("should handle null character escape sequence", () => {
      const input = '"hello\\0world"';
      const lexer = new Lexer(input);
      const token = lexer.nextToken();

      assertEquals(token.type, TokenType.STRING);
      assertEquals(token.literal, "hello\0world");
    });

    it("should handle multiple escape sequences", () => {
      const input = '"line1\\nline2\\ttab\\\\backslash\\"quote"';
      const lexer = new Lexer(input);
      const token = lexer.nextToken();

      assertEquals(token.type, TokenType.STRING);
      assertEquals(token.literal, 'line1\nline2\ttab\\backslash"quote');
    });
  });

  describe("invalid escape sequences", () => {
    it("should throw error for invalid escape sequence", () => {
      const input = '"hello\\x"'; // \x is not a valid escape sequence
      const lexer = new Lexer(input);

      assertThrows(
        () => lexer.nextToken(),
        LexicalError,
        "Invalid escape sequence: \\x",
      );
    });

    it("should throw error for unterminated escape sequence", () => {
      const input = '"hello\\'; // Backslash at end of input
      const lexer = new Lexer(input);

      assertThrows(
        () => lexer.nextToken(),
        LexicalError,
        "Unterminated escape sequence in string literal",
      );
    });

    it("should throw error for unterminated string", () => {
      const input = '"hello world'; // Missing closing quote
      const lexer = new Lexer(input);

      assertThrows(
        () => lexer.nextToken(),
        LexicalError,
        "Unterminated string literal",
      );
    });

    it("should provide correct error location", () => {
      const input = 'package main\n"invalid\\z"';
      const lexer = new Lexer(input);

      // Skip package and main tokens
      lexer.nextToken(); // package
      lexer.nextToken(); // main
      lexer.nextToken(); // semicolon

      try {
        lexer.nextToken(); // This should throw
        throw new Error("Should have thrown");
      } catch (error) {
        if (error instanceof LexicalError) {
          assertEquals(error.location.line, 2);
          assertEquals(
            error.message.includes("Invalid escape sequence: \\z"),
            true,
          );
        } else {
          throw error;
        }
      }
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const input = '""';
      const lexer = new Lexer(input);
      const token = lexer.nextToken();

      assertEquals(token.type, TokenType.STRING);
      assertEquals(token.literal, "");
    });

    it("should handle string with only escape sequences", () => {
      const input = '"\\n\\t\\r\\\\"';
      const lexer = new Lexer(input);
      const token = lexer.nextToken();

      assertEquals(token.type, TokenType.STRING);
      assertEquals(token.literal, "\n\t\r\\");
    });

    it("should handle consecutive escape sequences", () => {
      const input = '"\\n\\n\\t\\t"';
      const lexer = new Lexer(input);
      const token = lexer.nextToken();

      assertEquals(token.type, TokenType.STRING);
      assertEquals(token.literal, "\n\n\t\t");
    });
  });

  describe("integration with program parsing", () => {
    it("should correctly parse program with escape sequences", () => {
      const input = `package main
func main() {
  print("Hello\\nWorld\\t!")
}`;

      const expectedTokens = [
        { type: TokenType.PACKAGE, literal: "package" },
        { type: TokenType.IDENT, literal: "main" },
        { type: TokenType.SEMICOLON, literal: ";" },
        { type: TokenType.FUNC, literal: "func" },
        { type: TokenType.IDENT, literal: "main" },
        { type: TokenType.LPAREN, literal: "(" },
        { type: TokenType.RPAREN, literal: ")" },
        { type: TokenType.LBRACE, literal: "{" },
        { type: TokenType.IDENT, literal: "print" },
        { type: TokenType.LPAREN, literal: "(" },
        { type: TokenType.STRING, literal: "Hello\nWorld\t!" },
        { type: TokenType.RPAREN, literal: ")" },
        { type: TokenType.SEMICOLON, literal: ";" },
        { type: TokenType.RBRACE, literal: "}" },
        { type: TokenType.SEMICOLON, literal: ";" },
        { type: TokenType.EOF, literal: "" },
      ];

      const lexer = new Lexer(input);
      const tokens = [];
      let token;

      do {
        token = lexer.nextToken();
        tokens.push(token);
      } while (token.type !== TokenType.EOF);

      assertEquals(tokens.length, expectedTokens.length);
      tokens.forEach((token, i) => {
        assertEquals(
          token.type,
          expectedTokens[i]?.type,
          `Token ${i} type mismatch`,
        );
        assertEquals(
          token.literal,
          expectedTokens[i]?.literal,
          `Token ${i} literal mismatch`,
        );
      });
    });
  });
});
