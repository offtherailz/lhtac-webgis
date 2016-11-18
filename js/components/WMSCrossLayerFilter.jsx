/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');

const assign = require('object-assign');

const {Button, Glyphicon, ButtonToolbar, Modal, OverlayTrigger, Tooltip} = require('react-bootstrap');

const I18N = require('../../MapStore2/web/client/components/I18N/I18N');

const mapUtils = require('../../MapStore2/web/client/utils/MapUtils');
const CoordinatesUtils = require('../../MapStore2/web/client/utils/CoordinatesUtils');

const LhtacFilterUtils = require('../utils/LhtacFilterUtils');
const WMSCrossLayerFilter = React.createClass({
    propTypes: {
        zoomArgs: React.PropTypes.array,
        params: React.PropTypes.object,
        extent: React.PropTypes.object,
        spatialField: React.PropTypes.object,
        toolbarEnabled: React.PropTypes.bool,
        mapConfig: React.PropTypes.object,
        mapInitialConfig: React.PropTypes.object,
        filterFields: React.PropTypes.array,
        showGeneratedFilter: React.PropTypes.oneOfType([
            React.PropTypes.bool,
            React.PropTypes.string
        ]),
        activeLayer: React.PropTypes.object,
        actions: React.PropTypes.object
    },
    getDefaultProps() {
        return {
            params: {},
            mapConfig: {},
            extent: null,
            spatialField: {},
            toolbarEnabled: true,
            showGeneratedFilter: false,
            activeLayer: {},
            actions: {
                onQuery: () => {},
                onReset: () => {},
                onResetThisZone: () => {},
                changeMapView: () => {},
                createFilterConfig: () => {},
                setBaseCqlFilter: () => {},
                changeZoomArgs: () => {}
            }
        };
    },
    componentWillReceiveProps(nextProps) {
        if (nextProps.activeLayer.id !== this.props.activeLayer.id) {
            this.props.actions.changeZoomArgs(null);
        }
        if (nextProps.spatialField.extent !== this.props.spatialField.extent) {
            for (let i = 0; i < nextProps.spatialField.zoneFields.length; i++ ) {
                let z = nextProps.spatialField.zoneFields[i];
                if (z.active === true && z.value !== null) {
                    if (z.value.length === z.values.length) {
                        this.search(nextProps, true, z);
                    } else {
                        this.search(nextProps, false, z);
                    }
                }
            }
        }
        if (!nextProps.spatialField.buttonReset) {
            for (let i = 0; i < nextProps.spatialField.zoneFields.length; i++ ) {
                let nextZone = nextProps.spatialField.zoneFields[i];
                let thisZone = this.props.spatialField.zoneFields[i];
                if (thisZone.value && nextZone.value === null && thisZone.active) {
                    this.resetThisZone(nextZone.id, true);
                }
                if (thisZone.value && nextZone.value === null && !thisZone.active) {
                    this.resetThisZone(nextZone.id, false);
                }
            }
        }
    },
    render() {
        // search button was removed because every time a value is selected or a zone is witched it updates automatically the map
        return (
            <div>
                <ButtonToolbar className="crossFilterToolbar">
                    <Button disabled={!this.props.toolbarEnabled} id="reset" onClick={this.reset}>
                        <Glyphicon glyph="glyphicon glyphicon-remove"/>
                        <span style={{paddingLeft: "2px"}}><strong><I18N.Message msgId={"queryform.reset"}/ ></strong></span>
                    </Button>
                    <OverlayTrigger placement="right" overlay={(<Tooltip id="lab"><strong><I18N.Message msgId={"lhtac.crossfilter.zoomBtn"}/></strong></Tooltip>)}>
                        <Button disabled={!this.props.toolbarEnabled || (this.props.zoomArgs === null || this.props.zoomArgs === undefined)} id="zoomtoarea" onClick={this.zoomToSelectedArea}>
                            <Glyphicon glyph="resize-full"/>
                        </Button>
                    </OverlayTrigger>
                </ButtonToolbar>
                <Modal show={this.props.showGeneratedFilter ? true : false} bsSize="large">
                    <Modal.Header>
                        <Modal.Title>Generated Filter</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <textarea style={{width: "862px", maxWidth: "862px", height: "236px", maxHeight: "236px"}}>{this.props.showGeneratedFilter}</textarea>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button style={{"float": "right"}} onClick={() => this.props.actions.onQuery(null, null)}>Close</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    },
    search(props) {

        let filter = LhtacFilterUtils.getZoneCrossFilter(props.spatialField);

        if (filter) {
            let params = assign({}, props.params, {cql_filter: filter});
            props.actions.onQuery(props.activeLayer, {params: params}, filter);

            // ////////////////////////////////////////////////////////////////////
            // WPS request to retrieve attribute values for the advanced filter
            // ////////////////////////////////////////////////////////////////////
            if (props.activeLayer && props.activeLayer.advancedFilter && !props.filterFields) {
                props.activeLayer.advancedFilter.fieldsConfig.map((field) => {
                    let wpsRequest = LhtacFilterUtils.getWpsRequest(props.activeLayer.name, props.activeLayer.advancedFilter.cql || filter, field.attribute);
                    props.actions.createFilterConfig(wpsRequest, props.activeLayer.advancedFilter.searchUrl, field);
                }, this);
            }

            // Zoom to the selected geometry
            if (props.spatialField.extent && props.spatialField.extent) {
                const bbox = props.spatialField.extent;
                const mapSize = props.mapConfig.present.size;

                const newZoom = mapUtils.getZoomForExtent(CoordinatesUtils.reprojectBbox(bbox, "EPSG:4326", props.mapConfig.present.projection), mapSize, 0, 21, null);
                const newCenter = mapUtils.getCenterForExtent(bbox, "EPSG:4326");
                this.zoomArgs = [newCenter, newZoom, {
                    bounds: {
                       minx: bbox[0],
                       miny: bbox[1],
                       maxx: bbox[2],
                       maxy: bbox[3]
                    },
                    crs: "EPSG:4326",
                    rotation: 0
                }];
                props.actions.changeZoomArgs(this.zoomArgs);
                props.actions.changeMapView(...this.zoomArgs, props.mapConfig.present.size, null, props.mapConfig.present.projection);
            }
            props.actions.setBaseCqlFilter(filter);
        }

    },
    zoomToInitialExtent() {
        let mapConfig = this.props.mapInitialConfig;
        let bbox = mapUtils.getBbox(mapConfig.center, mapConfig.zoom, this.props.mapConfig.size);
        this.props.actions.changeMapView(mapConfig.center, mapConfig.zoom, bbox, this.props.mapConfig.size, null, mapConfig.projection);
    },
    reset() {
        this.props.actions.changeZoomArgs(null);
        this.props.actions.onReset();
        let params = assign(this.props.params, {cql_filter: "INCLUDE"});
        this.props.actions.onQuery(this.props.activeLayer, {params: params}, "INCLUDE");
        this.zoomToInitialExtent();
    },
    resetThisZone(zoneId, reload) {
        this.props.actions.onResetThisZone(zoneId, reload);
        if (reload) {
            this.props.actions.changeZoomArgs(null);
            let params = assign(this.props.params, {cql_filter: "INCLUDE"});
            this.props.actions.onQuery(this.props.activeLayer, {params: params}, "INCLUDE");
            this.zoomToInitialExtent();
        }
    },
    zoomToSelectedArea() {
        if (this.props.zoomArgs) {
            this.props.actions.changeMapView(...this.props.zoomArgs, this.props.mapConfig.present.size, null, this.props.mapConfig.present.projection);
        }
    }
});

module.exports = WMSCrossLayerFilter;
