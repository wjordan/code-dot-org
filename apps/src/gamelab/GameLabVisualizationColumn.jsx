var msg = require('../locale');
var connect = require('react-redux').connect;

var GameButtons = require('../templates/GameButtons');
var ArrowButtons = require('../templates/ArrowButtons');
var BelowVisualization = require('../templates/BelowVisualization');
var gameLabConstants = require('./constants');
var ProtectedStatefulDiv = require('../templates/ProtectedStatefulDiv');
var VisualizationOverlay = require('../templates/VizOverlay');
var CrosshairOverlay = require('../templates/CHOverlay');
var TooltipOverlay = require('../templates/TooltipOverlay');

var GAME_WIDTH = gameLabConstants.GAME_WIDTH;
var GAME_HEIGHT = gameLabConstants.GAME_HEIGHT;

var GameLabVisualizationColumn = function (props) {
  var divGameLabStyle = {
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  };
  return (
    <span>
      <ProtectedStatefulDiv id="visualization">
        <div id="divGameLab" style={divGameLabStyle} tabIndex="1">
        </div>
        <VisualizationOverlay width={GAME_WIDTH} height={GAME_HEIGHT}>
          <CrosshairOverlay/>
          <TooltipOverlay/>
        </VisualizationOverlay>
      </ProtectedStatefulDiv>
      <GameButtons
          hideRunButton={false}
          instructionsInTopPane={props.instructionsInTopPane}>
        <div id="studio-dpad" className="studio-dpad-none">
          <button id="studio-dpad-button" className="arrow">
            <img src="/blockly/media/1x1.gif" className="dpad-btn icon21"/>
          </button>
        </div>

        <ArrowButtons/>

        {props.finishButton && <div id="share-cell" className="share-cell-none">
          <button id="finishButton" className="share">
            <img src="/blockly/media/1x1.gif"/>
            {msg.finish()}
          </button>
        </div>}
      </GameButtons>
      <BelowVisualization instructionsInTopPane={props.instructionsInTopPane}/>
    </span>
  );
};

GameLabVisualizationColumn.propTypes = {
  finishButton: React.PropTypes.bool.isRequired
};

module.exports = connect(function propsFromStore(state) {
  return {
    instructionsInTopPane: state.pageConstants.instructionsInTopPane
  };
})(GameLabVisualizationColumn);
