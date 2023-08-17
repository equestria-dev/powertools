let _list = {
    autopush: require('./autopush/index'),
    backup: require('./backup/index'),
    boorudl: require('./boorudl/index'),
    derpilist: require('./derpilist/index'),
    derpisync: require('./derpisync/index'),
    help: require('./help/index'),
    iconer: require('./iconer/index'),
    musicdl: null,
    update: require('./update/index'),
    version: require('./version/index'),
};

try {
    _list.musicdl = require('./musicdl/index');
} catch (e) {
    _list.musicdl = null;
}

module.exports = _list;