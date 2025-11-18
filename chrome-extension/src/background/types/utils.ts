import type { RuntimeMessage, ExtractMessage } from './messages';
import type { AnyResponse } from './responses';

// 通用訊息處理器類型
export type MessageHandler<T extends RuntimeMessage = RuntimeMessage, R extends AnyResponse = AnyResponse> = (
  message: T,
  sendResponse: (response?: R) => void,
) => Promise<void> | void;

// 特定 action 的處理器類型
export type ActionHandler<A extends RuntimeMessage['action'], R extends AnyResponse = AnyResponse> = MessageHandler<
  ExtractMessage<RuntimeMessage, A>,
  R
>;

// 建立類型安全的處理器註冊函數
export interface HandlerRegistration<A extends RuntimeMessage['action']> {
  action: A;
  handler: ActionHandler<A>;
}

// 類型安全的訊息路由器介面
export interface TypedMessageRouter {
  register<A extends RuntimeMessage['action']>(action: A, handler: ActionHandler<A>): void;

  route(
    message: RuntimeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: AnyResponse) => void,
  ): Promise<void>;
}

// 工具類型：獲取處理器的參數類型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HandlerMessage<T extends MessageHandler> = T extends MessageHandler<infer M, any> ? M : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HandlerResponse<T extends MessageHandler> = T extends MessageHandler<any, infer R> ? R : never;

// 工具類型：檢查 action 是否存在
export type ValidAction = RuntimeMessage['action'];
export type IsValidAction<A extends string> = A extends ValidAction ? true : false;
