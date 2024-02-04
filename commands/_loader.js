let _list = {
    autopush: require('./autopush/index'),
    boorudl: require('./boorudl/index'),
    deploy: require('./deploy/index'),
    derpilist: require('./derpilist/index'),
    help: require('./help/index'),
    thingit: require('./thingit/index'),
    update: require('./update/index'),
    version: require('./version/index'),
};
/*
try {
    _list.musicdl = require('./musicdl/index');
} catch (e) {
    _list.musicdl = null;
}
*/
module.exports = _list;