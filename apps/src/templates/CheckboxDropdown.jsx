import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Typography from '@cdo/apps/componentLibrary/typography';
import Button from '@cdo/apps/templates/Button';
import FontAwesome from './FontAwesome';

import i18n from '@cdo/locale';

import style from './checkbox-dropdown.module.scss';
import Checkbox from '@cdo/apps/componentLibrary/checkbox';

const CheckboxDropdown = ({
  name,
  label,
  allOptions,
  checkedOptions = [],
  onChange,
  handleSelectAll,
  handleClearAll,
}) => {
  const onSelectAll = useCallback(() => {
    handleSelectAll(name);
  }, [name, handleSelectAll]);

  const onClearAll = useCallback(() => {
    handleClearAll(name);
  }, [name, handleClearAll]);

  return (
    <div id={`${name}-dropdown`} className="dropdown">
      <button
        id={`${name}-dropdown-button`}
        type="button"
        className={classnames('selectbox', style.dropdownButton)}
        data-toggle="dropdown"
        aria-haspopup={true}
        aria-label={`${name} filter dropdown`}
      >
        {checkedOptions.length > 0 && (
          <FontAwesome
            id={'check-icon'}
            icon="check-circle"
            title={i18n.filterCheckIconTitle({filter_label: label})}
          />
        )}
        <Typography semanticTag="span" visualAppearance="body-one">
          {label}
        </Typography>
        <FontAwesome id={'chevron-down-icon'} icon={'chevron-down'} />
      </button>
      <form
        className={classnames('dropdown-menu', style.dropDownMenuContainer)}
      >
        <ul className={style.dropdownCheckboxUL}>
          {Object.keys(allOptions).map(optionKey => (
            <li key={optionKey} className="checkbox form-group">
              <Checkbox
                checked={checkedOptions.includes(optionKey)}
                onChange={onChange}
                name={optionKey}
                value={optionKey}
                label={allOptions[optionKey]}
              />
            </li>
          ))}
        </ul>
        <div className={style.bottomButtonsContainer}>
          <Button
            id="select-all"
            className={style.affectAllButton}
            type="button"
            text={i18n.selectAll()}
            onClick={onSelectAll}
            styleAsText
            color={Button.ButtonColor.brandSecondaryDefault}
          />
          <Button
            id="clear-all"
            className={style.affectAllButton}
            type="button"
            text={i18n.clearAll()}
            onClick={onClearAll}
            styleAsText
            color={Button.ButtonColor.brandSecondaryDefault}
          />
        </div>
      </form>
    </div>
  );
};
CheckboxDropdown.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  allOptions: PropTypes.objectOf(PropTypes.string).isRequired,
  checkedOptions: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  handleSelectAll: PropTypes.func.isRequired,
  handleClearAll: PropTypes.func.isRequired,
};

export default CheckboxDropdown;
