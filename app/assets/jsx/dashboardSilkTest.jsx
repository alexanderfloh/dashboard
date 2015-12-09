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
      var ciBuilds = this.state.buildCI.map(function(build) {
        return <CIBuild build={build} lastBuild={lastBuild} key={build.number} />
      });

      var audits = this.state.audits.sort(function(a, b){
        var countDiff = (b.auditCount + b.concernCount) - (a.auditCount + a.concernCount);
        if(countDiff !== 0) {
          return countDiff;
        }
        // break ties
        return a.realName.localeCompare(b.realName);
      });

      var nightlyNode = this.state.buildNightly ? <NightlyBuild build={this.state.buildNightly} /> : null;
      var latestBuild = '' + (this.state.buildNightly ? this.state.buildNightly.buildNumber : 0);

   // ----------------------- html site structure -----------------------//
      return (
        <article className="dashboard">
          <section className="build-section">
            <ul className="ci-build-list">
              {ciBuilds}
            </ul>
          </section>

          <Audits audits={audits} />

          <section className="nightly-build-and-bvts">
            <section className="nightly-build">
              {nightlyNode}
            </section>

            <BvtResults bvtResults={this.state.bvtResults} latestBuild={latestBuild}/>
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
