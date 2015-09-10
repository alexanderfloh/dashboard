/** @jsx React.DOM */

define(['react', 'audits', 'bvtResults', 'devices', 'loaderMixin', 'avatar', 'ciBuild', 'nightlyBuild'],
  function(React, Audits, BvtResults, Devices, LoadStatusMixin, Avatar, CIBuild, NightlyBuild) {

  var Dashboard = React.createClass({
    mixins: [LoadStatusMixin],
    getDefaultProps: function() {
      return {
        pollInterval: 10000
      };
    },

    render: function() {
      var lastBuild = this.state.lastBuild;
      var cuiBuilds = this.state.buildCI.map(function(build) {
        return <CIBuild build={build} lastBuild={lastBuild} key={build.number} />
      });

      var audits = this.state.audits.sort(function(a, b){
        var countDiff = b.count-a.count;
        if(countDiff !== 0) {
          return countDiff;
        }
        // break ties
        return a.realName.localeCompare(b.realName);
      });

   // ----------------------- html site structure -----------------------//
      return (
        <article className="dashboard">
          <section className="build-section">
            <ul className="ci-build-list">
              {cuiBuilds}
            </ul>
          </section>

          <Audits audits={audits} />

          <section className="nightly-build-and-bvts">
            <section className="nightly-build">
              <NightlyBuild build={this.state.buildNightly} />
            </section>

            <BvtResults bvtResults={this.state.bvtResults} />
          </section>

          <section className="deviceSection">
            <Devices pollInterval={15000}/>
          </section>
        </article>
      );
    }
  });
  return Dashboard;
});
