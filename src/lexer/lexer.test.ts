import { describe, it } from "std/testing/bdd.ts";
import { assertEquals } from "std/assert/mod.ts";
import { Lexer } from "@/lexer/lexer.ts";
import { TokenType } from "@/lexer/token.ts";

describe("Lexer", () => {
  describe("basic hello world", () => {
    it("should correctly tokenize package declaration and main function", () => {
      const input = `package main
func main() {
  print("hello world")
}`;

      const expectedTokens = [
        { type: TokenType.PACKAGE, literal: "package" },
        { type: TokenType.IDENT, literal: "main" },
        { type: TokenType.SEMICOLON, literal: ";" }, // auto-inserted
        { type: TokenType.FUNC, literal: "func" },
        { type: TokenType.IDENT, literal: "main" },
        { type: TokenType.LPAREN, literal: "(" },
        { type: TokenType.RPAREN, literal: ")" },
        { type: TokenType.LBRACE, literal: "{" },
        { type: TokenType.IDENT, literal: "print" },
        { type: TokenType.LPAREN, literal: "(" },
        { type: TokenType.STRING, literal: "hello world" },
        { type: TokenType.RPAREN, literal: ")" },
        { type: TokenType.SEMICOLON, literal: ";" }, // auto-inserted
        { type: TokenType.RBRACE, literal: "}" },
        { type: TokenType.SEMICOLON, literal: ";" }, // auto-inserted
        { type: TokenType.EOF, literal: "" },
      ];

      const lexer = new Lexer(input);
      console.log("Input:", JSON.stringify(input));
      console.log("Expected tokens:", expectedTokens);

      const tokens = [];
      let token;
      let safetyCounter = 0;
      const MAX_ITERATIONS = 100; // Safety limit

      do {
        token = lexer.nextToken();
        console.log("Got token:", {
          type: token.type,
          literal: token.literal,
          line: token.line,
          column: token.column,
          char: lexer.getCurrentChar(), // We'll need to add this method
        });

        tokens.push(token);

        safetyCounter++;
        if (safetyCounter >= MAX_ITERATIONS) {
          console.error("Possible infinite loop detected!");
          console.error("Current token:", token);
          console.error("Current position info:", {
            line: token.line,
            column: token.column,
          });
          break;
        }
      } while (token.type !== TokenType.EOF);

      // Verify token count
      assertEquals(
        tokens.length,
        expectedTokens.length,
        `Wrong number of tokens. Expected ${expectedTokens.length}, got ${tokens.length}`,
      );

      // Verify each token
      tokens.forEach((token, i) => {
        assertEquals(
          token.type,
          expectedTokens[i]?.type,
          `Token ${i}: type mismatch. Expected ${
            expectedTokens[i]?.type
          }, got ${token.type}`,
        );
        assertEquals(
          token.literal,
          expectedTokens[i]?.literal,
          `Token ${i}: literal mismatch. Expected ${
            expectedTokens[i]?.literal
          }, got ${token.literal}`,
        );
      });
    });

    it("should correctly tokenize complex arithmetic expression", () => {
      const input = `package main
      func main() {
        print(4 + 3 * 2)
        print(10 - 6 / 2)
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
        { type: TokenType.INT, literal: "4" },
        { type: TokenType.PLUS, literal: "+" },
        { type: TokenType.INT, literal: "3" },
        { type: TokenType.ASTERISK, literal: "*" },
        { type: TokenType.INT, literal: "2" },
        { type: TokenType.RPAREN, literal: ")" },
        { type: TokenType.SEMICOLON, literal: ";" },
        { type: TokenType.IDENT, literal: "print" },
        { type: TokenType.LPAREN, literal: "(" },
        { type: TokenType.INT, literal: "10" },
        { type: TokenType.MINUS, literal: "-" },
        { type: TokenType.INT, literal: "6" },
        { type: TokenType.SLASH, literal: "/" },
        { type: TokenType.INT, literal: "2" },
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
        assertEquals(token.type, expectedTokens[i]?.type);
        assertEquals(token.literal, expectedTokens[i]?.literal);
      });
    });
  });
});
