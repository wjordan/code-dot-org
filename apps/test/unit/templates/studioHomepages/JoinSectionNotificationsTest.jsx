import {shallow} from 'enzyme';
import React from 'react';

import JoinSectionNotifications from '@cdo/apps/templates/studioHomepages/JoinSectionNotifications';

import {expect} from '../../../util/reconfiguredChai';

const SUCCESSFUL_JOIN = {
  action: 'join',
  result: 'success',
  name: 'Test Section',
};

const SUCCESSFUL_LEAVE = {
  action: 'leave',
  result: 'success',
  name: 'Test Section',
  id: 'ABCDEF',
};

const SECTION_DOESNT_EXIST = {
  action: 'join',
  result: 'section_notfound',
  id: 'ABCDEF',
};

const FAILED_JOIN = {
  action: 'join',
  result: 'fail',
  id: 'ABCDEF',
};

const ALREADY_JOINED = {
  action: 'join',
  result: 'exists',
  name: 'Test Section',
};

const ALREADY_OWNED = {
  action: 'join',
  result: 'section_owned',
  id: 'ABCDEF',
};

const AT_CAPACITY = {
  action: 'join',
  result: 'section_full',
  id: 'ABCDEF',
  sectionCapacity: 500,
};

const RESTRICTED_SECTION = {
  action: 'join',
  result: 'section_restricted',
  id: 'ABCDEF',
};

const SPECIAL_PARTICIPANT_TYPE_SECTION = {
  action: 'join',
  result: 'cant_be_participant',
  id: 'ABCDEF',
};

describe('JoinSectionNotifications', () => {
  it('renders correct component when successfully join a section', () => {
    let wrapper = shallow(<JoinSectionNotifications {...SUCCESSFUL_JOIN} />);
    expect(wrapper.find('JoinSectionSuccessNotification')).to.have.lengthOf(1);
    expect(wrapper.find('JoinSectionFullNotification')).to.have.lengthOf(0);
  });

  it('renders correct component when successfully leaving a section', () => {
    let wrapper = shallow(<JoinSectionNotifications {...SUCCESSFUL_LEAVE} />);
    expect(wrapper.find('LeaveSectionSuccessNotification')).to.have.lengthOf(1);
    expect(wrapper.find('JoinSectionFullNotification')).to.have.lengthOf(0);
  });

  it('renders correct component when section not found', () => {
    let wrapper = shallow(
      <JoinSectionNotifications {...SECTION_DOESNT_EXIST} />
    );
    expect(wrapper.find('JoinSectionNotFoundNotification')).to.have.lengthOf(1);
    expect(wrapper.find('JoinSectionFullNotification')).to.have.lengthOf(0);
  });

  it('renders correct component when fail to join section', () => {
    let wrapper = shallow(<JoinSectionNotifications {...FAILED_JOIN} />);
    expect(wrapper.find('JoinSectionFailNotification')).to.have.lengthOf(1);
    expect(wrapper.find('JoinSectionFullNotification')).to.have.lengthOf(0);
  });

  it('renders correct component when cant be participant in section', () => {
    let wrapper = shallow(
      <JoinSectionNotifications {...SPECIAL_PARTICIPANT_TYPE_SECTION} />
    );
    expect(wrapper.find('JoinSectionParticipantNotification')).to.have.lengthOf(
      1
    );
    expect(wrapper.find('JoinSectionFullNotification')).to.have.lengthOf(0);
  });

  it('renders correct component when already joined that section', () => {
    let wrapper = shallow(<JoinSectionNotifications {...ALREADY_JOINED} />);
    expect(wrapper.find('JoinSectionExistsNotification')).to.have.lengthOf(1);
    expect(wrapper.find('JoinSectionFullNotification')).to.have.lengthOf(0);
  });

  it('renders correct component when teacher already owns the section', () => {
    let wrapper = shallow(<JoinSectionNotifications {...ALREADY_OWNED} />);
    expect(wrapper.find('JoinSectionOwnedNotification')).to.have.lengthOf(1);
    expect(wrapper.find('JoinSectionFullNotification')).to.have.lengthOf(0);
  });

  it('renders correct component when section is at capacity (already has 500 students)', () => {
    let wrapper = shallow(<JoinSectionNotifications {...AT_CAPACITY} />);
    expect(wrapper.find('JoinSectionFullNotification')).to.have.lengthOf(1);
  });

  it('renders correct component when section is restricted to not allow new joiners', () => {
    let wrapper = shallow(<JoinSectionNotifications {...RESTRICTED_SECTION} />);
    expect(wrapper.find('JoinSectionRestrictedNotification')).to.have.lengthOf(
      1
    );
    expect(wrapper.find('JoinSectionFullNotification')).to.have.lengthOf(0);
  });
});
