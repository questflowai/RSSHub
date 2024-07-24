import { load } from 'cheerio';

import { Data, Route } from '@/types';
import cache from '@/utils/cache';
import parser from '@/utils/rss-parser';
import got from '@/utils/got';
import extractFromHtml from '@/utils/html-to-md';

const host = 'https://techcrunch.com';

async function handler() {
    const rssUrl = `${host}/category/startups/feed`;
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
        title: 'TechCrunch - Startups News',
        link: host,
        description:
            'Tech startup news that breaks down the funding, growth, and long-term trajectory of companies across every stage and industry. Startup coverage includes climate, crypto, fintech, SaaS, transportation, and consumer tech.',
        item: items,
    } as Data;
}

export const route: Route = {
    path: '/startups',
    categories: ['new-media'],
    example: '/techcrunch/startups',
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
    name: 'Startups News',
    maintainers: ['GoDotDotDot'],
    handler,
    url: 'techcrunch.com/',
};
