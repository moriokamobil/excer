/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 静的書き出し：`npm run build` で out/ に静的ファイルを生成する。
  // Node.jsが動かない共用レンタルサーバー（Xサーバー等）へは out/ の中身をアップロードする。
  output: "export",
};

export default nextConfig;
