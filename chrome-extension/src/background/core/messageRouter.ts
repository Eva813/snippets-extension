import { logger } from '../../../../packages/shared/lib/logging/logger';
import type { RuntimeMessage } from '../types/messages';
import type { AnyResponse } from '../types/responses';
import type { MessageHandler, TypedMessageRouter, ActionHandler } from '../types/utils';

export class MessageRouter implements TypedMessageRouter {
  private handlers = new Map<string, MessageHandler>();

  register<A extends RuntimeMessage['action']>(action: A, handler: ActionHandler<A>): void {
    this.handlers.set(action, handler as MessageHandler);
  }

  async route(
    message: RuntimeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: AnyResponse) => void,
  ): Promise<void> {
    const handler = this.handlers.get(message.action);

    if (!handler) {
      logger.warn(`未處理的 action: ${message.action}`);
      sendResponse({ success: false, error: `Unknown action: ${message.action}` });
      return;
    }

    try {
      await handler(message, sendResponse);
    } catch (error: unknown) {
      logger.error(`處理訊息時發生錯誤: ${message.action}`, error as Error);
      sendResponse({ success: false, error: (error as Error)?.message || 'Unknown error' });
    }
  }

  setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
      logger.log(`📨 Message received: action=${message.action}`);

      // 立即執行異步路由
      this.route(message, sender, sendResponse).catch(error => {
        logger.error('🔴 Unhandled error in message route:', error);
        try {
          sendResponse({ success: false, error: 'Unhandled error in message route' });
        } catch (e) {
          logger.warn('⚠️ sendResponse already called or connection closed');
        }
      });

      // 返回 true 以保持通道開啟（用於異步 sendResponse）
      return true;
    });

    logger.log('✅ chrome.runtime.onMessage listener setup complete');
  }
}
