## Parser (構文解析器)

### 概要

字句解析器(Lexer)から受け取ったトークン列を解析して、抽象構文木(AST)を生成する。
入力例: `package main { print("Hello World!") }`

### 実装コンポーネント

#### 1. 基本構造

```typescript
export class Parser {
  private lexer: Lexer; // トークンを生成するLexer
  private currentToken!: Token; // 現在処理中のトークン
  private peekToken!: Token; // 次のトークン（先読み用）
}
```

#### 2. パースの流れ

```typescript
parseProgram(): Program {
  // 1. package キーワードの確認
  if (!this.checkToken(this.currentToken, TokenType.PACKAGE)) {
    this.throwError("Program must start with 'package' keyword");
  }

  // 2. パッケージ名（識別子）の確認
  this.nextToken();
  if (!this.checkToken(this.currentToken, TokenType.IDENT)) {
    this.throwError("Expected package name");
  }
  const packageName = this.currentToken.literal;

  // 3. { の確認
  this.nextToken();
  if (!this.checkToken(this.currentToken, TokenType.LBRACE)) {
    this.throwError("Expected '{' after package declaration");
  }

  // 4. main関数の本体をパース
  const mainFunction: FunctionDeclaration = {
    type: "FunctionDeclaration",
    name: "main",
    parameters: [],
    returnType: null,
    body: this.parseBlock(),
    location: this.currentLocation(),
  };

  // 5. プログラム全体のASTを構築
  const program: Program = {
    type: "Program",
    package: packageName,
    declarations: [mainFunction],
    location: this.currentLocation(),
  };

  return program;
}
```

#### 3. ステートメントのパース

```typescript
private parseStatement(): Statement {
  // 現時点ではprint文のみをサポート
  if (this.currentToken.literal === "print") {
    return this.parseExpressionStatement();
  }
  this.throwError(`Unexpected token ${this.currentToken.type}`);
}
```

#### 4. print関数呼び出しのパース

```typescript
private parseCallExpression(): CallExpression {
  // 1. 関数名（print）を識別子としてパース
  const func: Identifier = {
    type: "Identifier",
    value: this.currentToken.literal,
    location: this.currentLocation(),
  };

  // 2. ( の確認
  this.nextToken();
  if (!this.checkToken(this.currentToken, TokenType.LPAREN)) {
    this.throwError("Expected '(' after function name");
  }

  // 3. 引数をパース
  this.nextToken();
  const args = this.parseCallArguments();

  // 4. 関数呼び出しのASTノードを構築
  return {
    type: "CallExpression",
    function: func,
    arguments: args,
    location: this.currentLocation(),
  };
}
```

#### 5. 生成されるASTの構造

```typescript
{
  type: "Program",
  package: "main",
  declarations: [{
    type: "FunctionDeclaration",
    name: "main",
    parameters: [],
    returnType: null,
    body: {
      type: "BlockStatement",
      statements: [{
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          function: {
            type: "Identifier",
            value: "print"
          },
          arguments: [{
            type: "StringLiteral",
            value: "Hello World!"
          }]
        }
      }]
    }
  }]
}
```

### 構文エラー検出

以下のような構文エラーを検出：

```go
// packageキーワード欠落
main { print("hello") }

// パッケージ名（識別子）欠落
package { print("hello") }

// 開き中括弧欠落
package main print("hello")

// 関数呼び出しの括弧欠落
package main { print "hello" }
```

### 特徴

1. 再帰下降型パーサー
   - トップダウンでASTを構築
   - 各構文要素ごとに専用のパース関数を持つ

2. エラー処理
   - 構文エラーを詳細な位置情報と共に報告
   - 早期エラー検出

3. 型安全性
   - TypeScriptの型システムを活用
   - 厳密な型チェック

4. 責務の分離
   - 構文的な正しさのみを検証
   - 意味的な制約（パッケージ名が"main"であること等）はSemanticAnalyzerに委譲

5. 制限
   - 現時点では `package <識別子> { print("文字列") }` の形式のみ対応
   - エラーリカバリは未実装
