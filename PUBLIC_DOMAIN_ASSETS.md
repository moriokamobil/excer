# PUBLIC_DOMAIN_ASSETS.md — 名画・楽曲 確定リスト

> **このドキュメントについて**
> 「失われた美術館の修復 (Lost Museum)」で使用する、パブリックドメイン / CC0 の
> 名画と楽曲の確定リストです。`REQUIREMENTS_lost_museum.md` と必ずセットで扱います。
>
> - 名画: The Metropolitan Museum of Art Open Access (CC0) / Wikimedia Commons (PD) を出典とする。
> - 楽曲: 作曲がパブリックドメインであることに加え、**録音（演奏）のライセンスが CC0/PD** であるもののみ採用する（録音の著作隣接権に注意）。
> - ライセンス列が `CC0` / `PD` 以外のものは**取り込まない**（取り込みスクリプトでバリデーション）。

---

## 1. 名画マスタ（Phase 1 = 20作品）

Phase A では先頭 5 作品を最小取り込み対象とする。`met_object_id` は The Met Open Access の Object ID。

| # | title_ja | title_original | artist | 没年 | 制作年 | 所蔵館 | license | met_object_id | linked_music |
|---|---|---|---|---|---|---|---|---|---|
| 1 | ひまわり | Sunflowers | Vincent van Gogh | 1890 | 1887 | The Met | PD | 436524 | M1 |
| 2 | 真珠の耳飾りの少女 | Girl with a Pearl Earring | Johannes Vermeer | 1675 | 1665 | Mauritshuis | PD | — | M2 |
| 3 | 星月夜 | The Starry Night | Vincent van Gogh | 1890 | 1889 | MoMA | PD | — | M3 |
| 4 | 波（神奈川沖浪裏） | Under the Wave off Kanagawa | Katsushika Hokusai | 1849 | 1831 | The Met | CC0 | 45434 | M4 |
| 5 | 接吻 | The Kiss | Gustav Klimt | 1918 | 1908 | Belvedere | PD | — | M5 |
| 6 | 睡蓮 | Water Lilies | Claude Monet | 1926 | 1919 | The Met | CC0 | 438008 | M1 |
| 7 | 民衆を導く自由の女神 | Liberty Leading the People | Eugène Delacroix | 1863 | 1830 | Louvre | PD | — | M3 |
| 8 | 真珠の首飾りの女 | Woman with a Pearl Necklace | Johannes Vermeer | 1675 | 1664 | Gemäldegalerie | PD | — | M2 |
| 9 | 落穂拾い | The Gleaners | Jean-François Millet | 1875 | 1857 | Musée d'Orsay | PD | — | M5 |
| 10 | 大工聖ヨセフ | Saint Joseph the Carpenter | Georges de La Tour | 1652 | 1642 | Louvre | PD | — | M2 |
| 11 | 記憶の固執 | The Persistence of Memory | Salvador Dalí | 1989 | 1931 | MoMA | PD | — | M4 |
| 12 | ヴィーナスの誕生 | The Birth of Venus | Sandro Botticelli | 1510 | 1485 | Uffizi | PD | — | M1 |
| 13 | 叫び | The Scream | Edvard Munch | 1944 | 1893 | 国立美術館(ノルウェー) | PD | — | M3 |
| 14 | オフィーリア | Ophelia | John Everett Millais | 1896 | 1852 | Tate | PD | — | M5 |
| 15 | 赤い葡萄畑 | The Red Vineyard | Vincent van Gogh | 1890 | 1888 | プーシキン美術館 | PD | — | M1 |
| 16 | 夜警 | The Night Watch | Rembrandt van Rijn | 1669 | 1642 | Rijksmuseum | PD | — | M2 |
| 17 | 白樺の道 | Birch Forest | Gustav Klimt | 1918 | 1903 | 個人蔵 | PD | — | M5 |
| 18 | グランド・ジャット島の日曜日の午後 | A Sunday on La Grande Jatte | Georges Seurat | 1891 | 1886 | Art Institute of Chicago | PD | — | M4 |
| 19 | 舞台の踊り子 | The Ballet Class | Edgar Degas | 1917 | 1874 | Musée d'Orsay | PD | — | M3 |
| 20 | キューピッドを売る女 | A Vendor of Love | Joseph-Marie Vien | 1809 | 1763 | The Met | CC0 | 437891 | M1 |

> 注: Phase A の import 対象は The Met の CC0/PD 画像が API から取得できる #1, #4, #6, #20 と、Wikimedia PD の #2（真珠の耳飾りの少女）を含む先頭 5 点。met_object_id が `—` の作品は Wikimedia Commons の PD 画像 URL をシードに直接記載する。

---

## 2. ピース分割の推奨（初期 crop 座標）

crop 座標は元画像を正規化した 0.0〜1.0 の相対値 `(crop_x, crop_y, crop_w, crop_h)`。
`piece_type` は `main`（店舗イベント限定）/ `sub`（ハック・ワーク・訪問で入手）。

### #1 ひまわり（4ピース）
| index | 名称 | type | crop_x | crop_y | crop_w | crop_h |
|---|---|---|---|---|---|---|
| 0 | 花（中央の主役） | main | 0.25 | 0.10 | 0.50 | 0.55 |
| 1 | 花瓶 | sub | 0.30 | 0.60 | 0.40 | 0.35 |
| 2 | 背景（左） | sub | 0.00 | 0.00 | 0.30 | 1.00 |
| 3 | 背景（右） | sub | 0.70 | 0.00 | 0.30 | 1.00 |

### #2 真珠の耳飾りの少女（4ピース）
| index | 名称 | type | crop_x | crop_y | crop_w | crop_h |
|---|---|---|---|---|---|---|
| 0 | 顔 | main | 0.30 | 0.20 | 0.40 | 0.45 |
| 1 | ターバン | sub | 0.25 | 0.05 | 0.50 | 0.25 |
| 2 | 真珠 | sub | 0.45 | 0.55 | 0.20 | 0.20 |
| 3 | 背景 | sub | 0.00 | 0.00 | 1.00 | 1.00 |

### #3 星月夜（6ピース）
| index | 名称 | type | crop_x | crop_y | crop_w | crop_h |
|---|---|---|---|---|---|---|
| 0 | 渦巻く空（中央） | main | 0.30 | 0.10 | 0.45 | 0.45 |
| 1 | 月 | sub | 0.75 | 0.10 | 0.20 | 0.20 |
| 2 | 糸杉 | sub | 0.00 | 0.10 | 0.25 | 0.80 |
| 3 | 村 | sub | 0.25 | 0.60 | 0.60 | 0.35 |
| 4 | 星（左） | sub | 0.05 | 0.00 | 0.25 | 0.20 |
| 5 | 丘（右） | sub | 0.70 | 0.55 | 0.30 | 0.35 |

### #4 波（神奈川沖浪裏）（4ピース）
| index | 名称 | type | crop_x | crop_y | crop_w | crop_h |
|---|---|---|---|---|---|---|
| 0 | 大波 | main | 0.00 | 0.10 | 0.55 | 0.60 |
| 1 | 富士山 | sub | 0.40 | 0.45 | 0.30 | 0.30 |
| 2 | 舟 | sub | 0.30 | 0.55 | 0.40 | 0.25 |
| 3 | 空 | sub | 0.55 | 0.00 | 0.45 | 0.40 |

### #5 接吻（4ピース）
| index | 名称 | type | crop_x | crop_y | crop_w | crop_h |
|---|---|---|---|---|---|---|
| 0 | 抱擁する二人 | main | 0.25 | 0.15 | 0.50 | 0.60 |
| 1 | 花畑 | sub | 0.00 | 0.70 | 1.00 | 0.30 |
| 2 | 金の装飾（左） | sub | 0.00 | 0.00 | 0.25 | 0.70 |
| 3 | 金の装飾（右） | sub | 0.75 | 0.00 | 0.25 | 0.70 |

> #6 以降のピース分割は `apps/api/db/seed/pieces.seed.ts` に同形式で定義し、管理画面から crop を調整できる。

---

## 3. 楽曲マスタ（クラシックBGM）

**録音（演奏）が CC0/PD** のもののみ。出典は Musopen（CC0 録音）/ Internet Archive（PD 録音）を想定。
`global_clearance_checked = true` は録音ライセンスを1件ずつ人手確認済みであることを示す。

| id | title_ja | composer | 没年 | recording_source | recording_license | global_clearance_checked |
|---|---|---|---|---|---|---|
| M1 | 子犬のワルツ | Frédéric Chopin | 1849 | Musopen | CC0 | true |
| M2 | ゴルトベルク変奏曲 アリア | Johann Sebastian Bach | 1750 | Musopen | CC0 | true |
| M3 | ノクターン第2番 変ホ長調 | Frédéric Chopin | 1849 | Musopen | CC0 | true |
| M4 | ジムノペディ第1番 | Erik Satie | 1925 | Musopen | CC0 | true |
| M5 | 月の光 | Claude Debussy | 1918 | Musopen | CC0 | true |

> 名画完成時に `linked_music` 列の楽曲が「鑑賞モード」で解放される。
> 例: #1 ひまわり → M1 子犬のワルツ、#2 真珠の耳飾りの少女 → M2 ゴルトベルク変奏曲。

---

## 4. 取り込み時バリデーション（実装者向け）

`scripts/import-assets.ts` は各素材について以下を検証し、満たさないものは**取り込まない**:

1. 名画: The Met API の `isPublicDomain === true`、または Wikimedia の明示的 PD/CC0 タグ
2. `artwork_masters.license ∈ {CC0, PD}`
3. `music_masters.recording_license ∈ {CC0, PD}` かつ `global_clearance_checked === true`
4. 画像・メタデータ（作者・制作年・所蔵館・ライセンス）が揃っていること

いずれか欠けた素材はスキップし、ログに理由を出力する。
