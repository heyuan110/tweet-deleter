// Tweet Deleter - Background Service Worker
// 处理后台任务和扩展生命周期

// 监听扩展安装
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Tweet Deleter] 扩展已安装');
    // 设置默认配置
    chrome.storage.local.set({
      tweetDeleterSettings: {
        contentTypes: {
          tweets: true,
          replies: false,
          reposts: false
        },
        keywords: {
          list: [],
          exclude: false
        },
        options: {
          speed: 'normal',
          batchSize: 25,
          confirmEach: false
        }
      }
    });
  } else if (details.reason === 'update') {
    console.log('[Tweet Deleter] 扩展已更新到版本', chrome.runtime.getManifest().version);
  }
});

// 监听来自content script的消息并转发到popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 转发进度消息
  if (message.action === 'progress' || message.action === 'complete' || message.action === 'error') {
    // 消息会自动广播到所有监听器
    return false;
  }
  return false;
});

// 监听标签页更新，在Twitter页面时显示徽章
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isTwitter = tab.url.includes('twitter.com') || tab.url.includes('x.com');

    if (isTwitter) {
      // 在Twitter页面显示激活状态
      chrome.action.setBadgeText({ tabId: tabId, text: '' });
      chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: '#1d9bf0' });
    }
  }
});

console.log('[Tweet Deleter] Background service worker 已启动');
