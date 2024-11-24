/*
Reference: https://github.com/golang/go/blob/go1.23.0/src/text/scanner/example_test.go

func Example() {
	const src = `
// This is scanned code.
if a > 10 {
	someParsable = text
}`

	var s scanner.Scanner
	s.Init(strings.NewReader(src))
	s.Filename = "example"
	for tok := s.Scan(); tok != scanner.EOF; tok = s.Scan() {
		fmt.Printf("%s: %s\n", s.Position, s.TokenText())
	}

	// Output:
	// example:3:1: if
	// example:3:4: a
	// example:3:6: >
	// example:3:8: 10
	// example:3:11: {
	// example:4:2: someParsable
	// example:4:15: =
	// example:4:17: text
	// example:5:1: }
}
*/

import { describe, it } from "std/testing/bdd.ts";
import { assertEquals } from "std/assert/mod.ts";
import { Lexer } from "@/lexer/lexer.ts";
import { TokenType } from "@/lexer/token.ts";

describe("Lexer", () => {
  describe("nextToken", () => {
    it("should tokenize operators and delimiters", () => {
      const input = "=+(){},;";
      const tests = [
        { type: TokenType.ASSIGN, literal: "=" },
        { type: TokenType.PLUS, literal: "+" },
        { type: TokenType.LPAREN, literal: "(" },
        { type: TokenType.RPAREN, literal: ")" },
        { type: TokenType.LBRACE, literal: "{" },
        { type: TokenType.RBRACE, literal: "}" },
        { type: TokenType.COMMA, literal: "," },
        { type: TokenType.SEMICOLON, literal: ";" },
        { type: TokenType.EOF, literal: "" },
      ];

      const lexer = new Lexer(input);

      for (const tt of tests) {
        const token = lexer.nextToken();
        assertEquals(
          token.type,
          tt.type,
          `token type wrong. expected=${tt.type}, got=${token.type}`,
        );
        assertEquals(
          token.literal,
          tt.literal,
          `token literal wrong. expected=${tt.literal}, got=${token.literal}`,
        );
      }
    });

    it("should tokenize a simple program", () => {
      const input = `
package main

func add(x int, y int) int {
    return x + y;
}
`;

      const tests = [
        { type: TokenType.PACKAGE, literal: "package" },
        { type: TokenType.IDENT, literal: "main" },
        { type: TokenType.FUNC, literal: "func" },
        { type: TokenType.IDENT, literal: "add" },
        { type: TokenType.LPAREN, literal: "(" },
        { type: TokenType.IDENT, literal: "x" },
        { type: TokenType.INT_TYPE, literal: "int" },
        { type: TokenType.COMMA, literal: "," },
        { type: TokenType.IDENT, literal: "y" },
        { type: TokenType.INT_TYPE, literal: "int" },
        { type: TokenType.RPAREN, literal: ")" },
        { type: TokenType.INT_TYPE, literal: "int" },
        { type: TokenType.LBRACE, literal: "{" },
        { type: TokenType.RETURN, literal: "return" },
        { type: TokenType.IDENT, literal: "x" },
        { type: TokenType.PLUS, literal: "+" },
        { type: TokenType.IDENT, literal: "y" },
        { type: TokenType.SEMICOLON, literal: ";" },
        { type: TokenType.RBRACE, literal: "}" },
        { type: TokenType.EOF, literal: "" },
      ];

      const lexer = new Lexer(input);

      for (const tt of tests) {
        const token = lexer.nextToken();
        assertEquals(
          token.type,
          tt.type,
          `token type wrong. expected=${tt.type}, got=${token.type}`,
        );
        assertEquals(
          token.literal,
          tt.literal,
          `token literal wrong. expected=${tt.literal}, got=${token.literal}`,
        );
      }
    });

    it("should tokenize operators", () => {
      const input = `
+ - * /
== != < > <= >=
`;
      const tests = [
        { type: TokenType.PLUS, literal: "+" },
        { type: TokenType.MINUS, literal: "-" },
        { type: TokenType.ASTERISK, literal: "*" },
        { type: TokenType.SLASH, literal: "/" },
        { type: TokenType.EQ, literal: "==" },
        { type: TokenType.NOT_EQ, literal: "!=" },
        { type: TokenType.LT, literal: "<" },
        { type: TokenType.GT, literal: ">" },
        { type: TokenType.LTE, literal: "<=" },
        { type: TokenType.GTE, literal: ">=" },
        { type: TokenType.EOF, literal: "" },
      ];

      const lexer = new Lexer(input);

      for (const tt of tests) {
        const token = lexer.nextToken();
        assertEquals(
          token.type,
          tt.type,
          `token type wrong. expected=${tt.type}, got=${token.type}`,
        );
        assertEquals(
          token.literal,
          tt.literal,
          `token literal wrong. expected=${tt.literal}, got=${token.literal}`,
        );
      }
    });

    it("should track line and column numbers", () => {
      const input = `
func add(x int) int {
    return x + 1;
}`;

      /*
[line 1]
[line 2]f u n c   a d d ( x   i n t )  i n t  {
        1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
        ^         ^     ^ ^   ^     ^  ^      ^
      */

      const expectedPositions = [
        { line: 2, column: 1 }, // func
        { line: 2, column: 6 }, // add
        { line: 2, column: 9 }, // (
        { line: 2, column: 10 }, // x
        { line: 2, column: 12 }, // int
        { line: 2, column: 15 }, // )
        { line: 2, column: 17 }, // int
        { line: 2, column: 21 }, // {
        { line: 3, column: 5 }, // return
        { line: 3, column: 12 }, // x
        { line: 3, column: 14 }, // +
        { line: 3, column: 16 }, // 1
        { line: 3, column: 17 }, // ;
        { line: 4, column: 1 }, // }
      ];

      const lexer = new Lexer(input);

      for (const expected of expectedPositions) {
        const token = lexer.nextToken();

        assertEquals(
          token.line,
          expected.line,
          `wrong line number. expected=${expected.line}, got=${token.line}, token=${
            JSON.stringify(token)
          }`,
        );
        assertEquals(
          token.column,
          expected.column,
          `wrong column number. expected=${expected.column}, got=${token.column}, token=${
            JSON.stringify(token)
          }`,
        );
      }
    });
  });
});
