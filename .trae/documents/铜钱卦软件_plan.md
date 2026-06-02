
# 铜钱卦软件实现计划

## 1. 仓库研究结论

当前工作区已有：
- `开元通宝币/` 目录包含3D模型文件（.obj, .mtl, textures/
- `background.jpg` 背景图片

## 2. 技术栈选择
- **前端框架**: React + TypeScript + Vite
- **3D渲染**: Three.js + React Three Fiber (R3F)
- **物理引擎**: @react-three/cannon (物理效果)
- **样式**: Tailwind CSS

## 3. 核心功能模块

### 3.1 项目结构
```
coin/
├── src/
│   ├── components/
│   │   ├── Coin.tsx          # 单个铜钱组件
│   │   ├── CoinThrower.tsx    # 起卦场景
│   │   ├── TrigramRecord.tsx # 右侧爻记录组件
│   │   └── GuaName.tsx      # 卦名显示
│   ├── utils/
│   │   ├── guaData.ts          # 六十四卦数据
│   │   └── coinPhysics.ts     # 铜钱物理逻辑
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── models/                # 复制模型文件
└── index.html
```

### 3.2 核心实现步骤

#### 步骤1: 初始化项目
- 使用 Vite 创建 React + TypeScript 项目
- 安装依赖：three, @react-three/fiber, @react-three/drei, @react-three/cannon, tailwindcss
- 配置 Tailwind CSS

#### 步骤2: 准备3D资源
- 将 `开元通宝币/ 模型文件复制到 public/models/
- 配置模型加载器

#### 步骤3: 实现铜钱组件 Coin.tsx
- 加载铜钱正反面纹理
- 正反面状态管理
- 物理碰撞体

#### 步骤4: 实现起卦场景 CoinThrower.tsx
- 背景图背景
- 三个铜钱初始位置
- 点击事件处理
- 物理摇动效果
- 随机正反面生成
- 集中动画（屏幕中央排列

#### 步骤5: 实现爻记录组件 TrigramRecord.tsx
- 显示6爻（横线记录阴阳：实线为阳，虚线为阴）
- 圈叉记录变爻（圈为阳变，叉为阴变）
- 从下到上排列
- 每爻更新动画

#### 步骤6: 实现卦名组件 GuaName.tsx
- 六十四卦数据
- 根据爻组合计算卦名

#### 步骤7: 整合 App.tsx
- 组合所有组件
- 状态管理（起卦状态、爻记录）

## 4. 关键技术难点与风险
- 3D模型正确加载正反面纹理
- 物理摇动效果自然
- 铜钱随机正反面逻辑正确
- 六十四卦对应关系准确

## 5. 风险处理
- 如模型加载问题，使用简单几何体替代
- 物理引擎如不稳定，简化为关键帧动画
- 确保64卦数据完整正确
