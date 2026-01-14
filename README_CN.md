# Tweet Deleter

<p align="center">
  <img src="icons/icon128.png" alt="Tweet Deleter Logo" width="128">
</p>

<p align="center">
  <strong>一款用于批量删除 X (Twitter) 推文、回复和转发的浏览器扩展</strong>
</p>

<p align="center">
  简体中文 | <a href="./README.md">English</a>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#安装方法">安装方法</a> •
  <a href="#使用说明">使用说明</a> •
  <a href="#支持语言">支持语言</a> •
  <a href="#隐私说明">隐私说明</a> •
  <a href="#开源协议">开源协议</a>
</p>

---

## 功能特性

- **批量删除** - 一次性删除多条推文、回复和转发
- **内容类型筛选** - 可选择只删除推文、回复或转发
- **时间范围筛选** - 删除指定日期范围内的内容
- **关键词过滤** - 只删除包含（或排除）特定关键词的内容
- **可调节速度** - 可选择慢速（安全）、正常或快速删除
- **进度追踪** - 删除过程中实时显示进度
- **多语言支持** - 支持 6 种语言界面

## 支持语言

| 语言 | 代码 |
|------|------|
| English (英语) | en |
| 简体中文 | zh_CN |
| 繁體中文 | zh_TW |
| Español (西班牙语) | es |
| Français (法语) | fr |
| Deutsch (德语) | de |

## 安装方法

### 从源码安装（开发者模式）

1. 克隆此仓库：
   ```bash
   git clone https://github.com/heyuan110/tweet-deleter.git
   ```

2. 打开 Chrome 浏览器，访问 `chrome://extensions/`

3. 在右上角开启 **开发者模式**

4. 点击 **加载已解压的扩展程序**，选择 `tweet-deleter` 文件夹

5. 扩展图标将出现在浏览器工具栏中

### 从 Chrome 应用商店安装

*即将上线*

## 使用说明

1. **打开 X (Twitter)** - 在浏览器中打开 [x.com](https://x.com) 或 [twitter.com](https://twitter.com) 并进入你的个人主页

2. **点击扩展图标** - 点击浏览器工具栏中的 Tweet Deleter 图标

3. **配置筛选条件**：
   - **内容类型**：选择要删除的内容类型（推文、回复、转发）
   - **时间范围**：设置日期范围或使用快捷选择按钮
   - **关键词**：可选择按关键词过滤

4. **扫描内容** - 点击「扫描内容」按钮查找匹配的推文

5. **开始删除** - 点击「开始删除」按钮执行删除操作

6. **监控进度** - 观察进度条，可随时点击停止

## 高级选项

| 选项 | 说明 |
|------|------|
| **删除速度** | 慢速（安全，2秒延迟）、正常（1秒延迟）、快速（0.5秒延迟，可能触发限制） |
| **批量大小** | 每批处理的推文数量（10、25、50 或 100） |
| **每批确认** | 开始删除前询问确认 |

## 隐私说明

本扩展：

- ✅ 完全在你的浏览器中运行
- ✅ 不收集任何个人数据
- ✅ 不向外部服务器发送数据
- ✅ 仅访问 twitter.com 和 x.com
- ✅ 开源代码 - 你可以自行审查

## 技术细节

- **Manifest 版本**: 3
- **权限**: activeTab, storage, scripting
- **主机权限**: twitter.com, x.com

## 项目结构

```
tweet-deleter/
├── manifest.json          # 扩展配置文件
├── popup.html             # 扩展弹窗界面
├── popup.css              # 弹窗样式
├── popup.js               # 弹窗逻辑
├── content.js             # 内容脚本（在 Twitter 页面运行）
├── content.css            # 内容脚本样式
├── background.js          # 后台服务脚本
├── icons/                 # 扩展图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── _locales/              # 国际化
    ├── en/
    ├── zh_CN/
    ├── zh_TW/
    ├── es/
    ├── fr/
    └── de/
```

## 免责声明

⚠️ **使用风险自负**

- 本扩展会永久删除你的推文，删除后无法恢复
- 如果短时间内删除过多推文，Twitter/X 可能会对你的账号进行限速或临时限制
- 为安全起见，建议始终使用「慢速」选项
- 批量删除前建议先下载你的 Twitter 数据存档

## 参与贡献

欢迎贡献代码！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 致谢

- 图标设计基于 Twitter 品牌配色

---

<p align="center">
  用 ❤️ 打造，让你的 Twitter 更清爽
</p>
