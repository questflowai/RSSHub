import { Route } from '@/types';
import cache from '@/utils/cache';
import utils from './utils';
import { config } from '@/config';
import { parseDate } from '@/utils/parse-date';
import ConfigNotFoundError from '@/errors/types/config-not-found';

export const route: Route = {
    path: '/search_video/:q/:embed?',
    categories: ['social-media'],
    example: '/youtube/search_video/questflow',
    parameters: { q: 'The q parameter specifies the query term to search for.', embed: 'Default to embed the video, set to any value to disable embedding' },
    features: {
        requireConfig: [
            {
                name: 'YOUTUBE_KEY',
                description: ' YouTube API Key, support multiple keys, split them with `,`, [API Key application](https://console.developers.google.com/)',
            },
        ],
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Playlist',
    maintainers: ['HenryQW'],
    handler,
};

async function handler(ctx) {
    if (!config.youtube || !config.youtube.key) {
        throw new ConfigNotFoundError('YouTube RSS is disabled due to the lack of <a href="https://docs.rsshub.app/deploy/config#route-specific-configurations">relevant config</a>');
    }
    const q = ctx.req.param('q');
    const searchResult = (
        await utils.searchResultWithKeywords(
            q,
            'snippet',
            {
                type: ['video'],
            },
            cache
        )
    ).data.items;

    return {
        title: `Video search ${q} result - YouTube`,
        link: `https://www.youtube.com/results?search_query=${q}&sp=EgIQAQ%253D%253D`,
        description: `YouTube video search result`,
        item: searchResult.map((item) => {
            const snippet = item.snippet;
            const videoId = item.id.videoId;
            const img = utils.getThumbnail(snippet.thumbnails);
            return {
                title: snippet.title,
                description: snippet.description,
                pubDate: parseDate(snippet.publishedAt),
                link: `https://www.youtube.com/watch?v=${videoId}`,
                author: snippet.videoOwnerChannelTitle,
                image: img.url,
            };
        }),
    };
}
