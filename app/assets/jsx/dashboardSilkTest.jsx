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

    getNevergreens: function(nevergreen) {
      var linkText = nevergreen.definitionName;
      // cut off namespaces
      var nameArray = linkText.split(".");
      linkText = nameArray[nameArray.length-1];
      // fix in case of "... cases_None.opt\""," string
      if (linkText.length < 5){
        linkText = nevergreen.definitionName;
      }
      return (
        <li key={nevergreen.id} className="nevergreen">
          <a href={nevergreen.link}>
            {nevergreen.nrOfFailures} &times; {linkText}
          </a>
        </li>
      );
    },

    render: function() {
   // ----------------------- generate html -----------------------//
      var lastBuild = this.state.lastBuild;
      var buildItems = this.state.buildCI.map(function(build) {
        return <CIBuild build={build} lastBuild={lastBuild} key={build.number} />
      });
      var nevergreenNodes = this.state.nevergreens.map(this.getNevergreens);
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
              {buildItems}
            </ul>
          </section>

          <BvtResults bvtResults={this.state.bvtResults} />

          <section className="deviceSection">
            <Devices pollInterval={15000}/>
          </section>

          <aside id="nightly-build" className="nightly-build">
            <NightlyBuild build={this.state.buildNightly} />
            <Audits audits={audits} />
            <h1>Nevergreens</h1>
            <ul className="nevergreen-list">
              {nevergreenNodes}
            </ul>
          </aside>

        </article>
      );
    }
  });
  return Dashboard;
});
