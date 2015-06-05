var React = require('react');

var PropertyRow = require('./PropertyRow.jsx');
var ColorPickerPropertyRow = require('./ColorPickerPropertyRow.jsx');
var ImagePickerPropertyRow = require('./ImagePickerPropertyRow.jsx');

var elementUtils = require('./elementUtils');

var ScreenProperties = React.createClass({
  propTypes: {
    element: React.PropTypes.instanceOf(HTMLElement).isRequired,
    handleChange: React.PropTypes.func.isRequired
  },

  render: function () {
    var element = this.props.element;

    return (
      <table>
        <tr>
          <th>name</th>
          <th>value</th>
        </tr>
        <PropertyRow
          desc={'id'}
          initialValue={element.id}
          handleChange={this.props.handleChange.bind(this, 'id')} />
        <ColorPickerPropertyRow
          desc={'background color'}
          initialValue={elementUtils.rgb2hex(element.style.backgroundColor)}
          handleChange={this.props.handleChange.bind(this, 'backgroundColor')} />
        <ImagePickerPropertyRow
          desc={'image'}
          initialValue={elementUtils.extractImageUrl(element.style.backgroundImage)}
          handleChange={this.props.handleChange.bind(this, 'image')} />
      </table>);
  }
});

module.exports = {
  PropertyTable: ScreenProperties,
  create: function () {
    var element = document.createElement('div');
    element.setAttribute('class', 'screen');
    element.style.display = 'block';
    element.style.height = Applab.appHeight + 'px';
    element.style.width = Applab.appWidth + 'px';
    element.style.left = '0px';
    element.style.top = '0px';

    return element;
  }
};
