/** @jsx React.DOM */

define(['react', 'jquery', 'bvtChart'], function(React, $, BvtChart) {
  var BvtResults = React.createClass({

    render: function() {
      var bvtNodes = this.props.bvtResults.map(function(result) {
        return (
          <li className="bvtResult" key={result.name + result.build}>
            {result.name}
            <BvtChart key={result.name} result={result}></BvtChart>
          </li>
        );
      });

      return (
        <section className="bvtResults">
          <h1>BVT Results</h1>
          <ul className="bvtResults-container">
            {bvtNodes}
          </ul>
        </section>
      );
    }
  });

  return BvtResults;
});
