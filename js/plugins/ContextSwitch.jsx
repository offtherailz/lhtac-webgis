/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const {connect} = require('react-redux');
const assign = require('object-assign');
const {createSelector} = require('reselect');

const {switchLayer, resetAllFilters} = require('../actions/lhtac');
const {changeMapView} = require('../../MapStore2/web/client/actions/map');
const {mapSelector} = require('../../MapStore2/web/client/selectors/map');

const lhtac = require('../selectors/lhtac');
const selector = createSelector([
    lhtac,
    mapSelector,
    state => state.mapInitialConfig
    ],
    (l, mapConfig, mapInitialConfig) => ({
        activeLayer: l.activeLayer,
        contextLayers: l.contextLayers,
        mapInitialConfig,
        mapConfig }));

const ContextSwitch = connect(selector, {
    switchLayer,
    resetAllFilters,
    changeMapView
})(require('../components/ContextSwitch'));

module.exports = {
    ContextSwitchPlugin: assign(ContextSwitch, {
        Settings: {
            tool: <ContextSwitch key="contextswitch"/>,
            position: 4
        }
    }),
    reducers: {}
};
