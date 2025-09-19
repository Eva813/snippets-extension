interface PopupData {
  title: string;
  content: string | Record<string, unknown>;
  contentJSON?: unknown;
}

export class StateManager {
  private static popupData: PopupData | null = null;
  private static targetTabId: number | null | undefined = null;

  static setPopupData(data: PopupData): void {
    this.popupData = data;
  }

  static getPopupData(): PopupData | null {
    return this.popupData;
  }

  static clearPopupData(): void {
    this.popupData = null;
  }

  static setTargetTabId(id: number | null | undefined): void {
    this.targetTabId = id;
  }

  static getTargetTabId(): number | null | undefined {
    return this.targetTabId;
  }

  static clearTargetTabId(): void {
    this.targetTabId = null;
  }

  static clear(): void {
    this.popupData = null;
    this.targetTabId = null;
  }
}
