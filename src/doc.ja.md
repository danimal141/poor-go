# 各主要機能と責務

## 1. Lexer (字句解析器)

### 主要メソッド

- `nextToken()`: コアとなるトークン生成メソッド
  - `readChar()`で1文字ずつ読み込み
  - `skipWhitespace()`で空白文字をスキップ
  - 文字種別に応じて`readIdentifier()`, `readNumber()`, `readString()`などを呼び出し
- `readChar()`: 入力を1文字進める。位置情報も更新
- `readIdentifier()`: 識別子やキーワードを読む
- `readString()`: 文字列リテラルを読む。エスケープシーケンスも処理
- `readNumber()`: 数値リテラルを読む

### データ構造

- `position`: 現在の文字位置
- `readPosition`: 次の文字位置
- `ch`: 現在処理中の文字
- `line`, `column`: 行と列の位置情報
- `lastToken`: 自動セミコロン挿入用の直前のトークン

## 2. Parser (構文解析器)

### 主要メソッド

- `parseProgram()`: 解析のエントリーポイント
  - パッケージ宣言を解析
  - 関数宣言を解析
- `parseFunctionDeclaration()`: 関数定義を解析
  - 関数名、パラメータ、戻り値型、本体を順に解析
- `parseBlockStatement()`: 関数本体などのブロックを解析
- `parseExpression()`: 式を解析
  - 優先順位に基づいて`parseAdditive()`, `parseMultiplicative()`, `parsePrimary()`を呼び出し
- `parseCallExpression()`: 関数呼び出しを解析

### 優先順位処理

- 加減算 -> 乗除算 -> プライマリ式 の順で優先順位を実現
- 各演算子レベルで左結合性を実現

## 3. Semantic Analyzer (意味解析器)

### 主要メソッド

- `analyze()`: 意味解析のエントリーポイント
  - パッケージ名の検証
  - 関数宣言の解析を開始
- `analyzeFunctionDeclaration()`: 関数定義の意味解析
  - main関数の特別規則を検証
  - 関数本体の文を解析
- `inferType()`: 式の型推論
  - リテラル、識別子、関数呼び出し、演算式の型を決定
- `checkInfixExpression()`: 二項演算の型チェック
- `checkCallExpression()`: 関数呼び出しの型チェック

### スコープ管理

- `scopeStack`: スコープのスタック
- `pushScope()`, `popScope()`: スコープの出入り管理
- `resolve()`: 変数の型解決

## 4. Code Generator (コード生成器)

### 主要メソッド

- `generate()`: コード生成のエントリーポイント
  - モジュールヘッダの生成
  - main関数の生成
- `emitMainFunction()`: main関数のIR生成
- `emitPrint()`: print文のIR生成
  - 文字列リテラル用の生成処理
  - 整数式用の生成処理
- `emitIntegerExpression()`: 整数式のIR生成

### IR生成の補助機能

- `nextVar()`: 一時変数名の生成
- `nextStringConst()`: 文字列定数名の生成
- `processStringLiteral()`: 文字列のエスケープ処理

## 5. Compiler Pipeline (コンパイルパイプライン)

### 主要メソッド

- `compile()`: コンパイルのエントリーポイント
  - LLVMツールの確認
  - IRファイルの生成
  - アセンブリとバイナリの生成
- `checkLLVMTools()`: llcとclangの存在確認
- `compileLLVMIR()`: IRからバイナリを生成

### コンパイルフロー

1. ソースコード -> Lexer -> トークン列
2. トークン列 -> Parser -> AST
3. AST -> Semantic Analyzer -> 型検証済みAST
4. 型検証済みAST -> Code Generator -> LLVM IR
5. LLVM IR -> Pipeline -> 実行可能バイナリ
