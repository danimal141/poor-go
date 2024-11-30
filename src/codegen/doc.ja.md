# LLVM Generator 実装解説

## 概要

LLVMGeneratorはAST（抽象構文木）からLLVM IRを生成するコンポーネントである。LLVM IRは、プログラムの意味を保持しながら、最終的な機械語生成に適した中間表現形式となる。

## 主要コンポーネント

### 1. 基本構造

```typescript
class LLVMGenerator {
  private output: string[] = []; // 生成されるIRを保持
  private varCounter = 0; // 一時変数の採番用
  private stringCounter = 0; // 文字列定数の採番用
}
```

### 2. モジュールレベルの宣言

```llvm
declare i32 @printf(i8* nocapture readonly, ...)
@.str = private unnamed_addr constant [2 x i8] c"%s\00", align 1
```

- `printf`関数をC言語の標準ライブラリから宣言
- 文字列出力用のフォーマット文字列を定義
- `private unnamed_addr`はリンク時の最適化を可能にする

### 3. 文字列リテラルの処理

文字列リテラルは以下の手順で処理される：

1. エスケープシーケンスの変換：
   - `\n` → `\0A` (改行)
   - `\r` → `\0D` (復帰)
   - `\t` → `\09` (タブ)
   - `\"` → `\"` (二重引用符)
   - `\\` → `\\` (バックスラッシュ)

2. グローバル定数の生成：

```llvm
@.str.0 = private unnamed_addr constant [6 x i8] c"hello\00"
```

### 4. print関数の実装

print文は以下の3つのLLVM IR命令に変換される：

```llvm
%1 = getelementptr [2 x i8], [2 x i8]* @.str, i64 0, i64 0
%2 = getelementptr [6 x i8], [6 x i8]* @.str.0, i64 0, i64 0
%3 = call i32 (i8*, ...) @printf(i8* %1, i8* %2)
```

1. フォーマット文字列のアドレス計算
2. 文字列定数のアドレス計算
3. printf関数の呼び出し

### 5. main関数の生成

```llvm
define i32 @main() {
entry:
  ; statements...
  ret i32 0
}
```

- プログラムのエントリーポイント
- すべての文を`entry`ブロックに配置
- 0を返して正常終了を示す

## 実装の特徴

1. 型安全性
   - LLVM IRの厳格な型システムに従う
   - すべての操作は明示的な型を持つ

2. メモリ管理
   - 文字列はグローバル定数として配置
   - スタック変数は自動的に解放

3. 最適化の考慮
   - private unnamed_addrの使用
   - アライメントの指定

## 制約事項

現在の実装では以下の機能のみをサポート：

- パッケージ宣言
- main関数
- 文字列リテラルを引数とするprint文

今後の拡張として以下が考えられる：

- 変数宣言と代入
- 算術演算
- 制御構造（if, for）
- 関数定義と呼び出し

## 生成されるIRの例

入力：

```go
package main { print("hello\n") }
```

出力：

```llvm
declare i32 @printf(i8* nocapture readonly, ...)

@.str = private unnamed_addr constant [2 x i8] c"%s\00", align 1
@.str.0 = private unnamed_addr constant [6 x i8] c"hello\0A\00", align 1

define i32 @main() {
entry:
  %0 = getelementptr [2 x i8], [2 x i8]* @.str, i64 0, i64 0
  %1 = getelementptr [6 x i8], [6 x i8]* @.str.0, i64 0, i64 0
  %2 = call i32 (i8*, ...) @printf(i8* %0, i8* %1)
  ret i32 0
}
```
