import {shallow} from 'enzyme';
import React from 'react';

import StandardsReportHeader from '@cdo/apps/templates/sectionProgress/standards/StandardsReportHeader';

import {expect} from '../../../util/reconfiguredChai';

describe('StandardsReportHeader', () => {
  let DEFAULT_PROPS;

  beforeEach(() => {
    DEFAULT_PROPS = {
      teacherName: 'Awesome Teacher',
      sectionName: 'Great Section',
    };
  });

  it('report shows section information and report date', () => {
    const wrapper = shallow(<StandardsReportHeader {...DEFAULT_PROPS} />);
    expect(wrapper.contains('Class Standards Report')).to.equal(true);
    expect(wrapper.contains('Awesome Teacher')).to.equal(true);
    expect(wrapper.contains('Great Section')).to.equal(true);
  });
});
