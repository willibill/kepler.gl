// Copyright (c) 2019 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React, {Component, PureComponent} from 'react';
import styled from 'styled-components';
import {VariableSizeGrid as Grid} from 'react-window';
import Autosizer from 'react-virtualized-auto-sizer';

import {ALL_FIELD_TYPES} from 'constants/default-settings';
import FieldToken from 'components/common/field-token';
import DatasetLabel from 'components/common/dataset-label';
import {Clock} from 'components/common/icons/index';

// Breakpoints
import {media} from 'styles/media-breakpoints';

const dgSettings = {
  sidePadding: 36,
  verticalPadding: 16,
  height: 36
};

const StyledModal = styled.div`
  height: 70vh;
  overflow: hidden;
  ${media.palm`
    margin: 0 -36px;
  `}
  
  .header {
    border-right: 0;
    border-bottom: 0;
    background: ${props => props.theme.panelBackgroundLT};
    color: ${props => props.theme.titleColorLT};
    padding: 14px 8px 14px 0;
  }
  .cell {
    padding: 14px 8px;
    border-right: 0;
    border-bottom: ${props => props.theme.panelBorderLT};
  }
 
`;

const tagContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const FieldHeader = ({className, name, style, type}) => (
  <div className={className} style={{...style, ...tagContainerStyle}}>
    <div style={{display: 'flex', alignItems: 'center'}}>
      <div>
        {type === 'timestamp' ? <Clock height="16px" /> : null}
      </div>
      {name}
    </div>
    <div>
      <FieldToken type={type} />
    </div>
  </div>
);

class ItemRenderer extends PureComponent {
  render() {
    const {columnIndex, data, rowIndex, style} = this.props;

    const item = data[rowIndex][columnIndex];

    return rowIndex === 0 ? (
        <FieldHeader
          key={`${rowIndex}-${columnIndex}`}
          className="header"
          style={style}
          name={item.name}
          type={item.type}
        />
      ) : (
        <div
          className="cell"
          style={style}
          key={`${rowIndex}-${columnIndex}`}>
          {item}
        </div>
      );
  }
}
const COLUMN_SIZE = {
  [ALL_FIELD_TYPES.timestamp]: 200,
  [ALL_FIELD_TYPES.date]: 150,
  [ALL_FIELD_TYPES.point]: 150,
  [ALL_FIELD_TYPES.string]: 150
};

export class DataTableModal extends Component {

  render() {
    const {datasets, dataId, showDatasetTable} = this.props;

    if (!datasets || !dataId) {
      return null;
    }

    const activeDataset = datasets[dataId];
    const rows = activeDataset.data;
    const columns = activeDataset.fields.filter(({name}) => name !== '_geojson');

    const data = [
      columns,
      ...rows
    ];

    return (
      <StyledModal className="dataset-modal" >
        <DatasetTabs
          activeDataset={activeDataset}
          datasets={datasets}
          showDatasetTable={showDatasetTable}
        />
        <Autosizer>
          {({height, width}) => (
            <Grid
              columnCount={columns.length}
              columnWidth={index =>
                COLUMN_SIZE[columns[index].type] || 100
              }
              height={height - dgSettings.height - dgSettings.verticalPadding}
              rowCount={rows.length + 1}
              rowHeight={index => index === 0 ? 72 : 48}
              width={width}
              itemData={data}
            >
              {ItemRenderer}
            </Grid>
          )}
        </Autosizer>
      </StyledModal>
    );
  }
}

const DatasetCatalog = styled.div`
  display: flex;
  padding: ${dgSettings.verticalPadding}px ${dgSettings.sidePadding}px 0;
`;

export const DatasetModalTab = styled.div`
  align-items: center;
  border-bottom: 3px solid ${props => (props.active ? 'black' : 'transparent')};
  cursor: pointer;
  display: flex;
  height: 35px;
  margin: 0 3px;
  padding: 0 5px;

  :first-child {
    margin-left: 0;
    padding-left: 0;
  }
`;

export const DatasetTabs = ({activeDataset, datasets, showDatasetTable}) => (
  <DatasetCatalog className="dataset-modal-catalog">
    {Object.values(datasets).map(dataset => (
      <DatasetModalTab
        className="dataset-modal-tab"
        active={dataset === activeDataset}
        key={dataset.id}
        onClick={() => showDatasetTable(dataset.id)}
      >
        <DatasetLabel dataset={dataset}/>
      </DatasetModalTab>
    ))}
  </DatasetCatalog>
);

const DataTableModalFactory = () => DataTableModal;
export default DataTableModalFactory;
