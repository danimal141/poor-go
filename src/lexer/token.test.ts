import { describe, it } from "std/testing/bdd.ts";
import { assertEquals } from "std/assert/mod.ts";
import { lookupIdent, TokenType } from "@/lexer/token.ts";

describe("Token", () => {
  describe("lookupIdent", () => {
    it("should identify keywords correctly", () => {
      const tests = [
        { input: "func", expected: TokenType.FUNC },
        { input: "return", expected: TokenType.RETURN },
        { input: "if", expected: TokenType.IF },
        { input: "else", expected: TokenType.ELSE },
        { input: "for", expected: TokenType.FOR },
        { input: "var", expected: TokenType.VAR },
        { input: "int", expected: TokenType.INT_TYPE },
        { input: "string", expected: TokenType.STRING_TYPE },
        { input: "bool", expected: TokenType.BOOL_TYPE },
        { input: "true", expected: TokenType.TRUE },
        { input: "false", expected: TokenType.FALSE },
        { input: "package", expected: TokenType.PACKAGE },
      ];

      for (const tt of tests) {
        assertEquals(
          lookupIdent(tt.input),
          tt.expected,
          `lookupIdent("${tt.input}") should return ${tt.expected}`,
        );
      }
    });

    it("should return IDENT for non-keywords", () => {
      const tests = [
        "x",
        "y",
        "add",
        "foobar",
        "main",
        "notakeyword",
      ];

      for (const input of tests) {
        assertEquals(
          lookupIdent(input),
          TokenType.IDENT,
          `lookupIdent("${input}") should return IDENT`,
        );
      }
    });
  });

  describe("TokenType", () => {
    it("should have unique values", () => {
      const values = new Set();
      for (const key of Object.keys(TokenType)) {
        const value = (TokenType as Record<string, string>)[key];
        assertEquals(
          values.has(value),
          false,
          `Duplicate TokenType value found: ${value}`,
        );
        values.add(value);
      }
    });
  });
});
