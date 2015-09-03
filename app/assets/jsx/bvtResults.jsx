/** @jsx React.DOM */

define(['react', 'jquery', 'bvtChart'], function(React, $, BvtChart) {
  var BvtResults = React.createClass({

    render: function() {


      var bvtNodes = this.props.bvtResults.map(function(result) {
        var imgSrc = '/icon/' + encodeURIComponent(result.name);

        if(result.values.length > 0) {
          var latest = result.values[result.values.length-1];
          if(latest.failed === 0 && latest.notExecuted === 0) {
            return (
              <li className="bvtResult successful" key={result.name + result.build}>
                <img src={imgSrc} title={result.name} className="bvt-icon-success" />
              </li>
            );
          }
        }

        return (
          <li className="bvtResult" key={result.name + result.build}>
            <img src={imgSrc} title={result.name} className="bvt-icon" />
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
