# 各主要機能と責務

## src/lexer/

- 字句解析（Lexical Analysis）を担当
- ソースコードを文字列として受け取り、トークン列に分解
- 主な責務：
  - 文字列をトークンに分割（例：keywords、識別子、数値、文字列リテラル等）
  - 行番号・列番号の追跡によるエラー位置の特定
  - 自動セミコロン挿入の処理
  - トークンの型情報の管理（TokenType）

## src/parser/

- 構文解析（Syntax Analysis）を担当
- トークン列を抽象構文木（AST）に変換
- 主な責務：
  - 文法規則に従ってトークンを解析
  - AST（Abstract Syntax Tree）の構築
  - 式の優先順位の処理（四則演算など）
  - 構文エラーの検出と報告
  - プログラム構造の検証（package宣言、関数定義など）

## src/semantic/

- 意味解析（Semantic Analysis）を担当
- ASTの意味チェックを実行
- 主な責務：
  - 型チェック
  - 変数・関数のスコープ管理
  - 未定義変数の検出
  - mainパッケージ・main関数の検証
  - セマンティクスエラーの報告

## src/codegen/

- コード生成（Code Generation）を担当
- ASTからLLVM IRを生成
- 主な責務：
  - LLVM IR命令の生成
  - 文字列リテラルの処理
  - 算術演算のコード生成
  - print文の実装
  - 関数呼び出しの生成

## src/compiler/

- コンパイルパイプライン全体の制御を担当
- 主な責務：
  - 各フェーズ（lexer → parser → semantic → codegen）の連携
  - LLVMツールチェーンとの連携
  - コンパイルオプションの処理
  - エラーハンドリングとレポート
  - 最終的な実行ファイルの生成
