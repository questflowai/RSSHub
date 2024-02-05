module.exports = (router) => {
    router.get('/news', require('./news'));
    router.get('/startup', require('./startup'));
    router.get('/ai', require('./ai'));
    router.get('/crypto', require('./crypto'));
    router.get('/venture', require('./venture'));
    router.get('/security', require('./security'));
    router.get('/app', require('./app'));
};
