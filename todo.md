# Data Insights AI - Project TODO

## Completed Features
- [x] Manus フルスタックプロジェクト初期化（web-db-user）
- [x] CSVアップロード機能の実装
- [x] データベーススキーマ設計（users, csvDatasets, chartConfigs, dataInsights）
- [x] tRPCルーター実装（CSV、チャート、洞察エンドポイント）
- [x] プロフェッショナルなUIデザイン（ダークテーマ、モダンレイアウト）
- [x] Manus LLM統合（詳細で多角的なデータ分析）
- [x] Express ボディサイズ制限拡大（100MB）
- [x] 統計計算ロジック実装（平均、中央値、標準偏差、四分位数）
- [x] データ構造分析機能
- [x] 複数分析カテゴリ（overview、quality、statistics、trends、anomalies、insights、recommendations、risks）
- [x] 既存データセットからの洞察取得機能
- [x] カテゴリフィルター機能
- [x] 信頼度スコア表示

## In Progress / Planned Features
- [x] AIによるCSVデータクリーニング機能（列・行の位置修正、ラベリング、欠損値処理）
- [x] 修正済みCSVファイルの出力機能
- [x] データクリーニング前後の比較表示
- [ ] インタラクティブなチャート・グラフ表示（Chart.js/Plotly統合）
- [ ] エクスポート機能（PDF/CSV）
- [ ] 比較分析（複数データセット間）
- [ ] ダッシュボード機能
- [ ] リアルタイム更新
- [ ] 相関マトリックス表示
- [ ] 時系列分析と予測
- [ ] カテゴリ別分析の詳細化

## Known Issues / Testing
- [x] Clean & Fix Data機能でcsvDataが正しく保持されていないバグを修正
- [ ] 既存データセットクリック時の洞察表示動作確認
- [ ] Manus LLMの詳細分析結果の確認
- [ ] パフォーマンステスト（大規模データセット）
- [ ] ブラウザ互換性テスト
- [ ] モバイルレスポンシブテスト

## Technical Stack
- **Frontend**: React 19、Tailwind CSS 4、shadcn/ui、Lucide Icons
- **Backend**: Express 4、tRPC 11、Drizzle ORM
- **Database**: MySQL/TiDB
- **AI**: Manus LLM API（JSON Schema形式の構造化応答）
- **Libraries**: simple-statistics（統計計算）、plotly.js-dist-min、recharts

## Deployment Status
- ✅ コード実装完了
- ✅ ビルド成功
- ⏳ 最終テスト実施中
- ⏳ チェックポイント作成予定

