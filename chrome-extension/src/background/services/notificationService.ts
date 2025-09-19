// 安全的通知選項類型，確保所有必需屬性都存在
interface SafeNotificationOptions {
  type: chrome.notifications.TemplateType;
  iconUrl: string;
  title: string;
  message: string;
}

export class NotificationService {
  static async showSuccess(title: string, message: string): Promise<void> {
    if (chrome.notifications?.create) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon-34.png',
        title: `✅ ${title}`,
        message,
      });
    }
  }

  static async showError(title: string, message: string): Promise<void> {
    if (chrome.notifications?.create) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon-34-gray.png',
        title: `❌ ${title}`,
        message,
      });
    }
  }

  static async showWarning(title: string, message: string): Promise<void> {
    if (chrome.notifications?.create) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon-34.png',
        title: `⚠️ ${title}`,
        message,
      });
    }
  }

  static async showInfo(title: string, message: string): Promise<void> {
    if (chrome.notifications?.create) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon-34.png',
        title: `ℹ️ ${title}`,
        message,
      });
    }
  }

  static async create(options: SafeNotificationOptions): Promise<string> {
    // 驗證必需參數
    if (!options.iconUrl || !options.title || !options.message || !options.type) {
      throw new Error('Missing required notification parameters');
    }

    return new Promise((resolve, reject) => {
      if (chrome.notifications?.create) {
        chrome.notifications.create(options, notificationId => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(notificationId);
          }
        });
      } else {
        reject(new Error('Notifications API not available'));
      }
    });
  }
}
