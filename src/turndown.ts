import TurndownService from 'turndown'

export const htmlToMarkdown = (html: string): string => {

  const turndownService = new TurndownService();
  // turndownService.addRule('img', {
  //   filter: ['img'],
  //   replacement: function (content, node) {
  //     const alt = node.alt || '';
  //     const src = node.src || '';
  //     return `![${alt}](${src})`;
  //   }
  // });

  // turndownService.addRule('a', {
  //   filter: ['a'],
  //   replacement: function (content, node) {
  //     const href = node.href || '';
  //     return `[${content}](${href})`;
  //   }
  // });

  return turndownService.turndown(html);
}