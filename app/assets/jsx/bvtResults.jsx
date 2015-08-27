/** @jsx React.DOM */

define(['react', 'jquery', 'bvtChart'], function(React, $, BvtChart) {
  var BvtResults = React.createClass({

    render: function() {


      var bvtNodes = this.props.bvtResults.map(function(result) {
        /*
        if(result.values.length > 0) {
          var latest = result.values[result.values.length-1];
          if(latest.failed === 0) {
            return (<li className="bvtResult successful" key={result.name + result.build}>
              Success!
            </li>
            );
          }
        }
        */
        return (
          <li className="bvtResult" key={result.name + result.build}>
            {result.name}
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
