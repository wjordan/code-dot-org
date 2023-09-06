import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {BodyTwoText, Heading1} from '@cdo/apps/componentLibrary/typography';
import Button from '@cdo/apps/templates/Button';
import {navigateToHref} from '@cdo/apps/utils';
import RubricEditor from './RubricEditor';
import {snakeCase} from 'lodash';

const RUBRIC_PATH = '/rubrics';

export default function RubricsContainer({
  unitName,
  lessonNumber,
  levels,
  rubric,
  lessonId,
}) {
  const [learningGoalList, setLearningGoalList] = useState(
    !!rubric
      ? rubric.learningGoals
      : [
          {
            key: 'learningGoal-1',
            id: 'learningGoal-1',
            learningGoal: '',
            aiEnabled: false,
            position: 1,
          },
        ]
  );

  const generateLearningGoalKey = () => {
    let learningGoalNumber = learningGoalList.length + 1;
    while (
      learningGoalList.some(
        learningGoal =>
          learningGoal.key === `learningGoal-${learningGoalNumber}`
      )
    ) {
      learningGoalNumber++;
    }

    return `learningGoal-${learningGoalNumber}`;
  };

  const emptyKeyConcept = () => {
    const newKey = generateLearningGoalKey();
    const newId = newKey;
    const nextPosition =
      Math.max(...learningGoalList.map(obj => obj.position)) + 1;

    return {
      key: newKey,
      id: newId,
      learningGoal: '',
      aiEnabled: false,
      position: nextPosition,
    };
  };

  const addNewConceptHandler = event => {
    event.preventDefault();

    const startingData = emptyKeyConcept();

    const oldLearningGoalList = learningGoalList;

    setLearningGoalList([...oldLearningGoalList, startingData]);
  };

  const deleteKeyConcept = id => {
    event.preventDefault();
    var updatedLearningGoalList = learningGoalList.filter(
      item => item.id !== id
    );
    setLearningGoalList(updatedLearningGoalList);
  };

  const updateLearningGoal = (idToUpdate, keyToUpdate, newValue) => {
    const newLearningGoalData = learningGoalList.map(learningGoal => {
      if (idToUpdate === learningGoal.id) {
        return {
          ...learningGoal,
          [keyToUpdate]: newValue,
        };
      } else {
        return learningGoal;
      }
    });
    setLearningGoalList(newLearningGoalData);
  };

  // TODO: Check that there is at least one programming level here
  const initialLevelForAssessment = !!rubric ? rubric.levelId : levels[0].id;
  const [selectedLevelForAssessment, setSelectedLevelForAssessment] = useState(
    initialLevelForAssessment
  );

  const saveRubric = event => {
    event.preventDefault();
    const dataUrl = !!rubric ? `/rubrics/${rubric.id}` : RUBRIC_PATH;
    const method = !!rubric ? 'PATCH' : 'POST';

    // Checking that the csrf-token exists since it is disabled on test
    const csrfToken = document.querySelector('meta[name="csrf-token"]')
      ? document.querySelector('meta[name="csrf-token"]').attributes['content']
          .value
      : null;

    const learningGoalListAsData = transformKeys(learningGoalList);

    const rubric_data = {
      levelId: selectedLevelForAssessment,
      lessonId: lessonId,
      learningGoalsAttributes: learningGoalListAsData,
    };

    fetch(dataUrl, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify(rubric_data),
    })
      .then(response => response.json())
      .then(data => {
        navigateToHref(data.redirectUrl);
      })
      .catch(err => {
        console.error('Error saving rubric:' + err);
      });
  };

  // transforms keys from camelCase to snake_case for rails
  // specifically created to do this for an array of objects
  // with keys in camelCase
  function transformKeys(startingList) {
    const newList = [];

    startingList.forEach(item => {
      const newItem = {};
      for (const [key, value] of Object.entries(item)) {
        newItem[snakeCase(key)] = value;
      }
      newList.push(newItem);
    });

    return newList;
  }

  const handleDropdownChange = event => {
    setSelectedLevelForAssessment(event.target.value);
  };

  // TODO: In the future we might want to filter the levels in the dropdown for "submittable" levels
  //  "submittable" is in the properties of each level in the list.
  return (
    <div>
      <Heading1>Create or modify your rubric</Heading1>
      <BodyTwoText>
        This rubric will be used for {unitName}, lesson {lessonNumber}.
      </BodyTwoText>

      <div style={styles.containerStyle}>
        <label>Choose a level for this rubric to be evaluated on</label>
        <select
          id="rubric_level_id"
          required={true}
          onChange={handleDropdownChange}
          value={selectedLevelForAssessment}
        >
          {levels.map(level => (
            <option key={level.id} value={level.id}>
              {level.name}
            </option>
          ))}
        </select>
      </div>

      <RubricEditor
        learningGoalList={learningGoalList}
        addNewConcept={addNewConceptHandler}
        deleteItem={id => deleteKeyConcept(id)}
        updateLearningGoal={updateLearningGoal}
      />
      <div style={styles.bottomRow}>
        <Button
          color={Button.ButtonColor.brandSecondaryDefault}
          text="Save your rubric"
          onClick={saveRubric}
          size={Button.ButtonSize.narrow}
        />
      </div>
    </div>
  );
}

RubricsContainer.propTypes = {
  unitName: PropTypes.string,
  lessonNumber: PropTypes.number,
  levels: PropTypes.arrayOf(
    PropTypes.shape({id: PropTypes.number, name: PropTypes.string})
  ),
  rubric: PropTypes.object,
  lessonId: PropTypes.number,
};

const styles = {
  containerStyle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  bottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
};
