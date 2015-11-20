/** @jsx React.DOM */

define(['react', 'jquery', 'bvtChart'], function(React, $, BvtChart) {
  var BvtResults = React.createClass({

    propTypes: {
      bvtResults: React.PropTypes.arrayOf(
        React.PropTypes.shape({
          name: React.PropTypes.string.isRequired,
          values: React.PropTypes.arrayOf(
            React.PropTypes.shape({
              build: React.PropTypes.string.isRequired,
              name: React.PropTypes.string.isRequired,
              passed: React.PropTypes.number.isRequired,
              failed: React.PropTypes.number.isRequired,
              notExecuted: React.PropTypes.number.isRequired,
            })
          )

        }).isRequired
      ).isRequired,
      latestBuild: React.PropTypes.string.isRequired,
    },

    render: function() {
      var latestBuild = this.props.latestBuild;
      var bvtNodes = this.props.bvtResults.map(function(result) {
        var imgSrc = '/icon/' + encodeURIComponent(result.name);

        if(result.values.length > 0) {
          var latest = result.values[result.values.length-1];
          if(latest.failed === 0 && latest.notExecuted === 0) {
            var classes = "bvtResult stable" + (latest.build === latestBuild ? ' latest-build' : '');
            return (
              <li className={classes} key={result.name + latest.build}>
                <div className="image-container">
                  <img src={imgSrc} title={result.name} className="bvt-icon-success" />
                  <div className="build-number">{latest.build}</div>
                </div>
              </li>
            );
          }
          else if(latest.failed === -1 || latest.notExecuted > 0) {
            var classes = "bvtResult failed" + (latest.build === latestBuild ? ' latest-build' : '');
            return (
              <li className="bvtResult failed" key={result.name + latest.build}>
                <div className="image-container">
                  <img src={imgSrc} title={result.name} className="bvt-icon-success" />
                </div>
              </li>
            );
          }
        }

        return (
          <li className="bvtResult unstable" key={result.name + latest.build}>
            <div className="image-container">
              <img src={imgSrc} title={result.name} className="bvt-icon" />
            </div>
            <BvtChart key={result.name} result={result} latestBuild={latestBuild}></BvtChart>
          </li>
        );
      });

      return (
        <section className="bvtResults">
          <ul className="bvtResults-container">
            {bvtNodes}
          </ul>
        </section>
      );
    }
  });

  return BvtResults;
});
