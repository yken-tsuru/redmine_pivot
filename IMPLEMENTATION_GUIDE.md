# 実装詳細ドキュメント: Redmine Pivot Plugin

本ドキュメントは、`redmine_pivot` プラグインの内部実装構造、主要なクラス、メソッド、およびフロントエンドのロジックについて解説します。開発者が本プラグインを保守・拡張する際の参考資料として作成されています。

## 1. ディレクトリ構造

```
redmine_pivot/
├── app/
│   ├── controllers/
│   │   └── pivot_controller.rb       # メインコントローラー（データ取得、保存）
│   └── views/
│       └── pivot/
│           └── index.html.erb        # メインビュー（JSロード、UIコンテナ）
├── assets/
│   ├── javascripts/
│   │   └── pivot.js                  # Pivottable.jsの初期化、カスタムロジック
│   └── stylesheets/
│       └── pivot.css                 # スタイルシート
├── config/
│   └── routes.rb                     # ルーティング定義
├── db/
│   └── migrate/                      # データベースマイグレーション
├── lib/
│   └── redmine_pivot/
│       └── patches/
│           └── issue_query_patch.rb  # IssueQueryモデルへのパッチ
└── init.rb                           # プラグイン初期化、権限設定
```

## 2. バックエンド実装 (Ruby on Rails)

### 2.1 PivotController (`app/controllers/pivot_controller.rb`)
ピボットテーブルの表示と設定保存を管理するコントローラーです。

- **`index` アクション**:
    - **データ取得**: `retrieve_query` でクエリを特定し、`@query.issues` または `@project.issues` でチケットを取得します。
    - **Eager Loading**: N+1問題を回避するため、`:status`, `:tracker`, `:priority`, `:assigned_to`, `:category`, `:fixed_version`, `:custom_values` を `includes` しています。
    - **JSON変換**: フロントエンドに渡すため、チケットデータをフラットな連想配列（Hash）の配列に変換し、`@issues_json` に格納します。
    - **メタデータ生成**:
        - `@date_fields`: 日付型フィールドのリスト（自動グループ化用）。
        - `@numeric_fields`: 数値型フィールドのリスト（集計関数用）。
        - `@boolean_fields`: ブール型フィールドのリスト（複数項目集計用）。

- **`save` アクション**:
    - **クエリ保存**: `IssueQuery` のインスタンスを作成し、パラメータから `pivot_config`（JSON文字列）を受け取って保存します。
    - **可視性**: デフォルトで `VISIBILITY_PRIVATE` として保存されます。

### 2.2 IssueQueryPatch (`lib/redmine_pivot/patches/issue_query_patch.rb`)
Redmineコアの `IssueQuery` モデルを拡張します。

- **`safe_attributes`**: `pivot_config` カラムをマスアサインメント可能（`params` から一括設定可能）にするために追加しています。

### 2.3 データベース (`db/migrate/`)
- **`20251227225000_add_pivot_config_to_queries.rb`**:
    - `queries` テーブルに `pivot_config` カラム（TEXT型）を追加します。ここにピボットテーブルの設定JSONが保存されます。

## 3. フロントエンド実装 (JavaScript)

### 3.1 pivot.js (`assets/javascripts/pivot.js`)
Pivottable.js の初期化と高度なカスタマイズを行っています。

#### 主要ロジック
1.  **データ受取**:
    - `window.redminePivotData`（チケットデータ）、`window.redminePivotOptions`（初期設定）、`window.redminePivotQueryConfig`（保存された設定）をグローバル変数経由で受け取ります。

2.  **派生属性 (Derived Attributes) の生成**:
    - **日付フィールド**: `derivedAttributes` を定義し、日付フィールド（開始日、期日など）から「年」「月」「日」「年月」を自動生成します (`$.pivotUtilities.derivers.dateFormat` を使用)。
    - **カスタムテキストグループ化**: ユーザー定義の正規表現ルールに基づき、テキストフィールドから新しい値を生成する関数を動的に追加します。

3.  **レンダラーとアグリゲーター (Renderers & Aggregators)**:
    - 日本語化された連想配列 `aggregators` と `jaRenderers` を定義しています。


4.  **設定の保存と復元**:
    - **`onRefresh` イベント**: ピボットテーブルの状態が変更されるたびに、現在の設定（行、列、フィルタなど）を `currentPivotConfig` に保存します。
    - **復元ロジック**: ページ読み込み時に `window.redminePivotQueryConfig` が存在する場合、それを `config` オブジェクトにマージし、チェックボックスの状態やカスタム派生属性を復元します。

5.  **UIコンポーネント管理**:
    - **フィールド選択エリア**: 全フィールドのチェックボックスを生成し、表示/非表示を制御します (`hiddenAttributes` 配列を操作)。
    - **正規表現グループ化モーダル**: jQuery UI Dialog を使用。ルール追加時に `customTextDerivers` 配列を更新し、ピボットテーブルを再描画します。
    - **フルスクリーンモード**: `#pivot-wrapper` にクラスを適用し、CSSで全画面表示を行います。

6.  **複数項目集計モード**:
    - 複数のブール型フィールド（Yes/No）を横断的に集計するため、データを「横持ち」から「縦持ち（Unpivot/Melt）」に変換してから `pivotUI` に渡す特殊ロジックを実装しています。

## 4. 拡張・カスタマイズガイド

### 新しい集計方法を追加する場合
`assets/javascripts/pivot.js` の `aggregators` オブジェクトに新しい関数を追加してください。既存の `$.pivotUtilities.aggregatorTemplates` を活用できます。

### 新しいチャートを追加する場合
`renderersObj` に新しいレンダラー関数を追加し、`jaRenderers` に日本語名でマッピングしてください。C3.js や D3.js を使用してカスタム描画ロジックを実装可能です。

### 保存する設定項目を増やす場合
`pivot.js` 内の `getSerializableConfig` 関数で、許可するキーを追加してください。また、復元ロジック（`window.redminePivotQueryConfig` を処理する部分）でもそのキーを適用するコードが必要です。
