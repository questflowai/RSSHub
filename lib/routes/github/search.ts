import * as url from 'node:url';
import ConfigNotFoundError from '@/errors/types/config-not-found';
import { DataItem, Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { config } from '@/config';

const host = 'https://api.github.com';

export const route: Route = {
    path: '/search/:query/:sort?/:order?',
    categories: ['programming'],
    example: '/github/search/RSSHub/bestmatch/desc',
    parameters: { query: 'search keyword', sort: 'Sort options (default to bestmatch)', order: 'Sort order, desc and asc (desc descending by default)' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Search Result',
    maintainers: ['LogicJake'],
    handler,
    description: `| Sort options     | sort      |
  | ---------------- | --------- |
  | Best match       | bestmatch |
  | Most stars       | stars     |
  | Most forks       | forks     |
  | Recently updated | updated   |`,
};

async function handler(ctx) {
    if (!config.github || !config.github.access_token) {
        throw new ConfigNotFoundError('GitHub trending RSS is disabled due to the lack of <a href="https://docs.rsshub.app/deploy/config#route-specific-configurations">relevant config</a>');
    }
    const query = ctx.req.param('query');
    let sort = ctx.req.param('sort') || 'bestmatch';
    const order = ctx.req.param('order') || 'desc';

    if (sort === 'bestmatch') {
        sort = '';
    }

    const suffix = 'search/repositories?'.concat('&q=', encodeURIComponent(query), '&sort=', sort, '&order=', order);
    const link = url.resolve(host, suffix);
    const response = await ofetch(link, {
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${config.github.access_token}`,
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });

    const out = response.items.map(
        (item) =>
            ({
                title: item.name,
                author: item.owner?.login,
                link: item.html_url,
                description: item.description,
            }) as DataItem
    );

    return {
        allowEmpty: true,
        title: `${query}的搜索结果`,
        link,
        item: out,
    };
}
