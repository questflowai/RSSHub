import { Route } from '@/types';
import extractFromHtml from '@/utils/html-to-md';
import parser from '@/utils/rss-parser';

export const route: Route = {
    path: '/r/:community?',
    categories: ['social-media'],
    example: '/reddit/r/ArtificialInteligence',
    parameters: {
        community: 'reddit community name',
    },
    features: {
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Reddit Community',
    maintainers: ['Questflow'],
    handler,
    radar: [
        {
            source: ['reddit.com/r/:community'],
            target: '/r/:community',
        },
    ],
};

async function handler(ctx) {
    const community = ctx.req.param('community');
    const rssUrl = `https://www.reddit.com/r/${community}/.rss`;
    const feed = await parser.parseURL(rssUrl);

    return {
        title: feed.title,
        link: feed.link,
        item: feed.items.map((item) => ({
            title: item.title,
            pubDate: item.pubDate,
            link: item.link,
            category: item.categories,
            description: extractFromHtml(item.content),
            // @ts-ignore
            author: item.author as string,
        })),
    };
}
