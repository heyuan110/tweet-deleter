// Tweet Deleter - Content Script
// 在 X/Twitter 页面中执行的内容脚本，负责扫描和删除推文

(function() {
  // 防止重复注入
  if (window.tweetDeleterInjected) return;
  window.tweetDeleterInjected = true;

  // 状态管理
  let isRunning = false;
  let shouldStop = false;
  let scannedTweets = [];
  let currentSettings = null;

  // 删除速度配置（毫秒）
  const SPEED_CONFIG = {
    slow: { actionDelay: 2000, scrollDelay: 3000 },
    normal: { actionDelay: 1000, scrollDelay: 2000 },
    fast: { actionDelay: 500, scrollDelay: 1000 }
  };

  // 选择器配置
  const SELECTORS = {
    // 推文容器
    tweet: '[data-testid="tweet"]',
    // 推文时间链接
    tweetTime: 'time',
    // 推文文本
    tweetText: '[data-testid="tweetText"]',
    // 更多操作按钮
    moreButton: '[data-testid="caret"]',
    // 删除按钮
    deleteButton: '[data-testid="Dropdown"] [role="menuitem"]',
    // 确认删除按钮
    confirmDelete: '[data-testid="confirmationSheetConfirm"]',
    // 转发标识
    repostIndicator: '[data-testid="socialContext"]',
    // 回复标识
    replyIndicator: '[data-testid="tweet"] [href*="/status/"]',
  };

  // 工具函数：延迟
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 工具函数：等待元素出现
  async function waitForElement(selector, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await delay(100);
    }
    return null;
  }

  // 工具函数：滚动加载更多
  async function scrollAndLoad(scrollDelay) {
    window.scrollBy(0, window.innerHeight);
    await delay(scrollDelay);
  }

  // 检查推文类型
  function getTweetType(tweetElement) {
    // 检查是否是转发
    const socialContext = tweetElement.querySelector('[data-testid="socialContext"]');
    if (socialContext && socialContext.textContent.toLowerCase().includes('repost')) {
      return 'repost';
    }

    // 检查是否有转发图标（另一种检测方式）
    const retweetIcon = tweetElement.querySelector('[data-testid="unretweet"]');
    if (retweetIcon) {
      return 'repost';
    }

    // 检查是否是回复
    const replyingTo = tweetElement.querySelector('[data-testid="tweet"]');
    if (replyingTo) {
      const textContent = tweetElement.textContent;
      if (textContent.includes('Replying to') || textContent.includes('回复')) {
        return 'reply';
      }
    }

    return 'tweet';
  }

  // 获取推文时间
  function getTweetTime(tweetElement) {
    const timeElement = tweetElement.querySelector('time');
    if (timeElement) {
      const datetime = timeElement.getAttribute('datetime');
      return datetime ? new Date(datetime) : null;
    }
    return null;
  }

  // 获取推文文本
  function getTweetText(tweetElement) {
    const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
    return textElement ? textElement.textContent : '';
  }

  // 检查推文是否符合过滤条件
  function matchesFilters(tweetElement, settings) {
    const type = getTweetType(tweetElement);
    const time = getTweetTime(tweetElement);
    const text = getTweetText(tweetElement);

    // 检查内容类型
    if (type === 'tweet' && !settings.contentTypes.tweets) return false;
    if (type === 'reply' && !settings.contentTypes.replies) return false;
    if (type === 'repost' && !settings.contentTypes.reposts) return false;

    // 检查时间范围
    if (settings.timeRange.from && time) {
      const fromDate = new Date(settings.timeRange.from);
      if (time < fromDate) return false;
    }
    if (settings.timeRange.to && time) {
      const toDate = new Date(settings.timeRange.to);
      toDate.setHours(23, 59, 59, 999);
      if (time > toDate) return false;
    }

    // 检查关键词
    if (settings.keywords.list && settings.keywords.list.length > 0) {
      const hasKeyword = settings.keywords.list.some(keyword =>
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      if (settings.keywords.exclude) {
        // 排除包含关键词的
        if (hasKeyword) return false;
      } else {
        // 只包含关键词的
        if (!hasKeyword) return false;
      }
    }

    return true;
  }

  // 扫描页面上的推文
  async function scanTweets(settings) {
    scannedTweets = [];
    const speedConfig = SPEED_CONFIG[settings.options.speed] || SPEED_CONFIG.normal;
    const seenTweetIds = new Set();
    let lastScrollHeight = 0;
    let noNewContentCount = 0;

    // 先获取当前用户名，确保只扫描自己的推文
    const currentUrl = window.location.href;
    const isProfilePage = currentUrl.includes('/status/') === false &&
                          (currentUrl.includes('twitter.com/') || currentUrl.includes('x.com/'));

    console.log('[Tweet Deleter] 开始扫描推文...');

    // 滚动加载并扫描
    while (noNewContentCount < 3) {
      const tweets = document.querySelectorAll(SELECTORS.tweet);
      let newTweetsFound = false;

      for (const tweet of tweets) {
        // 使用推文的某些属性作为唯一标识
        const tweetLink = tweet.querySelector('a[href*="/status/"]');
        const tweetId = tweetLink ? tweetLink.href : tweet.textContent.substring(0, 100);

        if (seenTweetIds.has(tweetId)) continue;
        seenTweetIds.add(tweetId);
        newTweetsFound = true;

        // 检查是否匹配过滤条件
        if (matchesFilters(tweet, settings)) {
          scannedTweets.push({
            element: tweet,
            id: tweetId,
            type: getTweetType(tweet),
            time: getTweetTime(tweet),
            text: getTweetText(tweet).substring(0, 100)
          });
        }
      }

      // 检查是否还有新内容
      const currentScrollHeight = document.documentElement.scrollHeight;
      if (currentScrollHeight === lastScrollHeight && !newTweetsFound) {
        noNewContentCount++;
      } else {
        noNewContentCount = 0;
      }
      lastScrollHeight = currentScrollHeight;

      // 限制扫描数量，避免扫描过多
      if (scannedTweets.length >= 500) {
        console.log('[Tweet Deleter] 达到扫描上限 500 条');
        break;
      }

      // 滚动加载更多
      await scrollAndLoad(speedConfig.scrollDelay);
    }

    console.log(`[Tweet Deleter] 扫描完成，找到 ${scannedTweets.length} 条符合条件的内容`);
    return scannedTweets.length;
  }

  // 删除单条推文
  async function deleteTweet(tweetInfo, speedConfig) {
    try {
      // 滚动到推文位置
      tweetInfo.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(500);

      // 点击更多按钮
      const moreButton = tweetInfo.element.querySelector(SELECTORS.moreButton);
      if (!moreButton) {
        console.log('[Tweet Deleter] 找不到更多按钮');
        return false;
      }

      moreButton.click();
      await delay(speedConfig.actionDelay);

      // 查找删除选项
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      let deleteOption = null;

      for (const item of menuItems) {
        const text = item.textContent.toLowerCase();
        if (text.includes('delete') || text.includes('删除') || text.includes('刪除')) {
          deleteOption = item;
          break;
        }
        // 对于转发，查找撤销转发选项
        if (tweetInfo.type === 'repost' && (text.includes('undo') || text.includes('撤销') || text.includes('取消'))) {
          deleteOption = item;
          break;
        }
      }

      if (!deleteOption) {
        // 点击空白处关闭菜单
        document.body.click();
        console.log('[Tweet Deleter] 找不到删除选项');
        return false;
      }

      deleteOption.click();
      await delay(speedConfig.actionDelay);

      // 确认删除（如果有确认对话框）
      const confirmButton = await waitForElement(SELECTORS.confirmDelete, 2000);
      if (confirmButton) {
        confirmButton.click();
        await delay(speedConfig.actionDelay);
      }

      console.log('[Tweet Deleter] 成功删除一条内容');
      return true;
    } catch (error) {
      console.error('[Tweet Deleter] 删除失败:', error);
      return false;
    }
  }

  // 执行批量删除
  async function deleteAll(settings) {
    if (scannedTweets.length === 0) {
      chrome.runtime.sendMessage({ action: 'complete', deleted: 0, failed: 0 });
      return;
    }

    isRunning = true;
    shouldStop = false;
    const speedConfig = SPEED_CONFIG[settings.options.speed] || SPEED_CONFIG.normal;
    let deleted = 0;
    let failed = 0;

    console.log(`[Tweet Deleter] 开始删除 ${scannedTweets.length} 条内容...`);

    for (let i = 0; i < scannedTweets.length; i++) {
      if (shouldStop) {
        console.log('[Tweet Deleter] 用户停止了删除操作');
        break;
      }

      const tweetInfo = scannedTweets[i];

      // 重新查找元素（因为DOM可能已更新）
      const currentTweets = document.querySelectorAll(SELECTORS.tweet);
      let foundTweet = null;

      for (const tweet of currentTweets) {
        const tweetLink = tweet.querySelector('a[href*="/status/"]');
        const tweetId = tweetLink ? tweetLink.href : tweet.textContent.substring(0, 100);
        if (tweetId === tweetInfo.id) {
          foundTweet = tweet;
          break;
        }
      }

      if (!foundTweet) {
        // 推文可能已被删除或不在视图中，尝试滚动查找
        console.log('[Tweet Deleter] 推文不在当前视图中，跳过');
        failed++;
      } else {
        tweetInfo.element = foundTweet;
        const success = await deleteTweet(tweetInfo, speedConfig);
        if (success) {
          deleted++;
        } else {
          failed++;
        }
      }

      // 发送进度更新
      chrome.runtime.sendMessage({
        action: 'progress',
        deleted: deleted,
        failed: failed,
        total: scannedTweets.length
      });

      // 批次间隔
      if ((i + 1) % settings.options.batchSize === 0) {
        console.log(`[Tweet Deleter] 已处理 ${i + 1} 条，暂停一下...`);
        await delay(speedConfig.scrollDelay * 2);
      }
    }

    isRunning = false;
    console.log(`[Tweet Deleter] 删除完成: 成功 ${deleted}, 失败 ${failed}`);

    chrome.runtime.sendMessage({
      action: 'complete',
      deleted: deleted,
      failed: failed
    });
  }

  // 消息监听器
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Tweet Deleter] 收到消息:', message.action);

    if (message.action === 'scan') {
      currentSettings = message.settings;
      scanTweets(message.settings).then(count => {
        sendResponse({ success: true, count: count });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true; // 保持消息通道开放
    }

    if (message.action === 'delete') {
      currentSettings = message.settings;
      deleteAll(message.settings);
      sendResponse({ success: true });
      return true;
    }

    if (message.action === 'stop') {
      shouldStop = true;
      sendResponse({ success: true });
      return true;
    }

    return false;
  });

  console.log('[Tweet Deleter] Content script 已加载');
})();
