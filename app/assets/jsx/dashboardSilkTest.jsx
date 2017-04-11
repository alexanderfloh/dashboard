/** @jsx React.DOM */

define([
    'react', 
    'audits',
    'auditsLoading',
    'bvtResults',
    'bvtResultsLoading',
    'devices', 
    'loaderMixin', 
    'avatar', 
    'ciBuild', 
    'ciBuildLoading',
    'nightlyBuild', 
    'nightlyBuildLoading'
  ],
  function(React, Audits, AuditsLoading, BvtResults, BvtResultsLoading, Devices, LoadStatusMixin, Avatar, CIBuild, CIBuildLoading, NightlyBuild, NightlyBuildLoading) {

  var Dashboard = React.createClass({
    mixins: [LoadStatusMixin],
    getDefaultProps: function() {
      return {
        pollInterval: 30000
      };
    },

    render: function() {
      var lastBuild = this.state.lastBuild;
      var ciBuilds = this.state.buildCI ? this.state.buildCI.slice().reverse().map(function(build) {
        return <CIBuild build={build} lastBuild={lastBuild} key={build.buildNumber} />
      }) : ['', '', '', ''].map(function(build, index) {
        return <CIBuildLoading key={index} />
      });

      var audits = this.state.audits ? this.state.audits.sort(function(a, b){
        var countDiff = (b.auditCount + b.concernCount) - (a.auditCount + a.concernCount);
        if(countDiff !== 0) {
          return countDiff;
        }
        // break ties
        return a.realName.localeCompare(b.realName);
      }) : null;
      var auditsNode = audits ? <Audits audits={audits} /> : <AuditsLoading />;

      var nightlyNode = this.state.buildNightly ? <NightlyBuild build={this.state.buildNightly} /> : <NightlyBuildLoading />;
      var latestBuild = '' + (this.state.buildNightly ? this.state.buildNightly.buildNumber : 0);

      var bvtResultsNode = this.state.bvtResults ? <BvtResults bvtResults={this.state.bvtResults} latestBuild={latestBuild}/> : <BvtResultsLoading />;

   // ----------------------- html site structure -----------------------//
      return (
        <article className="dashboard">
          <section className="build-section">
            <ul className="ci-build-list">
              {ciBuilds}
            </ul>
          </section>

          {auditsNode}

          <section className="nightly-build-and-bvts">
            <section className="nightly-build">
              {nightlyNode}
            </section>

            {bvtResultsNode}
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
