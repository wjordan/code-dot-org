/** @file NetSimLogBrowser tests */
import {shallow} from 'enzyme';
import React from 'react';
import {spy} from 'sinon';

import NetSimLogBrowser from '@cdo/apps/netsim/NetSimLogBrowser';
import i18n from '@cdo/netsim/locale';

import {expect} from '../../util/reconfiguredChai';

describe('NetSimLogBrowser', function () {
  it('renders warning-free with the least possible parameters', function () {
    let shallowResult = shallow(
      <NetSimLogBrowser
        i18n={i18n}
        setRouterLogMode={spy()}
        currentTrafficFilter="none"
        setTrafficFilter={spy()}
        headerFields={[]}
        logRows={[]}
        senderNames={[]}
      />
    );
    expect(shallowResult).not.to.be.empty;
  });
});
