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
    },

    render: function() {


      var bvtNodes = this.props.bvtResults.map(function(result) {
        var imgSrc = '/icon/' + encodeURIComponent(result.name);

        if(result.values.length > 0) {
          var latest = result.values[result.values.length-1];
          if(latest.failed === 0 && latest.notExecuted === 0) {
            return (
              <li className="bvtResult successful" key={result.name + result.build}>
                <div className="image-container">
                  <img src={imgSrc} title={result.name} className="bvt-icon-success" />
                </div>
              </li>
            );
          }
        }

        return (
          <li className="bvtResult unstable" key={result.name + result.build}>
            <div className="image-container">
              <img src={imgSrc} title={result.name} className="bvt-icon" />
            </div>
            <BvtChart key={result.name} result={result}></BvtChart>
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
