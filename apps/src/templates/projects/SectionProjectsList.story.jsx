import React from 'react';
import SectionProjectsList from './SectionProjectsList';

const STUB_PROJECTS_DATA = [
  {
    channel: 'ABCDEFGHIJKLM01234',
    name: 'Antelope Freeway',
    studentName: 'Alice',
    type: 'applab',
    updatedAt: '2016-12-31T23:59:59.999-08:00'
  },
  {
    channel: 'AAAABBBBCCCCDDDDEE',
    name: 'Cats and Kittens',
    studentName: 'Charlie',
    type: 'weblab',
    updatedAt: '2016-11-30T00:00:00.001-08:00'
  },
  {
    channel: 'NOPQRSTUVWXYZ567879',
    name: 'Batyote',
    studentName: 'Bob',
    type: 'gamelab',
    updatedAt: '2017-01-01T00:00:00.001-08:00'
  },
];

export default storybook => {
  return storybook
    .storiesOf('SectionProjectsList', module)
    .addStoryTable([
      {
        name: 'basic section projects list',
        description: `This is a simple section projects list with stub data.`,
        story: () => (
          <SectionProjectsList
            projectsData={STUB_PROJECTS_DATA}
            studioUrlPrefix={'https://studio.code.org'}
          />
        )
      },
    ]);
};
