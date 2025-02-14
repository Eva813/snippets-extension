// utils.ts
export function stripHtml(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}
