// Tweet Deleter - 弹窗脚本
// 管理用户界面交互和与content script的通信

// 状态管理
let isDeleting = false;
let deletionStats = {
  total: 0,
  deleted: 0,
  failed: 0
};

// DOM 元素引用
const elements = {};

// 初始化 DOM 元素引用
function initElements() {
  elements.typeTweets = document.getElementById('type-tweets');
  elements.typeReplies = document.getElementById('type-replies');
  elements.typeReposts = document.getElementById('type-reposts');
  elements.dateFrom = document.getElementById('date-from');
  elements.dateTo = document.getElementById('date-to');
  elements.quickBtns = document.querySelectorAll('.quick-btn');
  elements.keywords = document.getElementById('keywords');
  elements.excludeKeywords = document.getElementById('exclude-keywords');
  elements.deleteSpeed = document.getElementById('delete-speed');
  elements.batchSize = document.getElementById('batch-size');
  elements.confirmEach = document.getElementById('confirm-each');
  elements.btnScan = document.getElementById('btn-scan');
  elements.btnDelete = document.getElementById('btn-delete');
  elements.btnStop = document.getElementById('btn-stop');
  elements.statusBar = document.getElementById('status-bar');
  elements.statusText = document.getElementById('status-text');
  elements.progressSection = document.getElementById('progress-section');
  elements.progressFill = document.getElementById('progress-fill');
  elements.progressText = document.getElementById('progress-text');
  elements.resultSection = document.getElementById('result-section');
  elements.statTotal = document.getElementById('stat-total');
  elements.statDeleted = document.getElementById('stat-deleted');
  elements.statFailed = document.getElementById('stat-failed');
  elements.collapsible = document.querySelector('.collapsible');
}

// 国际化翻译函数
function getMessage(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

// 应用多语言翻译
function applyI18n() {
  // 翻译所有带 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const message = getMessage(key);
    if (message && message !== key) {
      el.textContent = message;
    }
  });

  // 翻译 placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const message = getMessage(key);
    if (message && message !== key) {
      el.placeholder = message;
    }
  });

  // 翻译 select option
  document.querySelectorAll('select option[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const message = getMessage(key);
    if (message && message !== key) {
      el.textContent = message;
    }
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initElements();
  applyI18n();
  initDateInputs();
  initQuickSelectButtons();
  initCollapsible();
  initActionButtons();
  loadSavedSettings();
  checkCurrentPage();
});

// 初始化日期输入框（默认设置为今天）
function initDateInputs() {
  const today = new Date().toISOString().split('T')[0];
  elements.dateTo.value = today;
  elements.dateTo.max = today;
  elements.dateFrom.max = today;
}

// 初始化快速选择按钮
function initQuickSelectButtons() {
  elements.quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.quickBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const range = btn.dataset.range;
      const today = new Date();

      if (range === 'all') {
        elements.dateFrom.value = '';
        elements.dateTo.value = '';
      } else {
        const days = parseInt(range);
        const fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - days);

        elements.dateFrom.value = fromDate.toISOString().split('T')[0];
        elements.dateTo.value = today.toISOString().split('T')[0];
      }
    });
  });
}

// 初始化折叠区域
function initCollapsible() {
  const header = elements.collapsible.querySelector('.collapsible-header');
  header.addEventListener('click', () => {
    elements.collapsible.classList.toggle('open');
  });
}

// 初始化操作按钮
function initActionButtons() {
  elements.btnScan.addEventListener('click', handleScan);
  elements.btnDelete.addEventListener('click', handleDelete);
  elements.btnStop.addEventListener('click', handleStop);
}

// 检查当前页面是否是 Twitter/X
async function checkCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const isTwitter = tab.url && (tab.url.includes('twitter.com') || tab.url.includes('x.com'));

    if (!isTwitter) {
      showStatus(getMessage('statusOpenTwitter'), 'warning');
      elements.btnScan.disabled = true;
    }
  } catch (error) {
    console.error('检查页面失败:', error);
  }
}

// 获取当前设置
function getSettings() {
  return {
    contentTypes: {
      tweets: elements.typeTweets.checked,
      replies: elements.typeReplies.checked,
      reposts: elements.typeReposts.checked
    },
    timeRange: {
      from: elements.dateFrom.value || null,
      to: elements.dateTo.value || null
    },
    keywords: {
      list: elements.keywords.value.split(',').map(k => k.trim()).filter(k => k),
      exclude: elements.excludeKeywords.checked
    },
    options: {
      speed: elements.deleteSpeed.value,
      batchSize: parseInt(elements.batchSize.value),
      confirmEach: elements.confirmEach.checked
    }
  };
}

// 保存设置到本地存储
function saveSettings() {
  const settings = getSettings();
  chrome.storage.local.set({ tweetDeleterSettings: settings });
}

// 加载保存的设置
async function loadSavedSettings() {
  try {
    const result = await chrome.storage.local.get('tweetDeleterSettings');
    if (result.tweetDeleterSettings) {
      const settings = result.tweetDeleterSettings;

      if (settings.contentTypes) {
        elements.typeTweets.checked = settings.contentTypes.tweets ?? true;
        elements.typeReplies.checked = settings.contentTypes.replies ?? false;
        elements.typeReposts.checked = settings.contentTypes.reposts ?? false;
      }

      if (settings.keywords) {
        elements.keywords.value = settings.keywords.list?.join(', ') || '';
        elements.excludeKeywords.checked = settings.keywords.exclude ?? false;
      }

      if (settings.options) {
        elements.deleteSpeed.value = settings.options.speed || 'normal';
        elements.batchSize.value = settings.options.batchSize?.toString() || '25';
        elements.confirmEach.checked = settings.options.confirmEach ?? false;
      }
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
}

// 显示状态信息
function showStatus(message, type = 'info') {
  elements.statusBar.className = `status-bar ${type}`;
  elements.statusText.textContent = message;
  elements.statusBar.classList.remove('hidden');
}

// 隐藏状态信息
function hideStatus() {
  elements.statusBar.classList.add('hidden');
}

// 更新进度
function updateProgress(deleted, total) {
  const percent = total > 0 ? (deleted / total) * 100 : 0;
  elements.progressFill.style.width = `${percent}%`;
  elements.progressText.textContent = `${getMessage('deleted')}: ${deleted} / ${total}`;
}

// 显示结果统计
function showResults() {
  elements.statTotal.textContent = deletionStats.total;
  elements.statDeleted.textContent = deletionStats.deleted;
  elements.statFailed.textContent = deletionStats.failed;
  elements.resultSection.classList.remove('hidden');
}

// 处理扫描操作
async function handleScan() {
  const settings = getSettings();
  if (!settings.contentTypes.tweets && !settings.contentTypes.replies && !settings.contentTypes.reposts) {
    showStatus(getMessage('selectContentType'), 'error');
    return;
  }

  saveSettings();
  showStatus(getMessage('statusScanning'), 'info');
  elements.btnScan.disabled = true;
  elements.btnScan.classList.add('loading');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 先注入content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'scan',
      settings: settings
    });

    if (response && response.success) {
      deletionStats.total = response.count;
      const foundMsg = getMessage('statusFound').replace('$COUNT$', response.count);
      showStatus(foundMsg, 'success');
      elements.btnDelete.disabled = response.count === 0;
    } else {
      showStatus(response?.error || getMessage('statusScanFailed'), 'error');
    }
  } catch (error) {
    console.error('扫描失败:', error);
    showStatus(getMessage('statusScanFailed'), 'error');
  } finally {
    elements.btnScan.disabled = false;
    elements.btnScan.classList.remove('loading');
  }
}

// 处理删除操作
async function handleDelete() {
  const settings = getSettings();

  if (settings.options.confirmEach) {
    const confirmMsg = getMessage('confirmDelete').replace('$COUNT$', deletionStats.total);
    const confirmed = confirm(confirmMsg);
    if (!confirmed) return;
  }

  isDeleting = true;
  deletionStats.deleted = 0;
  deletionStats.failed = 0;

  elements.btnScan.disabled = true;
  elements.btnDelete.disabled = true;
  elements.progressSection.classList.remove('hidden');
  elements.resultSection.classList.add('hidden');
  updateProgress(0, deletionStats.total);
  showStatus(getMessage('statusDeleting'), 'info');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, {
      action: 'delete',
      settings: settings
    });

    chrome.runtime.onMessage.addListener(handleProgressUpdate);

  } catch (error) {
    console.error('删除失败:', error);
    showStatus(getMessage('statusScanFailed'), 'error');
    resetDeleteState();
  }
}

// 处理进度更新
function handleProgressUpdate(message) {
  if (message.action === 'progress') {
    deletionStats.deleted = message.deleted;
    deletionStats.failed = message.failed;
    updateProgress(message.deleted + message.failed, deletionStats.total);
  } else if (message.action === 'complete') {
    showStatus(getMessage('statusDeleteComplete'), 'success');
    showResults();
    resetDeleteState();
    chrome.runtime.onMessage.removeListener(handleProgressUpdate);
  } else if (message.action === 'error') {
    showStatus(message.error || getMessage('statusScanFailed'), 'error');
    showResults();
    resetDeleteState();
    chrome.runtime.onMessage.removeListener(handleProgressUpdate);
  }
}

// 处理停止操作
async function handleStop() {
  if (!isDeleting) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action: 'stop' });
    showStatus(getMessage('statusStopped'), 'warning');
    showResults();
    resetDeleteState();
  } catch (error) {
    console.error('停止失败:', error);
  }
}

// 重置删除状态
function resetDeleteState() {
  isDeleting = false;
  elements.btnScan.disabled = false;
  elements.btnDelete.disabled = true;
}
