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
    } catch (error: any) {
      logger.error(`處理訊息時發生錯誤: ${message.action}`, error);
      sendResponse({ success: false, error: error.message || 'Unknown error' });
    }
  }

  setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
      (async () => {
        await this.route(message, sender, sendResponse);
      })();
      return true; // 保持 sendResponse 通道開啟
    });
  }
}
