# 金钱卦 · Money Hexagram Divination

基于 **Three.js 3D 铜钱抛掷** 的 Web 端易经占卜应用。掷三枚铜钱，六次成卦，得本卦与变卦，并附中英双语卦辞与爻辞。

A web-based I-Ching divination app featuring **3D coin throwing** powered by **Three.js**. Toss three ancient Chinese coins six times to form a hexagram, complete with **original & changed hexagrams**, **bilingual (Chinese/English) oracle texts**, and **changing-line highlights**.

---

## ✨ 特性 / Features

- 🪙 **3D 铜钱掷币** — 基于 Three.js + React Three Fiber 的真实物理抛掷动画
- 📖 **完整的六十四卦** — 含卦名、卦辞、六爻爻辞，严格按文王卦序
- 🌐 **中英双语** — English / 中文即时切换，所有卦辞爻辞均有深度文化翻译
- 🔄 **变卦机制** — 自动识别变爻，生成之卦并高亮变爻对应的爻辞
- 📱 **响应式设计** — 桌面端侧边抽屉 / 移动端底部抽屉自适应布局
- 🧘 **静心冥想页** — 起卦前引导专注问念，增强仪式感
- 📜 **开屏箴言轮播** — 随机展示 30+ 条易经名句（中英对照）
- 🎨 **水墨风格 UI** — 国风视觉设计，Noto Serif SC 字体
- 🚀 **GitHub Pages 自动部署** — push `main` 分支自动构建发布
- ⚡ **Draco 压缩** — 3D 模型使用 Draco 压缩（5.18 MB），加载迅速

---

## 🖼️ 截图 / Screenshots

### 开屏语言选择
开屏页面提供中/英双语入口，随机轮播易经名言。

### 静心冥想
起卦前引导专注默念问题，心诚则灵。

### 3D 掷币
三枚铜钱在 3D 场景中模拟抛掷，可旋转/缩放视角。

### 卦象结果
本卦与变卦并列展示，变爻自动高亮对应爻辞。

---

## 🧱 技术栈 / Tech Stack

| 技术 / Technology | 用途 / Purpose |
|:---|:---|
| [React 18](https://react.dev/) | UI 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Vite](https://vitejs.dev/) | 构建工具 |
| [Tailwind CSS](https://tailwindcss.com/) | 样式 |
| [Three.js](https://threejs.org/) | 3D 渲染引擎 |
| [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) | React 3D 绑定 |
| [React Three Drei](https://github.com/pmndrs/drei) | 3D 工具集（OrbitControls, ContactShadows） |
| [Draco](https://google.github.io/draco/) | 3D 模型压缩 |
| [GLTF Transform](https://gltf-transform.dev/) | 模型优化工具 |
| [GitHub Actions](https://github.com/features/actions) | CI/CD 自动部署 |

---

## 🚀 快速开始 / Quick Start

### 前置要求

- **Node.js** >= 20
- **npm** >= 10

### 安装与运行

```bash
# 克隆仓库
git clone <repo-url>
cd coin

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器打开 `http://localhost:5173` 即可使用。

### 构建生产版本

```bash
npm run build    # 输出到 dist/
npm run preview  # 本地预览构建产物
```

---

## 📁 项目结构 / Project Structure

```
coin/
├── .github/workflows/
│   └── deploy.yml              # GitHub Pages 自动部署 CI
├── public/
│   ├── background.webp          # 水墨背景图
│   ├── donate.jpg               # 赞赏二维码
│   ├── draco/                   # Draco WASM 解/编码器
│   │   ├── draco_decoder.js
│   │   ├── draco_decoder.wasm
│   │   ├── draco_encoder.js
│   │   └── draco_wasm_wrapper.js
│   ├── models/
│   │   └── model-final.glb      # 开元通宝 3D 模型 (Draco 压缩)
│   └── money_hexagram_bilingual_corrected.pdf  # 中英介绍 PDF
├── src/
│   ├── main.tsx                 # React 入口
│   ├── App.tsx                  # 主应用（路由、状态管理、UI布局）
│   ├── index.css                # Tailwind + 自定义动画
│   ├── vite-env.d.ts            # 类型声明
│   ├── useDeviceDetect.ts       # 移动端检测 Hook
│   ├── components/
│   │   ├── CoinThrower.tsx      # 3D 掷币场景（Three.js 核心）
│   │   ├── Coin.tsx             # OBJ 铜钱组件（旧版）
│   │   ├── GuaName.tsx          # 卦名展示组件
│   │   └── TrigramRecord.tsx    # 爻记录组件
│   └── utils/
│       ├── guaData.ts           # 64 卦数据 + 起卦/变卦/变爻核心逻辑
│       ├── englishGuaData.ts    # 英文卦名 + 卦辞
│       └── fullGuaText.ts       # 完整中英爻辞（64 卦 x 7 行）
├── 开元通宝币/                   # 原始 3D 模型（OBJ/MTL 格式）
├── 易经翻译.md                   # 易经全文中英翻译源数据
├── money_hexagram_bilingual_corrected.pdf  # 介绍文档 PDF
├── money_hexagram_bilingual_corrected.tex  # PDF LaTeX 源文件
├── index.html                   # HTML 入口
├── package.json                 # 依赖与脚本
├── vite.config.ts               # Vite 配置
├── tailwind.config.js           # Tailwind 配置
├── tsconfig.json                # TypeScript 配置
└── postcss.config.js            # PostCSS 配置
```

---

## 🔧 核心逻辑 / Core Logic

### 起卦规则

使用传统六爻金钱卦法：每次掷三枚铜钱，正面（字）= 2，反面（背）= 3，求和得 6–9：

| 总和 | 阴阳 | 变爻 |
|:---:|:---:|:---:|
| 6 | 阴 (⚋) | 是 (老阴) |
| 7 | 阳 (⚊) | 否 (少阳) |
| 8 | 阴 (⚋) | 否 (少阴) |
| 9 | 阳 (⚊) | 是 (老阳) |

从下往上记录六次投掷结果，构成完整六爻卦象。有变爻则翻转阴/阳得到**变卦**（之卦）。

```typescript
// src/utils/guaData.ts
export const calculateFromCoinResults = (
  coinResults: boolean[]
): { result: number; yinYang: 'yin' | 'yang'; changing: boolean } => {
  const sum = coinResults.reduce((acc, isHead) => acc + (isHead ? 2 : 3), 0);
  return calculateTrigram(sum);
};
```

### 八卦编码

采用标准二进制编码（上卦 + 下卦，阳=1 阴=0）：

| 卦 | 乾 | 兑 | 离 | 震 | 巽 | 坎 | 艮 | 坤 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 码 | 111 | 110 | 101 | 001 | 011 | 010 | 100 | 000 |

---

## 🪙 3D 模型

3D 铜钱模型为**开元通宝**（唐代铜钱），OBJ 原始文件约 14.25 MB，经以下流程优化：

1. `@gltf-transform/cli` 转换为 glTF 格式
2. Draco 压缩 → `model-final.glb` (5.18 MB)
3. 使用 `DRACOLoader` 在运行时解压

模型路径：`public/models/model-final.glb`  
Draco 解码器：`public/draco/`

---

## 🌐 部署 / Deployment

项目通过 **GitHub Actions** 自动部署到 **GitHub Pages**：

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
```

工作流步骤：
1. Checkout 代码
2. 安装 Node.js 20 + 依赖
3. `npm run build` 构建
4. 上传 `dist/` 到 GitHub Pages artifact
5. 部署到 Pages 环境

> 注意：`vite.config.ts` 中 `base: './'` 确保资源使用相对路径。

---

## 📝 开发命令

| 命令 | 说明 |
|:---|:---|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览构建产物 |
| `npm run lint` | ESLint 代码检查 |

---

## 📚 数据来源

- **六十四卦**：严格按《周易》文王卦序排列
- **卦辞爻辞**：以传统中文原文为准，英文翻译参考 Wilhelm/Baynes 译本并融合文化解释
- **翻译数据**：`易经翻译.md` 为原始翻译源文件，通过脚本生成 `englishGuaData.ts` 和 `fullGuaText.ts`

---

## 🧩 许可证 / License

MIT

---

## 赞赏 / Support

若有所感，随缘乐助，心诚则灵。

---

*易有太极，是生两仪，两仪生四象，四象生八卦。*

*In the Yi there is the Supreme Polarity, which gives rise to the Two Modes; the Two Modes give rise to the Four Images; the Four Images give rise to the Eight Trigrams.*
