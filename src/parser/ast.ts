/**
 * Represents a location in the source code
 * Used for error messages and debugging information
 */
export interface Location {
  line: number; // Line number
  column: number; // Column number
}

/**
 * Base interface for all AST nodes
 */
export interface Node {
  type: string; // String identifier for the node type
  location: Location; // Position in source code
}

/**
 * Root node representing the entire program
 * In PoorGo, all programs must start with 'package main'
 * followed by function and variable declarations
 */
export interface Program extends Node {
  type: "Program";
  package: string; // Package name (fixed as "main")
  declarations: Declaration[]; // Top-level declarations
}

// ========================================
// Declaration-related types
// ========================================

/**
 * Represents top-level declarations
 * PoorGo only supports function and variable declarations
 */
export interface Declaration extends Node {
  type: "FunctionDeclaration" | "VariableDeclaration";
}

/**
 * Represents a function declaration
 * Example: func add(x int, y int) int { ... }
 */
export interface FunctionDeclaration extends Declaration {
  type: "FunctionDeclaration";
  name: string; // Function name
  parameters: Parameter[]; // List of parameters
  returnType: TypeNode | null; // Return type (null if no return value)
  body: BlockStatement; // Function body
}

/**
 * Represents a variable declaration
 * Example 1: var x int = 5
 * Example 2: y := 10 (type inference)
 */
export interface VariableDeclaration extends Node {
  type: "VariableDeclaration";
  name: string; // Variable name
  declType: TypeNode | null; // Variable type (null for type inference)
  init: Expression; // Initial value
}

/**
 * Represents a function parameter
 * Example: for 'x int', name is "x" and type is {typeType: "int"}
 */
export interface Parameter {
  name: string; // Parameter name
  type: TypeNode; // Parameter type
  location: Location;
}

/**
 * Represents type information
 * PoorGo only supports int, string, and bool
 */
export interface TypeNode extends Node {
  type: "TypeNode";
  typeType: "int" | "string" | "bool";
}

// ========================================
// Statement-related types
// ========================================

/**
 * Union type of all statement types
 */
export type Statement =
  | ExpressionStatement
  | ReturnStatement
  | IfStatement
  | ForStatement
  | VariableDeclaration;

/**
 * Represents a block of statements
 * Used in function bodies and control structures
 */
export interface BlockStatement extends Node {
  type: "BlockStatement";
  statements: Statement[]; // List of statements in the block
}

/**
 * Represents a statement that consists of a single expression
 * Example: print(x)
 */
export interface ExpressionStatement extends Node {
  type: "ExpressionStatement";
  expression: Expression;
}

/**
 * Represents a return statement
 * Example: return x + y
 */
export interface ReturnStatement extends Node {
  type: "ReturnStatement";
  returnValue: Expression;
}

/**
 * Represents an if statement with optional else clause
 * Example: if x > 0 { ... } else { ... }
 */
export interface IfStatement extends Node {
  type: "IfStatement";
  condition: Expression; // Condition to evaluate
  consequence: BlockStatement; // Block to execute if condition is true
  alternative: BlockStatement | null; // Optional else block
}

/**
 * Represents a for loop with optional init, condition, and update
 * Example: for i := 0; i < 10; i++ { ... }
 */
export interface ForStatement extends Node {
  type: "ForStatement";
  init: VariableDeclaration | ExpressionStatement | null; // Loop initialization
  condition: Expression | null; // Loop condition
  update: Expression | null; // Update expression
  body: BlockStatement; // Loop body
}

// ========================================
// Expression-related types
// ========================================

/**
 * Union type of all expression types
 */
export type Expression =
  | Identifier
  | IntegerLiteral
  | StringLiteral
  | BooleanLiteral
  | PrefixExpression
  | InfixExpression
  | CallExpression;

/**
 * Represents an identifier
 * Example: variable names, function names
 */
export interface Identifier extends Node {
  type: "Identifier";
  value: string; // Name of the identifier
}

/**
 * Represents an integer literal
 * Example: 42
 */
export interface IntegerLiteral extends Node {
  type: "IntegerLiteral";
  value: number;
}

/**
 * Represents a string literal
 * Example: "hello"
 */
export interface StringLiteral extends Node {
  type: "StringLiteral";
  value: string;
}

/**
 * Represents a boolean literal
 * Example: true, false
 */
export interface BooleanLiteral extends Node {
  type: "BooleanLiteral";
  value: boolean;
}

/**
 * Represents a prefix expression
 * Example: -x, !true
 */
export interface PrefixExpression extends Node {
  type: "PrefixExpression";
  operator: string; // '-' | '!'
  right: Expression; // Expression being operated on
}

/**
 * Represents an infix expression
 * Example: x + y, a == b
 */
export interface InfixExpression extends Node {
  type: "InfixExpression";
  operator: string; // '+' | '-' | '*' | '/' | '==' | '!=' | '<' | '>' | '<=' | '>='
  left: Expression; // Left operand
  right: Expression; // Right operand
}

/**
 * Represents a function call
 * Example: print(x), add(1, 2)
 */
export interface CallExpression extends Node {
  type: "CallExpression";
  function: Identifier; // Function being called
  arguments: Expression[]; // Function arguments
}
