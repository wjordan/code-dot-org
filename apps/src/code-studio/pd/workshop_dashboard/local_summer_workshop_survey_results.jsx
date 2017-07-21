import React from 'react';
import $ from 'jquery';
import _ from 'lodash';
import Spinner from './components/spinner';

const rowOrder = [
  {text: 'Number of enrollments', key: 'num_enrollments'},
  {text: 'Number of survey responses', key: 'num_surveys'},
  {text: 'I received clear communication about when and where the workshop would take place', key: 'received_clear_communication', score_base: 6},
  {text: 'Overall, how much have you learned about computer science from your workshop?', key: 'how_much_learned', score_base: 5},
  {text: 'For this workshop, how clearly did your facilitator present the information that you needed to learn?', key: 'how_clearly_presented', score_base: 5},
  {text: 'During your workshop, how much did you participate?', key: 'how_much_participated', score_base: 5},
  {text: 'When you are not in workshops about the Code.org curriculum how often do you talk about the ideas from the workshops?', key: 'how_often_talk_about_ideas_outside', score_base: 5},
  {text: 'How often did you get so focused on workshop activities that you lost track of time?', key: 'how_often_lost_track_of_time', score_base: 5},
  {text: 'Before the workshop, how excited were you about going to your workshop?', key: 'how_excited_before', score_base: 5},
  {text: 'Overall, how interested were you in the in-person workshop?', key: 'overall_how_interested', score_base: 5},
  {text: 'I feel more prepared to teach the material covered in this workshop than before I came.', key: 'more_prepared_than_before', score_base: 6},
  {text: 'I know where to go if I need help preparing to teach this material.', key: 'know_where_to_go_for_help', score_base: 6},
  {text: 'This professional development was suitable for my level of experience with teaching this course.', key: 'suitable_for_my_experience', score_base: 6},
  {text: 'I would recommend this professional development to others.', key: 'would_recommend', score_base: 6},
  {text: 'I look forward to continuing my training throughout the year.', key: 'anticipate_continuing', score_base: 6},
  {text: 'I feel confident I can teach this course to my students this year.', key: 'confident_can_teach', score_base: 6},
  {text: 'I believe all students should take this course', key: 'believe_all_students', score_base: 6},
  {text: "This was the absolute best professional development I've ever participated in.", key: 'best_pd_ever', score_base: 6},
  {text: "I feel more connected to the community of computer science teachers after this workshop.", key: 'part_of_community', score_base: 6}
];

const freeResponseQuestions = [
  {text: 'Venue Feedback', key: 'venue_feedback'},
  {text: 'Things you liked', key: 'things_you_liked'},
  {text: 'Things you would change', key: 'things_you_would_change'},
  {text: 'Things the facilitator did well', key: 'things_facilitator_did_well', facilitator_breakdown: true},
  {text: 'Things the facilitator could improve', key: 'things_facilitator_could_improve', facilitator_breakdown: true}
];

const LocalSummerWorkshopSurveyResults = React.createClass({
  propTypes: {
    params: React.PropTypes.shape({
      workshopId: React.PropTypes.string.isRequired
    })
  },

  getInitialState() {
    return {
      loading: true
    };
  },

  componentDidMount() {
    this.load();
  },

  load() {
    const url = `/api/v1/pd/workshops/${this.props.params['workshopId']}/local_workshop_survey_report`;

    this.loadRequest = $.ajax({
      method: 'GET',
      url: url,
      dataType: 'json'
    }).done(data => {
      this.setState({
        loading: false,
        results: data,
        thisWorkshop: data['this_workshop'],
        allMyLocalWorkshops: data['all_my_local_workshops'],
        facilitatorBreakdown: data['facilitator_breakdown'],
        facilitatorNames: data['facilitator_names']
      });
    });
  },

  renderLocalSummerWorkshopSurveyResultsTable() {
    let facilitatorColumnHeaders;

    if (this.state.facilitatorBreakdown) {
       facilitatorColumnHeaders = this.state.facilitatorNames.map((facilitator, i) => {
        return (
          <th key={i}>
            {facilitator}
          </th>
        );
      });
    }

    return (
      <table className="table table-bordered" style={{width: 'auto'}}>
        <thead>
          <tr>
            <th/>
            <th>This workshop</th>
            {facilitatorColumnHeaders}
            <th>
              All my local summer workshops
            </th>
          </tr>
        </thead>
        <tbody>
          {
            rowOrder.map((row, i) => {
              return (
                this.renderRow(row, i)
              );
            })
          }
        </tbody>
      </table>
    );
  },

  renderRow(row, i) {
    let scoreCells;
    let thisWorkshopData = this.state.thisWorkshop[row['key']];

    if (this.state.facilitatorBreakdown && typeof thisWorkshopData === 'object') {
      scoreCells = this.state.facilitatorNames.map((facilitator, i) => {
        return (
          <td key={i}>
            {this.renderScore(row, thisWorkshopData[facilitator])}
          </td>
        );
      });

      scoreCells.unshift((<td key={this.state.facilitatorNames.length}/>));
    } else {
      scoreCells = [(
        <td key={0}>
          {this.renderScore(row, thisWorkshopData)}
        </td>
      )];

      if (this.state.facilitatorBreakdown) {
        _.times(this.state.facilitatorNames.length, (i) => {
          scoreCells.push((<td key={i + 1}/>));
        });
      }
    }

    return (
      <tr key={i}>
        <td>{row['text']}</td>
        {scoreCells}
        <td>{this.renderScore(row, this.state.allMyLocalWorkshops[row['key']])}</td>
      </tr>
    );
  },

  renderScore(row, score) {
    if (score && row['score_base']) {
      return `${score} / ${row['score_base']}`;
    } else {
      return score || '';
    }
  },

  renderFreeResponseBullets(question, answerCollection) {
    if (question['facilitator_breakdown']) {
      return this.freeResponseMapToBullets(answerCollection);
    } else {
      return answerCollection.map((answer, i) => {
        return (
          <li key={i}>
            {answer}
          </li>
        );
      });
    }
  },

  freeResponseMapToBullets(answer) {
    return Object.keys(answer).map((facilitator_name, i) => {
      return (
        <li key={i}>
          {facilitator_name}
          <ul>
            {
              answer[facilitator_name].map((feedback, j) => {
                return (
                  <li key={j}>
                    {feedback}
                  </li>
                );
              })
            }
          </ul>
        </li>
      );
    });
  },

  renderFreeResponseFeedback() {
    const freeResponseAnswers = freeResponseQuestions.map((question, i) => {
      let answerCollection = this.state.thisWorkshop[question['key']];
      return answerCollection && (
        <div key={i} className="well">
          <b>{question['text']}</b>
          {this.renderFreeResponseBullets(question, answerCollection)}
        </div>
      );
    });

    return (
      <div>
        {freeResponseAnswers}
      </div>
    );
  },

  render() {
    if (this.state.loading) {
      return (
        <div>
          <Spinner/>
        </div>
      );
    } else {
      return (
        <div>
          {this.renderLocalSummerWorkshopSurveyResultsTable()}
          <br/>
          {this.renderFreeResponseFeedback()}
        </div>
      );
    }

  }
});

export default LocalSummerWorkshopSurveyResults;
