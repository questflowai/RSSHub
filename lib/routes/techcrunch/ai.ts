import { load } from 'cheerio';

import { Data, Route } from '@/types';
import cache from '@/utils/cache';
import parser from '@/utils/rss-parser';
import got from '@/utils/got';
import extractFromHtml from '@/utils/html-to-md';

const host = 'https://techcrunch.com';

async function handler() {
    const rssUrl = `${host}/category/artificial-intelligence/feed`;
    const feed = await parser.parseURL(rssUrl);
    const items = await Promise.all(
        feed.items.map((item) =>
            cache.tryGet(item.link as string, async () => {
                const url = item.link;
                const response = await got({
                    url,
                    method: 'get',
                });
                const html = response.data;
                const $ = load(html);
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

    return {
        title: 'TechCrunch - AI News',
        link: host,
        description:
            'News coverage on artificial intelligence and machine learning tech, the companies building them, and the ethical issues AI raises today. This encompasses generative AI, including large language models, text-to-image and text-to-video models; speech recognition and generation; and predictive analytics.',
        item: items,
    } as Data;
}

export const route: Route = {
    path: '/ai',
    categories: ['new-media'],
    example: '/techcrunch/ai',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['techcrunch.com/'],
        },
    ],
    name: 'AI News',
    maintainers: ['GoDotDotDot'],
    handler,
    url: 'techcrunch.com/',
};
