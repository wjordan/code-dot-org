import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';
import {UnconnectedWatchers as Watchers} from '@cdo/apps/lib/tools/jsdebugger/Watchers';

describe('Watchers', () => {
  const defaultProps = {
    debugButtons: false,
    add: () => {},
    update: () => {},
    remove: () => {},
  };

  it('renders with no watchers', () => {
    shallow(
      <Watchers
        {...defaultProps}
        watchedExpressions={Immutable.List()}
        isRunning={true}
        appType="gamelab"
      />
    );
  });

  it('renders with one watcher', () => {
    shallow(
      <Watchers
        {...defaultProps}
        watchedExpressions={Immutable.fromJS([
          {expression: 'cool', uuid: 1234},
        ])}
        isRunning={true}
        appType="gamelab"
      />
    );
  });
});
