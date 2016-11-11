/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const msQueryform = require('../../MapStore2/web/client/reducers/queryform');
const queryFormConfig = require('../../queryFormConfig');
const {bbox, bboxPolygon} = require('turf');
const assign = require('object-assign');

const CLEAN_GEOMETRY = 'CLEAN_GEOMETRY';
const CLEAN_ZONE = 'CLEAN_ZONE';
const TASK_SUCCESS = 'TASK_SUCCESS';
const ON_RESET_THIS_ZONE = 'ON_RESET_THIS_ZONE';

function shouldReset(aId, dId, zones) {
    let reset = false;
    let zone = zones.find((z) => {
        return z.id === dId;
    });
    if (zone.dependson) {
        reset = (aId === zone.dependson.id) ? true : shouldReset(aId, zone.dependson.id, zones);
    }
    return reset;
}

function queryform(state, action) {
    switch (action.type) {
        case "MAP_CONFIG_LOADED": {
            let contextLayers = action.config.map.layers.filter((layer) => layer.hasOwnProperty('active'));
            let activeLayer = (contextLayers.filter((layer) => layer.hasOwnProperty('active') && layer.active === true));
            return activeLayer.length > 0 ? queryFormConfig[activeLayer[0].name] : state;
        }
        case "SWITCH_LAYER": {
            return queryFormConfig[action.layer.name];
        }
        case 'BASE_CQL_FILTER': {
            return {...state, simpleFilterFields: []};
        }
        case 'ZONES_RESET': {
            return {...state, simpleFilterFields: [], spatialField: {...state.spatialField,
                zoneFields: state.spatialField.zoneFields.map((field) => {
                    let f = {
                        ...field,
                        value: null,
                        open: false,
                        error: null,
                        active: false,
                        checked: false
                    };

                    if (field.dependson) {
                        return {
                            ...f,
                            disabled: true,
                            open: false,
                            value: null,
                            dependson: {...field.dependson, value: null}
                        };
                    }

                    return f;
                }),
                geometry: null,
                buttonReset: true
            }};
        }
        case ON_RESET_THIS_ZONE: {
            return {...state, spatialField: {...state.spatialField,
                zoneFields: state.spatialField.zoneFields.map((field) => {
                    let f;
                    if (field.id === action.zoneId) {
                        f = {
                        ...field,
                        value: null,
                        open: false,
                        error: null,
                        active: false,
                        checked: false
                      };
                    } else {
                        f = field;
                    }
                    if (field.dependson) {
                        return {
                            ...f,
                            disabled: true,
                            open: false,
                            value: null,
                            dependson: {...field.dependson, value: null}
                        };
                    }
                    return f;
                })
            }};
        }
        case CLEAN_GEOMETRY: {
            return assign({}, state, {spatialField: {...state.spatialField, geometry: null}});
        }
        case CLEAN_ZONE: {
            return {...state, spatialField: {...state.spatialField,
              zoneFields: state.spatialField.zoneFields.map((field) => {
                  let f;
                  if (field.id === action.zoneId) {
                      f = {
                      ...field,
                      value: null,
                      open: false,
                      error: null,
                      active: false,
                      checked: false
                    };
                  } else {
                      f = field;
                  }
                  if (field.dependson) {
                      return {
                          ...f,
                          disabled: true,
                          open: false,
                          value: null,
                          dependson: {...field.dependson, value: null}
                      };
                  }
                  return f;
              })
          }};
        }
        case 'SET_ACTIVE_ZONE': {
            return assign({}, state, {spatialField: {...state.spatialField,
                    zoneFields: state.spatialField.zoneFields.map((field) => {
                        let f = field;
                        if (action.id === field.id) {
                            f = {...field, active: true, checked: true};
                        }else if (action.exclude.indexOf(field.id) !== -1) {
                            f = {
                                ...field,
                                error: null,
                                active: false,
                                checked: false };
                        }
                        return f;
                    })
                    }
                });
        }
        case TASK_SUCCESS: {
            let name = action.name;
            let zoneId = parseInt(name.substring('zoneChange'.length), 10);
            let value;
            let geometry;
            const zoneFields = state.spatialField.zoneFields.map((field) => {
                if (field.id === zoneId) {
                    value = field.multivalue ? action.actionPayload.value : action.actionPayload.value[0];

                    return {
                            ...field,
                            value: value && value.length > 0 ? value : null,
                            open: false,
                            geometryName: geometry ? geometry.geometryName : field.geometry_name
                        };
                }
                if (field.dependson && zoneId === field.dependson.id) {
                    let disabled = (!value || (Array.isArray(value) && value.length === 0 )) ? true : false;
                    return {...field,
                        disabled: disabled,
                        values: null,
                        value: null,
                        open: false,
                        checked: false,
                        active: false,
                        dependson: {...field.dependson, value: value}
                    };
                }else if (field.dependson && shouldReset(zoneId, field.dependson.id, state.spatialField.zoneFields)) {
                    return {...field,
                        disabled: true,
                        values: null,
                        value: null,
                        open: false,
                        active: false,
                        checked: false
                    };
                }
                return field;
            });
            // create the extent that contains all the bboxes
            let extent = bbox({
                type: "FeatureCollection",
                features: action.actionPayload.features.map( feature => bboxPolygon(feature.properties.bbox))
            });

            return {...state, spatialField: {...state.spatialField,
                zoneFields: zoneFields,
                extent,
                buttonReset: false
            }};

        }
        case 'ADD_SIMPLE_FILTER_FIELD': {
            let simpleFilterFields = state.simpleFilterFields || [];
            let newSimpleFilterFields;
            const field = ( action.properties.fieldId) ? action.properties : {...action.properties, fieldId: new Date().getUTCMilliseconds()};
            let idx = simpleFilterFields.findIndex((f) => (f.fieldId === field.fieldId));
            if (idx === -1) {
                newSimpleFilterFields = [...simpleFilterFields, field];
            }else {
                newSimpleFilterFields = simpleFilterFields.map((f) => {
                    let newf = f;
                    if (f.fieldId === field.fieldId) {
                        newf = field.updateTime > f.updateTime ? field : f;
                    }
                    return newf;

                });
            }
            return {...state, simpleFilterFields: newSimpleFilterFields};
        }
        default:
            return msQueryform(state, action);
    }
}

module.exports = queryform;
