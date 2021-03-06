/** @jsx React.DOM */

define(['react', 'moment'], function(React, Moment) {
  var BuildProgress = React.createClass({
    propTypes: {
      lastBuild: React.PropTypes.shape({
        building: React.PropTypes.bool.isRequired,
        buildNumber: React.PropTypes.number.isRequired,
        timestamp: React.PropTypes.number.isRequired,
        estimatedDuration: React.PropTypes.number.isRequired,
      }).isRequired,
    },

    render: function() {
      if(this.props.lastBuild.building) {
        var timeSpent = Date.now() - this.props.lastBuild.timestamp;
        var timeLeft = (this.props.lastBuild.timestamp + this.props.lastBuild.estimatedDuration) - Date.now();
        var progress = parseInt((timeSpent / this.props.lastBuild.estimatedDuration) * 100, 10);
        var formatTime = function(d) {
          return 'ETA ' + Moment(d).from(Moment(0));
        };
        var widthStyle = {
          width: Math.min(progress, 95) + '%'
        }
        var duration = Moment(timeLeft).diff(Moment(0), 'minutes');


        return (
          <div className="buildProgress">
            <div className="label">
              <div className="buildNumber">
                {this.props.lastBuild.buildNumber}
              </div>
              <div className="time-left">
                <div className="time-left-label">ETA</div>
                <span className="time-left-amount">{duration}</span>
                <span className="time-left-unit">m</span>
              </div>
            </div>
            <div className="progress-bar-background">
              <span className="bar" style={widthStyle}> </span>
            </div>
          </div>
        );
      }
      else {
        return (<div className="buildProgress" />);
      }
    }
  });
  return BuildProgress;
});
