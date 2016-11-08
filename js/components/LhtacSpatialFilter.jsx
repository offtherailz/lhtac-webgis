    /**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');

const { Panel, Button, ButtonToolbar, Grid, Row, Col} = require('react-bootstrap');
const Spinner = require('react-spinkit');

const ZoneField = require('./ZoneField');

const SpatialFilter = React.createClass({
    propTypes: {
        activeLayer: React.PropTypes.object,
        params: React.PropTypes.object,
        mapConfig: React.PropTypes.object,
        zoomArgs: React.PropTypes.array,

        useMapProjection: React.PropTypes.bool,
        spatialField: React.PropTypes.object,
        spatialOperations: React.PropTypes.array,
        spatialMethodOptions: React.PropTypes.array,
        spatialPanelExpanded: React.PropTypes.bool,
        showDetailsPanel: React.PropTypes.bool,
        withContainer: React.PropTypes.bool,
        actions: React.PropTypes.object,
        loadingZones: React.PropTypes.object
    },
    contextTypes: {
        messages: React.PropTypes.object
    },
    getDefaultProps() {
        return {
            useMapProjection: true,
            spatialField: {},
            spatialPanelExpanded: true,
            showDetailsPanel: false,
            withContainer: true,
            spatialMethodOptions: [
                {id: "ZONE", name: "queryform.spatialfilter.methods.zone"}
                ],
            spatialOperations: [
                {id: "INTERSECTS", name: "queryform.spatialfilter.operations.intersects"}
            ],
            actions: {
                zoneFilter: () => {},
                zoneSearch: () => {},
                zoneSelected: () => {},
                clearAll: () => {},
                zoneChange: () => {}
            },
            loadingZones: {}
        };
    },
    getValues(zone, all) {
        let value = zone && zone.value;
        let val = null;
        let features = [];

        if (value !== null) {
            let values = zone && zone.values;
            if (values && values.length > 0) {

                features = values.filter((v) => {
                    let valueField2 = v;
                    zone.valueField.split('.').forEach(part => {
                        valueField2 = valueField2 ? valueField2[part] : null;
                    });
                    return value.indexOf(valueField2) !== -1;
                });
            }
            if (zone && zone.multivalue) {
                val = {
                    value: value,
                    feature: features
                };
            } else {
                val = {
                    value: [value],
                    feature: [features]
                };
            }
        }
        if (all) {
            let values = zone && zone.values;
            if (values && values.length > 0) {

                features = values;
            }
            value = values.map((v) => {
                let valueField2 = v;
                zone.valueField.split('.').forEach(part => {
                    valueField2 = valueField2 ? valueField2[part] : null;
                });
                return valueField2;
            });
            if (zone && zone.multivalue) {
                val = {
                    value: value,
                    feature: features
                };
            } else {
                val = {
                    value: [value],
                    feature: [features]
                };
            }
        }
        return val;
    },
    renderLoadingZone(zone) {
        return this.props.loadingZones[zone.id] ? (<div style={{"float": "left", "paddingLeft": "14px", "paddingTop ": "8px" }}>
            <Spinner spinnerName="circle" noFadeIn/>
        </div>) : null;
    },
    renderToolbar(zone) {
        return (
            <ButtonToolbar>
                <Button style={{marginTop: 5}} bsSize="small" onClick={() => {this.zoneChange(zone.id, this.getValues(zone, true)); }} disabled={zone.values.length > 0 ? false : true}>
                    Select All
                </Button>
                <Button style={{marginTop: 5}} bsSize="small" onClick={() => (zone.value) ? this.clearAll(zone) : {}} disabled={zone.value ? false : true}>
                    Clear All
                </Button>
                {this.renderLoadingZone(zone)}
            </ButtonToolbar>
        );
    },
    renderRadios(zone) {
        // get selected values from the list
        let value = this.getValues(zone, false);
        return (
          <label key={zone.id} style={{marginLeft: "0px", marginTop: "31px"}}>
            <input
              name="zoneField"
              type="radio"
              value={zone.id}
              checked={zone.checked}
              readOnly={!zone.checked}
              defaultChecked={false}
              onChange={() => {}}
              disabled={zone.value === null}
              onClick={() => {this.props.actions.zoneSelected(zone, value, zone.exclude); }}
            />
          </label>
       );
    },
    renderZoneFields() {
        return this.props.spatialField.method &&
            this.props.spatialField.method === "ZONE" &&
            this.props.spatialField.zoneFields &&
            this.props.spatialField.zoneFields.length > 0 ?
                this.props.spatialField.zoneFields.map((zone) => {
                    return (
                        <div key={zone.id} className={zone.active ? "active-zone" : ''}>
                          <Grid fluid>
                            <Row>
                               <Col xs={1}>{this.renderRadios(zone)}</Col>
                               <Col xs={11}>
                                <ZoneField
                                    open={zone.open}
                                    zoneId={zone.id}
                                    url={zone.url}
                                    typeName={zone.typeName}
                                    wfs={zone.wfs}
                                    busy={zone.busy}
                                    label={zone.label}
                                    values={zone.values}
                                    value={zone.value}
                                    valueField={zone.valueField}
                                    textField={zone.textField}
                                    searchText={zone.searchText}
                                    searchMethod={zone.searchMethod}
                                    searchAttribute={zone.searchAttribute}
                                    sort={zone.sort}
                                    error={zone.error}
                                    disabled={zone.disabled}
                                    dependsOn={zone.dependson}
                                    groupBy={zone.groupBy}
                                    multivalue={zone.multivalue}
                                    onSearch={this.props.actions.zoneSearch}
                                    onFilter={this.props.actions.zoneFilter}
                                    onChange={this.zoneChange}/></Col>
                              </Row>
                              {(zone.toolbar) ?
                                  (<Row>
                                      <Col xs={1}><span/></Col>
                                      <Col xs={11} style={{"marginBottom": "15px", "marginTop": "-10px"}}>{this.renderToolbar(zone)}</Col>
                                  </Row>) : null}
                            </Grid>
                        </div>
                    );
                }) : (<span/>);
    },
    renderSpatialPanel() {
        return (
            <Panel>
                {this.renderZoneFields()}
            </Panel>
        );
    },
    render() {
        return (
            <div>
            {this.renderSpatialPanel()}
            </div>
        );
    },
    clearAll(zone) {
        this.props.actions.clearAll(zone);
    },
    zoneChange(id, value) {
        // find the zonefield that is changing his values
        let zoneField = this.props.spatialField.zoneFields.find((z) => {return z.id === id; });

        if (zoneField && zoneField.exclude && zoneField.exclude.length > 0) {
            this.props.actions.zoneSelected(zoneField, value, zoneField.exclude);
        }else {
            this.props.actions.zoneChange(id, value);
        }
      //  }
    }
});

module.exports = SpatialFilter;
