import { describe, it } from "std/testing/bdd.ts";
import { assertEquals, assertInstanceOf, assert } from "std/assert/mod.ts";
import {
  CompilerError,
  LexicalError,
  SyntaxError,
  SemanticError,
  CodegenError,
  ErrorCollector,
} from "./errors.ts";

describe("CompilerError", () => {
  const location = { line: 10, column: 5 };

  it("should create LexicalError with correct message format", () => {
    const error = new LexicalError("Invalid character", location);

    assertEquals(error.message, "lexical error at line 10, column 5: Invalid character");
    assertEquals(error.location, location);
    assertEquals(error.phase, "lexical");
    assertInstanceOf(error, LexicalError);
    assert(error instanceof CompilerError);
  });

  it("should create SyntaxError with correct message format", () => {
    const error = new SyntaxError("Expected semicolon", location);

    assertEquals(error.message, "syntax error at line 10, column 5: Expected semicolon");
    assertEquals(error.location, location);
    assertEquals(error.phase, "syntax");
    assertInstanceOf(error, SyntaxError);
    assert(error instanceof CompilerError);
  });

  it("should create SemanticError with correct message format", () => {
    const error = new SemanticError("Undefined variable", location);

    assertEquals(error.message, "semantic error at line 10, column 5: Undefined variable");
    assertEquals(error.location, location);
    assertEquals(error.phase, "semantic");
    assertInstanceOf(error, SemanticError);
    assert(error instanceof CompilerError);
  });

  it("should create CodegenError with correct message format", () => {
    const error = new CodegenError("Invalid instruction", location);

    assertEquals(error.message, "codegen error at line 10, column 5: Invalid instruction");
    assertEquals(error.location, location);
    assertEquals(error.phase, "codegen");
    assertInstanceOf(error, CodegenError);
    assert(error instanceof CompilerError);
  });
});

describe("ErrorCollector", () => {
  it("should start with no errors", () => {
    const collector = new ErrorCollector();

    assertEquals(collector.hasErrors(), false);
    assertEquals(collector.getErrors().length, 0);
    assertEquals(collector.getErrorReport(), "No errors");
  });

  it("should collect multiple errors", () => {
    const collector = new ErrorCollector();
    const location1 = { line: 1, column: 1 };
    const location2 = { line: 2, column: 5 };

    const error1 = new LexicalError("First error", location1);
    const error2 = new SyntaxError("Second error", location2);

    collector.add(error1);
    collector.add(error2);

    assertEquals(collector.hasErrors(), true);
    assertEquals(collector.getErrors().length, 2);
    assertEquals(collector.getErrors()[0], error1);
    assertEquals(collector.getErrors()[1], error2);
  });

  it("should generate formatted error report", () => {
    const collector = new ErrorCollector();
    const location1 = { line: 1, column: 1 };
    const location2 = { line: 2, column: 5 };

    collector.add(new LexicalError("First error", location1));
    collector.add(new SyntaxError("Second error", location2));

    const report = collector.getErrorReport();
    const expectedReport =
      "1. lexical error at line 1, column 1: First error\n" +
      "2. syntax error at line 2, column 5: Second error";

    assertEquals(report, expectedReport);
  });

  it("should clear errors", () => {
    const collector = new ErrorCollector();
    const location = { line: 1, column: 1 };

    collector.add(new LexicalError("Test error", location));
    assertEquals(collector.hasErrors(), true);

    collector.clear();
    assertEquals(collector.hasErrors(), false);
    assertEquals(collector.getErrors().length, 0);
  });

  it("should throw first error when throwIfErrors is called", () => {
    const collector = new ErrorCollector();
    const location = { line: 1, column: 1 };
    const error = new LexicalError("Test error", location);

    collector.add(error);

    try {
      collector.throwIfErrors();
      throw new Error("Should have thrown");
    } catch (thrownError) {
      assertEquals(thrownError, error);
    }
  });

  it("should not throw when no errors exist", () => {
    const collector = new ErrorCollector();

    // Should not throw
    collector.throwIfErrors();
  });
});
