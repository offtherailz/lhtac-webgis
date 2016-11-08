/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');
const ReactDOM = require('react-dom');

const {Provider} = require('react-redux');

const assign = require('object-assign');

const {loadMapConfig} = require('../MapStore2/web/client/actions/config');
const {changeBrowserProperties} = require('../MapStore2/web/client/actions/browser');
const {loadLocale} = require('../MapStore2/web/client/actions/locale');
const {loadPrintCapabilities} = require('../MapStore2/web/client/actions/print');

const ConfigUtils = require('../MapStore2/web/client/utils/ConfigUtils');
const LocaleUtils = require('../MapStore2/web/client/utils/LocaleUtils');
const PluginsUtils = require('../MapStore2/web/client/utils/PluginsUtils');

require('react-select/dist/react-select.css');

LocaleUtils.setSupportedLocales({
    "en": {
       code: "en-US",
       description: "English"
    }
});

function startApp() {
    const {plugins, requires} = require('./plugins.js');
    const store = require('./stores/store')(plugins);
    const App = require('./containers/App');

    store.dispatch(changeBrowserProperties(ConfigUtils.getBrowserProperties()));

    ConfigUtils
        .loadConfiguration()                       // localConfig.json: Global configuration
        .then(() => {                              // config.json: app configuration
            const { configUrl, legacy } = ConfigUtils.getUserConfiguration('config', 'json');
            store.dispatch(loadMapConfig(configUrl, legacy));

            let locale = LocaleUtils.getUserLocale();
            store.dispatch(loadLocale('translations', locale));
            store.dispatch(loadPrintCapabilities(ConfigUtils.getConfigProp('printUrl')));
        });

    ReactDOM.render(
        <Provider store={store}>
            <App plugins={assign(PluginsUtils.getPlugins(plugins), {requires})}/>
        </Provider>,
        document.getElementById('container')
    );
}

if (!global.Intl ) {
    require.ensure(['intl', 'intl/locale-data/jsonp/en.js', 'intl/locale-data/jsonp/it.js'], (require) => {
        global.Intl = require('intl');
        require('intl/locale-data/jsonp/en.js');
        require('intl/locale-data/jsonp/it.js');
        startApp();
    });
} else {
    startApp();
}
