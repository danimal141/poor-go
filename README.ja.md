# SimpleGo

## 言語仕様

### 1. 基本構文

プログラムは必ず`package main`で始まり、`main`関数を含む必要があります：

```go
package main

func main() {
    // プログラムのエントリーポイント
}
```

### 2. 型システム

限定的な基本型のみをサポート：

```go
int    // 整数型
string // 文字列型
bool   // 真偽値型
```

### 3. 変数宣言

```go
// 暗黙的な型推論（:= 演算子）
x := 42
name := "hello"
flag := true

// 明示的な型宣言
var x int = 42
var name string = "hello"
var flag bool = true

// 定数
const pi = 3.14
const hello = "world"
```

### 4. 関数

```go
// 基本的な関数
func add(x int, y int) int {
    return x + y
}

// 複数の戻り値
func divide(x int, y int) (int, error) {
    if y == 0 {
        return 0, error("division by zero")
    }
    return x / y, nil
}
```

### 5. 制御構文

```go
// if文
if x > 0 {
    // ...
} else if x < 0 {
    // ...
} else {
    // ...
}

// for文（3種類のバリエーション）
for i := 0; i < 10; i++ {
    // 標準的なforループ
}

for condition {
    // whileループのような使い方
}

for {
    // 無限ループ
}
```

### 6. 基本演算子

```go
// 算術演算子
+    // 加算
-    // 減算
*    // 乗算
/    // 除算

// 比較演算子
==   // 等価
!=   // 非等価
<    // 未満
>    // より大きい
<=   // 以下
>=   // 以上

// 論理演算子
&&   // 論理AND
||   // 論理OR
!    // 論理NOT
```

### 7. ビルトイン関数

```go
print(value)      // 値を標準出力に出力
len(value)        // 文字列の長さを取得
error(message)    // エラーを生成
```

### 8. コメント

```go
// 一行コメント

/*
  複数行
  コメント
*/
```

### 9. サンプルプログラム

フィボナッチ数を計算する完全なプログラム例：

```go
package main

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

func main() {
    // 10番目のフィボナッチ数を計算
    result := fibonacci(10)
    print(result)
}
```

### 10. 制限事項

以下の機能は意図的に省略されています：

- クラス/オブジェクト指向機能
- ジェネリクス
- 並行処理（ゴルーチン/チャネル）
- ポインタ
- スライス/配列
- マップ
- 構造体
- インターフェース（error以外）
- パッケージ（mainパッケージのみ）

## 実装について

このコンパイラは以下のフェーズで実装されています：

1. 字句解析（Lexer）
   - ソースコードをトークンに分解

2. 構文解析（Parser）
   - トークンから抽象構文木（AST）を生成

3. 意味解析（Semantic Analyzer）
   - 型チェックと意味的な正当性の検証

4. コード生成（Code Generator）
   - ASTからターゲットコードを生成

## 開発環境

- Deno 2.x
- TypeScript 5.x
- Docker（オプション）

## ビルドと実行

```bash
# コンパイラのビルド
deno task build

# プログラムのコンパイルと実行
deno task run examples/fibonacci.sg

# テストの実行
deno task test
```

## ライセンス

MIT License
