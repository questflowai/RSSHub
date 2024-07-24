import { Readability } from '@mozilla/readability';
import { gfm } from 'turndown-plugin-gfm';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';

const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
});

turndownService.use(gfm);

const getExt = (node) => {
    // Simple match where the <pre> has the `highlight-source-js` tags
    const getFirstTag = (node) => node.outerHTML.split('>').shift() + '>';
    const match = node.outerHTML.match(/(highlight-source-|language-)[a-z]+/);
    if (match) {
        return match[0].split('-').pop();
    }
    // Check the parent just in case
    const parent = getFirstTag(node.parentNode).match(/(highlight-source-|language-)[a-z]+/);
    if (parent) {
        return parent[0].split('-').pop();
    }
    const getInnerTag = (node) => node.innerHTML.split('>').shift() + '>';
    const inner = getInnerTag(node).match(/(highlight-source-|language-)[a-z]+/);
    if (inner) {
        return inner[0].split('-').pop();
    }
    // Nothing was found...
    return '';
};

turndownService.addRule('fenceAllPreformattedText', {
    filter: ['pre'],

    replacement(content, node) {
        const ext = getExt(node);

        const code = [...node.childNodes].map((c) => c.textContent).join('');

        return `\n\`\`\`${ext}\n${code}\n\`\`\`\n\n`;
    },
});

turndownService.addRule('strikethrough', {
    filter: ['del', 's'],

    replacement(content) {
        return '~' + content + '~';
    },
});
function extract_from_dom(dom) {
    const article = new Readability(dom.window.document, {
        keepClasses: true,
        debug: false,
        charThreshold: 100,
    }).parse();

    if (!article) {
        throw new Error('Failed to parse article');
    }
    // remove HTML comments
    article.content = article.content.replaceAll(/(<!--.*?-->)/g, '');

    // Try to add proper h1 if title is missing
    if (article.title.length > 0) {
        // check if first h2 is the same as title
        const h2Regex = /<h2[^>]*>(.*?)<\/h2>/;
        const match = article.content.match(h2Regex);
        // eslint-disable-next-line unicorn/prefer-ternary
        if (match?.[0].includes(article.title)) {
            // replace fist h2 with h1
            article.content = article.content.replace('<h2', '<h1').replace('</h2', '</h1');
        } else {
            // add title as h1
            article.content = `<h1>${article.title}</h1>\n${article.content}`;
        }
    }
    // contert to markdown
    let res = turndownService.turndown(article.content);

    // replace weird header refs
    const pattern = /\[]\(#[^)]*\)/g;
    res = res.replaceAll(pattern, '');
    return res;
}

function extractFromHtml(html) {
    const dom = new JSDOM(html);
    return extract_from_dom(dom);
}

export default extractFromHtml;
