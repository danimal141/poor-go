### 1. 全体像

Lexerは入力文字列をトークンの列に変換するコンポーネント。例えば：

```go
x = 5 + 10;
```

という入力を以下のようなトークン列に変換する：

```
IDENT("x")
ASSIGN("=")
INT("5")
PLUS("+")
INT("10")
SEMICOLON(";")
```

### 2. 主要なコンポーネント

1. **状態管理**

```typescript
private input: string;            // 入力文字列全体
private position: number = 0;     // 現在の文字位置
private readPosition: number = 0; // 次の文字位置
private ch: string = '';         // 現在の文字
private line: number = 1;        // 行番号
private column: number = 0;      // 列番号
```

2. **メインメソッド**

```typescript
public nextToken(): Token
```

- Lexerの主要なインターフェース
- 1回呼ばれるごとに次のトークンを返す
- 入力の終わりに達するとEOFトークンを返す

3. **補助メソッド群**

```typescript
private readChar(): void         // 次の文字を読む
private peekChar(): string       // 次の文字を先読み
private skipWhitespace(): void   // 空白文字をスキップ
private readIdentifier(): string // 識別子を読む
private readNumber(): string     // 数値を読む
```

### 3. 詳細な動作

#### トークンの生成プロセス（nextToken）

1. **前処理**

```typescript
this.skipWhitespace(); // 空白文字をスキップ

const token: Token = { // 新しいトークンを初期化
  type: TokenType.ILLEGAL,
  literal: this.ch,
  line: this.line,
  column: this.column,
};
```

2. **文字の種類に基づく処理（switch文）**

```typescript
switch (this.ch) {
  case "=": // 単一文字か複合文字('==')かをチェック
  case "+": // 単一文字のトークン
  case "<": // 単一文字か複合文字('<=')かをチェック
    // ... その他の記号
}
```

3. **識別子と数値の処理（default句）**

```typescript
if (this.isLetter(this.ch)) {
  token.literal = this.readIdentifier();
  token.type = lookupIdent(token.literal); // キーワードかどうかをチェック
} else if (this.isDigit(this.ch)) {
  token.type = TokenType.INT;
  token.literal = this.readNumber();
}
```

#### 位置管理（readChar）

```typescript
private readChar(): void {
  // 次の文字を読む
  if (this.readPosition >= this.input.length) {
    this.ch = '';
  } else {
    this.ch = this.input.charAt(this.readPosition);
  }

  // 位置を更新
  this.position = this.readPosition;
  this.readPosition += 1;

  // 行番号と列番号の管理
  if (this.ch === '\n') {
    this.line += 1;
    this.column = 0;
  } else {
    this.column += 1;
  }
}
```

### 4. 特筆すべき実装ポイント

1. **二文字トークンの処理**
   - `peekChar()`を使って次の文字を先読みし、`==`, `!=`, `<=`, `>=`などを適切に処理

2. **行番号と列番号の追跡**
   - 改行文字を検出して行番号をインクリメント
   - 列番号も適切に管理し、エラー報告に使用可能

3. **型安全性**
   - `charAt()`メソッドを使用して、TypeScriptの型チェックに対応
   - undefinedが返されないよう保証

4. **エラー処理**
   - 不正な文字に対してはILLEGALトークンを返す
   - ファイル終端に対してはEOFトークンを返す

### 5. 使用例

```typescript
const lexer = new Lexer("x = 5 + 10;");
let token: Token;
while ((token = lexer.nextToken()).type !== TokenType.EOF) {
  console.log(token);
}
```
