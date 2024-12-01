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

### Compiling PoorGo Programs

The compilation process has two stages:

1. Use `pgo build` to compile your PoorGo source files
2. The compiler generates an executable file

```bash
# Basic compilation
./pgo build source.pgo

# Specify output file
./pgo build -o program source.pgo

# Show compilation process
./pgo build --verbose source.pgo

# Output LLVM IR
./pgo build --emit-llvm source.pgo
```

### Command-Line Options

```
Usage: pgo build [options] <source-file>

Options:
  -o, --output <file>  Output file name (default: a.out)
  --emit-llvm          Output LLVM IR
  --verbose            Show compilation process
  -O<level>           Optimization level (0-3)
  -h, --help          Show this help message
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

# Generate project summary
python generateprojectsummary.py
```

## Project Summary Generation
The project includes a Python script to generate a comprehensive project summary, useful for documentation and sharing. This summary includes:

* Directory structure
* File contents
* Important code sections
* Tests and examples

To generate the summary:

```bash
python generateprojectsummary.py
```

This will create a summary that can be easily shared with others or used for documentation purposes.

## Example

Create a file `hello.pgo`:
```go
package main {
    print("hello")
}
```

Compile and run:
```bash
deno task compile # -> `pgo` command is created
./pgo build hello.pgo
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
