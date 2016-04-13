var Visualization = require('./Visualization');
var GameButtons = require('./GameButtons');
var commonStyles = require('../commonStyles');

/**
 * Equivalent of visualizationColumn.html.ejs. Initially only supporting
 * portions used by App Lab
 */
var VisualizationColumn = function (props) {
  return (
    <div>
      <Visualization/>
      <GameButtons/>
      <div id="belowVisualization">
        <div id="bubble" className="clearfix">
          <table id="prompt-table">
            <tbody>
              <tr>
                <td id="prompt-icon-cell" style={commonStyles.hidden}>
                  <img id="prompt-icon"/>
                </td>
                <td id="prompt-cell">
                  <p id="prompt"/>
                  <p id="prompt2" style={commonStyles.hidden}/>
                </td>
              </tr>
            </tbody>
          </table>
          <div id="ani-gif-preview-wrapper">
            <div id="ani-gif-preview">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
module.exports = VisualizationColumn;
