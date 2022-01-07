import React from 'react';
import {Provider} from 'react-redux';
import {mount} from 'enzyme';
import {expect} from '../../util/reconfiguredChai';
import Certificate from '@cdo/apps/templates/Certificate';
import {combineReducers, createStore} from 'redux';
import responsive from '@cdo/apps/code-studio/responsiveRedux';
import isRtl from '@cdo/apps/code-studio/isRtlRedux';

const store = createStore(combineReducers({responsive, isRtl}));

function wrapperWithParams(params) {
  return mount(
    <Provider store={store}>
      <Certificate {...params} />
    </Provider>
  );
}

describe('Certificate', () => {
  let storedWindowDashboard;

  beforeEach(() => {
    storedWindowDashboard = window.dashboard;
    window.dashboard = {
      CODE_ORG_URL: 'https://code.org'
    };
  });

  afterEach(() => {
    window.dashboard = storedWindowDashboard;
  });

  it('renders Minecraft certificate for Minecraft Adventurer', () => {
    const wrapper = wrapperWithParams({tutorial: 'mc'});
    expect(wrapper.find('img').html()).to.include(
      'MC_Hour_Of_Code_Certificate'
    );
  });

  it('renders Minecraft certificate for Minecraft Designer', () => {
    const wrapper = wrapperWithParams({tutorial: 'minecraft'});
    expect(wrapper.find('img').html()).to.include(
      'MC_Hour_Of_Code_Certificate'
    );
  });

  it("renders unique certificate for Minecraft Hero's Journey", () => {
    const wrapper = wrapperWithParams({tutorial: 'hero'});
    expect(wrapper.find('img').html()).to.include(
      'MC_Hour_Of_Code_Certificate_Hero'
    );
  });

  it('renders unique certificate for Minecraft Voyage Aquatic', () => {
    const wrapper = wrapperWithParams({tutorial: 'aquatic'});
    expect(wrapper.find('img').html()).to.include(
      'MC_Hour_Of_Code_Certificate_Aquatic'
    );
  });

  it('renders default certificate for all other tutorials', () => {
    ['applab-intro', 'dance', 'flappy', 'frozen'].forEach(tutorial => {
      const wrapper = wrapperWithParams({tutorial});
      expect(wrapper.find('img').html()).to.include('hour_of_code_certificate');
    });
  });
});
