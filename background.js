// Tweet Deleter - Background Service Worker
// 处理后台任务、API 调用和认证信息获取

// 存储认证信息
let authInfo = {
  bearerToken: null,
  csrfToken: null,
  cookies: null
};

// GraphQL API 端点（Twitter/X 的删除推文接口）
const GRAPHQL_ENDPOINTS = {
  deleteTweet: 'https://x.com/i/api/graphql/VaenaVgh5q5ih7kvyVjgtg/DeleteTweet',
  // 备用端点
  deleteTweetAlt: 'https://twitter.com/i/api/graphql/VaenaVgh5q5ih7kvyVjgtg/DeleteTweet'
};

// 从页面获取认证信息
async function getAuthFromPage(tabId) {
  try {
    // 注入脚本获取页面上的认证信息
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // 从页面获取 CSRF token
        const csrfToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('ct0='))
          ?.split('=')[1];

        // 尝试从 React 内部状态获取 Bearer token
        let bearerToken = null;

        // 方法1: 从 script 标签中查找
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const text = script.textContent || '';
          const match = text.match(/Bearer\s+([A-Za-z0-9%]+)/);
          if (match) {
            bearerToken = match[1];
            break;
          }
        }

        // 方法2: 从 window 对象查找
        if (!bearerToken && window.__INITIAL_STATE__) {
          try {
            const state = JSON.parse(JSON.stringify(window.__INITIAL_STATE__));
            // 尝试从状态中提取
          } catch (e) {}
        }

        return { csrfToken, bearerToken };
      }
    });

    if (results && results[0] && results[0].result) {
      const { csrfToken, bearerToken } = results[0].result;
      if (csrfToken) {
        authInfo.csrfToken = csrfToken;
      }
      if (bearerToken) {
        authInfo.bearerToken = bearerToken;
      }
    }
  } catch (error) {
    console.error('[Tweet Deleter] 获取认证信息失败:', error);
  }
}

// 获取 cookies
async function getCookies() {
  try {
    const cookies = await chrome.cookies.getAll({ domain: '.x.com' });
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    authInfo.cookies = cookieString;

    // 从 cookies 中提取 CSRF token
    const ct0Cookie = cookies.find(c => c.name === 'ct0');
    if (ct0Cookie) {
      authInfo.csrfToken = ct0Cookie.value;
    }

    return cookieString;
  } catch (error) {
    console.error('[Tweet Deleter] 获取 cookies 失败:', error);
    return null;
  }
}

// 使用固定的 Bearer Token（Twitter Web App 的公开 token）
function getDefaultBearerToken() {
  // 这是 Twitter Web App 使用的公开 Bearer Token
  return 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
}

// 删除推文 API
async function deleteTweetById(tweetId) {
  // 确保有认证信息
  if (!authInfo.csrfToken) {
    await getCookies();
  }

  const bearerToken = authInfo.bearerToken || getDefaultBearerToken();

  if (!authInfo.csrfToken) {
    throw new Error('无法获取认证信息，请确保已登录 X');
  }

  const headers = {
    'authorization': `Bearer ${bearerToken}`,
    'content-type': 'application/json',
    'x-csrf-token': authInfo.csrfToken,
    'x-twitter-active-user': 'yes',
    'x-twitter-auth-type': 'OAuth2Session',
    'x-twitter-client-language': 'zh-cn'
  };

  const body = JSON.stringify({
    variables: {
      tweet_id: tweetId,
      dark_request: false
    },
    queryId: 'VaenaVgh5q5ih7kvyVjgtg'
  });

  try {
    const response = await fetch(GRAPHQL_ENDPOINTS.deleteTweet, {
      method: 'POST',
      headers: headers,
      body: body,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Tweet Deleter] API 响应错误:', response.status, errorText);
      throw new Error(`API 错误: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Tweet Deleter] 删除成功:', tweetId);
    return { success: true, data };
  } catch (error) {
    console.error('[Tweet Deleter] 删除失败:', error);
    throw error;
  }
}

// 取消转发 API
async function unretweetById(tweetId) {
  if (!authInfo.csrfToken) {
    await getCookies();
  }

  const bearerToken = authInfo.bearerToken || getDefaultBearerToken();

  if (!authInfo.csrfToken) {
    throw new Error('无法获取认证信息，请确保已登录 X');
  }

  const headers = {
    'authorization': `Bearer ${bearerToken}`,
    'content-type': 'application/json',
    'x-csrf-token': authInfo.csrfToken,
    'x-twitter-active-user': 'yes',
    'x-twitter-auth-type': 'OAuth2Session',
    'x-twitter-client-language': 'zh-cn'
  };

  // 取消转发的 GraphQL 请求
  const body = JSON.stringify({
    variables: {
      source_tweet_id: tweetId,
      dark_request: false
    },
    queryId: 'iQtK4dl5hBmXewYZuEOKVw'
  });

  try {
    const response = await fetch('https://x.com/i/api/graphql/iQtK4dl5hBmXewYZuEOKVw/UnretweetTweet', {
      method: 'POST',
      headers: headers,
      body: body,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Tweet Deleter] 取消转发 API 响应错误:', response.status, errorText);
      throw new Error(`API 错误: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Tweet Deleter] 取消转发成功:', tweetId);
    return { success: true, data };
  } catch (error) {
    console.error('[Tweet Deleter] 取消转发失败:', error);
    throw error;
  }
}

// 监听扩展安装
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Tweet Deleter] 扩展已安装');
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

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Tweet Deleter] 收到消息:', message.action);

  // 初始化认证信息
  if (message.action === 'initAuth') {
    const tabId = sender.tab?.id;
    if (tabId) {
      Promise.all([getAuthFromPage(tabId), getCookies()])
        .then(() => {
          sendResponse({
            success: true,
            hasAuth: !!authInfo.csrfToken
          });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
    } else {
      getCookies().then(() => {
        sendResponse({ success: true, hasAuth: !!authInfo.csrfToken });
      });
    }
    return true;
  }

  // 删除推文
  if (message.action === 'deleteTweet') {
    deleteTweetById(message.tweetId)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  // 取消转发
  if (message.action === 'unretweet') {
    unretweetById(message.tweetId)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  // 转发进度消息
  if (message.action === 'progress' || message.action === 'complete' || message.action === 'error') {
    return false;
  }

  return false;
});

// 监听标签页更新，在 Twitter 页面时刷新认证信息
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isTwitter = tab.url.includes('twitter.com') || tab.url.includes('x.com');

    if (isTwitter) {
      // 刷新认证信息
      getCookies();
      getAuthFromPage(tabId);

      chrome.action.setBadgeText({ tabId: tabId, text: '' });
      chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: '#1d9bf0' });
    }
  }
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(async (tab) => {
  // 检查是否在 Twitter/X 页面
  const isTwitter = tab.url && (tab.url.includes('twitter.com') || tab.url.includes('x.com'));

  if (!isTwitter) {
    // 如果不在 Twitter 页面，打开 Twitter
    chrome.tabs.create({ url: 'https://x.com' });
    return;
  }

  // 向 content script 发送消息，切换面板显示状态
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
  } catch (error) {
    console.log('[Tweet Deleter] Content script 未加载，尝试注入');
    // 如果 content script 未加载，尝试注入
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['panel.css']
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      // 注入后再次尝试显示面板
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
        } catch (e) {
          console.error('[Tweet Deleter] 无法显示面板:', e);
        }
      }, 500);
    } catch (e) {
      console.error('[Tweet Deleter] 注入脚本失败:', e);
    }
  }
});

console.log('[Tweet Deleter] Background service worker 已启动');
