const parser = require('@/utils/rss-parser');
const got = require('@/utils/got');
const cheerio = require('cheerio');
const extractFromHtml = require('@/utils/html-to-md');
const host = 'https://techcrunch.com';

module.exports = async (ctx) => {
    const rssUrl = `${host}/category/cryptocurrency/feed`;
    const feed = await parser.parseURL(rssUrl);
    const items = await Promise.all(
        feed.items.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const url = item.link;
                const response = await got({
                    url,
                    method: 'get',
                });
                const html = response.data;
                const $ = cheerio.load(html);
                const description = $('.wp-block-post-content');
                description.find('.wp-block-tc23-marfeel-experience').remove();
                description.find('.wp-block-embed').remove();
                const md = (await extractFromHtml(description.html())) || description.text();
                return {
                    title: item.title,
                    pubDate: item.pubDate,
                    link: item.link,
                    category: item.categories,
                    description: md,
                };
            })
        )
    );

    ctx.state.data = {
        title: 'TechCrunch Crypto News',
        link: host,
        description: 'Startup and Technology News',
        item: items,
    };
};
