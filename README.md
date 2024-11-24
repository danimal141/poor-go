# SimpleGo

## Language Specification

### 1. Basic Syntax

Every program must start with `package main` and contain a `main` function:

```go
package main

func main() {
    // Program entry point
}
```

### 2. Type System

Limited to essential primitive types:

```go
int    // Integer
string // String
bool   // Boolean
```

### 3. Variable Declarations

```go
// Implicit type inference (using := operator)
x := 42
name := "hello"
flag := true

// Explicit type declaration
var x int = 42
var name string = "hello"
var flag bool = true

// Constants
const pi = 3.14
const hello = "world"
```

### 4. Functions

```go
// Basic function
func add(x int, y int) int {
    return x + y
}

// Multiple return values
func divide(x int, y int) (int, error) {
    if y == 0 {
        return 0, error("division by zero")
    }
    return x / y, nil
}
```

### 5. Control Structures

```go
// If statement
if x > 0 {
    // positive
} else if x < 0 {
    // negative
} else {
    // zero
}

// For loops (three variants)
for i := 0; i < 10; i++ {
    // Standard for loop
}

for condition {
    // While-loop style
}

for {
    // Infinite loop
}
```

### 6. Basic Operators

```go
// Arithmetic operators
+    // Addition
-    // Subtraction
*    // Multiplication
/    // Division

// Comparison operators
==   // Equal to
!=   // Not equal to
<    // Less than
>    // Greater than
<=   // Less than or equal to
>=   // Greater than or equal to

// Logical operators
&&   // Logical AND
||   // Logical OR
!    // Logical NOT
```

### 7. Built-in Functions

```go
print(value)      // Output to stdout
len(value)        // Get string length
error(message)    // Create an error
```

### 8. Comments

```go
// Single-line comment

/*
  Multi-line
  comment
*/
```

### 9. Example Program

A complete program that calculates Fibonacci numbers:

```go
package main

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

func main() {
    // Calculate 10th Fibonacci number
    result := fibonacci(10)
    print(result)
}
```

### 10. Limitations

The following features are intentionally omitted:

- Classes/Object-oriented features
- Generics
- Concurrency (goroutines/channels)
- Pointers
- Slices/Arrays
- Maps
- Structs
- Interfaces (except for error)
- Packages (main package only)

## Implementation Details

The compiler is implemented in the following phases:

1. Lexical Analysis (Lexer)
   - Breaks source code into tokens

2. Syntax Analysis (Parser)
   - Generates Abstract Syntax Tree (AST) from tokens

3. Semantic Analysis
   - Type checking and semantic validation

4. Code Generation
   - Generates target code from AST

## Development Environment

- Deno 2.x
- TypeScript 5.x
- Docker (optional)

## Building and Running

```bash
# Build compiler
deno task build

# Compile and run a program
deno task run examples/fibonacci.sg

# Run tests
deno task test
```

## Project Structure

```
simple-go/
├── src/
│   ├── lexer/
│   ├── parser/
│   ├── semantic/
│   └── codegen/
├── examples/
└── README.md
```

## Features

- Simple and predictable syntax
- Static typing with type inference
- Clear error messages
- Single file compilation
- No external dependencies
- Easy to learn and implement

## Design Goals

1. **Simplicity**
   - Minimal set of features
   - Consistent syntax
   - Clear semantics

2. **Educational Value**
   - Easy to understand compiler implementation
   - Clear compilation phases
   - Straightforward debugging

3. **Reliability**
   - Static type checking
   - Clear error reporting
   - Predictable behavior

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

MIT License

