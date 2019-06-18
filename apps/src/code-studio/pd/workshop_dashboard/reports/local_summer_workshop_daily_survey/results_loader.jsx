import PropTypes from 'prop-types';
import React from 'react';
import $ from 'jquery';
import Spinner from '../../../components/spinner';
import Results from './results';

export class ResultsLoader extends React.Component {
  static propTypes = {
    params: PropTypes.shape({
      workshopId: PropTypes.string.isRequired
    })
  };

  state = {loading: true, errors: null};

  componentDidMount() {
    this.load();
  }

  load() {
    const url = `/api/v1/pd/workshops/${
      this.props.params['workshopId']
    }/generic_survey_report`;

    this.loadRequest = $.ajax({
      method: 'GET',
      url: url,
      dataType: 'json'
    })
      .done(data => {
        this.setState({
          loading: false,
          questions: data['questions'],
          thisWorkshop: data['this_workshop'],
          sessions: Object.keys(data['this_workshop']),
          facilitators: data['facilitators'],
          facilitatorAverages: data['facilitator_averages'],
          facilitatorResponseCounts: data['facilitator_response_counts'],
          courseName: data['course_name']
        });
      })
      .fail(jqXHR => {
        this.setState({
          loading: false,
          errors: (jqXHR.responseJSON || {}).errors
        });
      });
  }

  renderErrors() {
    return (
      <div id="error_list">
        Sorry we couldn't process this request. Server encountered the following
        error(s):
        <ul>
          {this.state.errors.map((error, index) => (
            <li key={index}>{error.message}</li>
          ))}
        </ul>
      </div>
    );
  }

  render() {
    const {loading, errors, ...data} = this.state;

    if (loading) {
      return (
        <div>
          <Spinner />
        </div>
      );
    } else if (errors) {
      return this.renderErrors();
    } else {
      return <Results {...data} />;
    }
  }
}
