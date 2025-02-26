import PropTypes from 'prop-types';
import React, {Component} from 'react';
import SchoolInfoInputs from './SchoolInfoInputs';

class SchoolInfoInputsWrapper extends Component {
  static propTypes = {
    showErrors: PropTypes.bool,
    showRequiredIndicator: PropTypes.bool,
  };

  state = {
    country: '',
    schoolType: '',
    ncesSchoolId: '',
    schoolName: '',
    schoolCity: '',
    schoolState: '',
    schoolZip: '',
  };

  onCountryChange(_, event) {
    const newCountry = event ? event.value : '';
    this.setState({country: newCountry});
  }

  onSchoolTypeChange(event) {
    const newType = event ? event.target.value : '';
    this.setState({schoolType: newType});
  }

  onSchoolChange(_, event) {
    const newSchool = event ? event.value : '';
    this.setState({ncesSchoolId: newSchool});
  }

  onSchoolNotFoundChange(field, event) {
    let newValue = event ? event.target.value : '';
    this.setState({
      [field]: newValue,
    });
  }

  render() {
    return (
      <div>
        <SchoolInfoInputs
          useLocationSearch={false}
          onCountryChange={this.onCountryChange.bind(this)}
          onSchoolTypeChange={this.onSchoolTypeChange.bind(this)}
          onSchoolChange={this.onSchoolChange.bind(this)}
          onSchoolNotFoundChange={this.onSchoolNotFoundChange.bind(this)}
          country={this.state.country}
          schoolType={this.state.schoolType}
          ncesSchoolId={this.state.ncesSchoolId}
          schoolName={this.state.schoolName}
          schoolCity={this.state.schoolCity}
          schoolState={this.state.schoolState}
          schoolZip={this.state.schoolZip}
          showErrors={this.props.showErrors}
          showRequiredIndicator={this.props.showRequiredIndicator}
        />
      </div>
    );
  }
}

export default {
  component: SchoolInfoInputs,
};

const Template = args => <SchoolInfoInputsWrapper {...args} />;

export const SchoolInfoRequired = Template.bind({});
SchoolInfoRequired.args = {
  showErrors: true,
  showRequiredIndicator: true,
};

export const SchoolInfoNotRequired = Template.bind({});
SchoolInfoNotRequired.args = {};
