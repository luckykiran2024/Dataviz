/* ======================================================
   Simple Markdown Renderer
   Converts markdown to HTML for rendering AI responses.
   ====================================================== */

export function renderMarkdown(md) {
  if (!md) return '';
  let html = md;

  // Escape HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (match) => {
    const cells = match.split('|').filter(c => c.trim());
    return '<tr>' + cells.map(c => {
      if (/^[\s-:]+$/.test(c.trim())) return null; // separator row
      return `<td>${c.trim()}</td>`;
    }).filter(Boolean).join('') + '</tr>';
  });
  // Wrap consecutive tr elements in table
  html = html.replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, (match) => {
    // Convert first row's td to th
    const rows = match.trim().split('\n').filter(r => r.trim());
    if (rows.length > 0) {
      rows[0] = rows[0].replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
      // Remove separator rows (rows with only dashes)
      const filtered = rows.filter(r => !r.includes('<td>---') && !r.includes('<td> ---') && !r.includes('<td>:---'));
      return '<div class="ai-table-wrap"><table class="ai-table">' + filtered.join('\n') + '</table></div>';
    }
    return match;
  });

  // Lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ol-item">$1</li>');
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  // Wrap consecutive li items
  html = html.replace(/(<li class="ol-item">[\s\S]*?<\/li>\n?)+/g, '<ol>$&</ol>');
  html = html.replace(/(<li>(?!class)[\s\S]*?<\/li>\n?)+/g, '<ul>$&</ul>');
  html = html.replace(/ class="ol-item"/g, '');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Paragraphs (lines that aren't already wrapped)
  html = html.replace(/^(?!<[houlpdt]|<pre|<hr|<div|<table)([\s\S]+?)$/gm, (match) => {
    if (match.trim()) return `<p>${match.trim()}</p>`;
    return '';
  });

  // Line breaks
  html = html.replace(/\n\n+/g, '\n');

  return html;
}
