# PoorGo

A subset of Go language compiler implemented in TypeScript/Deno that generates LLVM IR.

## Current Implementation Status

### Basic Features
- [x] Package declaration (`package main`)
- [x] Basic program structure
- [x] String literals
- [x] Print statement (`print("hello")`)
- [ ] Integer literals
- [ ] Boolean literals
- [ ] Variables
- [ ] Basic arithmetic operations
- [ ] Functions
- [ ] Control structures

### Types
- [x] String type (basic support)
- [ ] Integer type
- [ ] Boolean type
- [ ] Type checking
- [ ] Type inference

### Error Handling
- [x] Basic syntax error reporting
- [x] Source location tracking
- [ ] Multiple error reporting
- [ ] Error recovery

### Compiler Pipeline
- [x] Lexical analysis
- [x] Syntax analysis
- [x] Semantic analysis
- [x] LLVM IR generation
- [x] Native code compilation

## Requirements

- Deno 2.1.0 or later
- LLVM toolchain (llc, clang)

## Installation

1. Install Deno using asdf:
```bash
asdf plugin add deno
asdf install deno 2.1.0
```

2. Install LLVM toolchain:
```bash
# For macOS
brew install llvm

# For Ubuntu/Debian
apt-get install llvm clang

# For Fedora
dnf install llvm clang
```

## Usage

### Compile and Run

```bash
# Compile a source file
deno task start input.pgo

# Specify output file
deno task start -o output input.pgo

# Show compilation process
deno task start --verbose input.pgo

# Output LLVM IR
deno task start --emit-llvm input.pgo
```

### Development

```bash
# Run tests
deno task test

# Watch tests
deno task test:watch

# Check types
deno task check

# Format code
deno task fmt

# Lint code
deno task lint
```

## Example

Create a file `hello.pgo`:
```go
package main {
    print("hello")
}
```

Compile and run:
```bash
deno task start hello.pgo
./a.out  # Outputs: hello
```

## Project Structure

```
poor-go/
├── main.ts               # Compiler entry point
├── src/
│   ├── lexer/           # Lexical analysis
│   ├── parser/          # Syntax analysis
│   ├── semantic/        # Semantic analysis
│   ├── codegen/         # LLVM IR generation
│   └── compiler/        # Compilation pipeline
├── examples/            # Example programs
└── README.md
```

## License

MIT License - see [LICENSE](LICENSE) for details
