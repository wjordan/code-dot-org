import {mount} from 'enzyme';
import React from 'react';

import {UnconnectedStandardsProgressTable as StandardsProgressTable} from '../../../../src/templates/sectionProgress/standards/StandardsProgressTable';
import {
  standardsData,
  lessonCompletedByStandard,
} from '../../../../src/templates/sectionProgress/standards/standardsTestHelpers';
import {expect} from '../../../util/reconfiguredChai';

describe('StandardsProgressTable', () => {
  it('renders a description cell for each standard', () => {
    const wrapper = mount(
      <StandardsProgressTable
        standards={standardsData}
        lessonsByStandard={lessonCompletedByStandard}
      />
    );
    expect(wrapper.find('StandardDescriptionCell')).to.have.lengthOf(
      standardsData.length
    );
  });
});
