import {shallow} from 'enzyme';
import React from 'react';
import sinon from 'sinon';

import analyticsReporter from '@cdo/apps/lib/util/AnalyticsReporter';
import {UnconnectedLoginTypePicker as LoginTypePicker} from '@cdo/apps/templates/teacherDashboard/LoginTypePicker';

import {expect} from '../../../util/reconfiguredChai';

describe('LoginTypePicker', () => {
  it('sends analytic event when a login type is selected', () => {
    const wrapper = shallow(
      <LoginTypePicker
        title="title"
        setLoginType={() => {}}
        handleCancel={() => {}}
        providers={['picture', 'word', 'email']}
      />
    );
    const sendEventSpy = sinon.stub(analyticsReporter, 'sendEvent');

    wrapper.find('PictureLoginCard').simulate('click');

    expect(sendEventSpy).to.be.calledOnce;
    expect(sendEventSpy).calledWith('Login Type Selected');

    analyticsReporter.sendEvent.restore();
  });
});
