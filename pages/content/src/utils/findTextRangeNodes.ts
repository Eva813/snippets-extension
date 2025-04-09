/**
 * 尋找在一個 root 元素中，對應於 start / end 字元位置的文字節點與 offset。
 * @param root 要遍歷的根元素（例如 contenteditable 區塊）
 * @param start 開始的文字索引位置
 * @param end 結束的文字索引位置
 * @returns 範圍的起點節點/位移與終點節點/位移
 */
export function findTextRangeNodes(
  root: HTMLElement,
  start: number,
  end: number,
): {
  startNode: Node | null;
  endNode: Node | null;
  startOffset: number;
  endOffset: number;
} {
  let currentNode: Node | null = root.firstChild;
  let currentOffset = 0;

  let startNode: Node | null = null;
  let endNode: Node | null = null;
  let startOffset = 0;
  let endOffset = 0;

  while (currentNode && (!startNode || !endNode)) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      const textLength = currentNode.textContent?.length ?? 0;

      if (!startNode && currentOffset + textLength > start) {
        startNode = currentNode;
        startOffset = start - currentOffset;
      }

      if (!endNode && currentOffset + textLength >= end) {
        endNode = currentNode;
        endOffset = end - currentOffset;
        break;
      }

      currentOffset += textLength;
    }

    // 探索子節點，否則往兄弟或祖先找
    currentNode = currentNode.firstChild ?? getNextNode(currentNode, root);
  }

  return { startNode, endNode, startOffset, endOffset };
}

function getNextNode(node: Node, root: Node): Node | null {
  while (node && node !== root && !node.nextSibling) {
    node = node.parentNode as Node;
  }
  return node !== root ? (node?.nextSibling ?? null) : null;
}
