/** @jsx React.DOM */

define(['react', 'audits', 'bvtResults', 'devices', 'loaderMixin', 'avatar', 'ciBuild'],
  function(React, Audits, BvtResults, Devices, LoadStatusMixin, Avatar, CIBuild) {

  var Dashboard = React.createClass({
    mixins: [LoadStatusMixin],
    getDefaultProps: function() {
      return {
        pollInterval: 10000
      };
    },

    buildItemsNightly: function(build){
      var committerNodes = build.culprits.slice(0, 6).map(function(culprit) {
        return <Avatar name={culprit.fullName} key={culprit.fullName} />
      });

      var classesStatus = this.getStatusClassSet(build, 'status-nightly');
      var andOthers = "";
      if (build.culprits.length > 6){
        andOthers = "+ " + (build.culprits.length - 6) + " other" + (build.culprits.length > 1 ? "s" : "");
      }
      return (
          <li className="build-list-item">
            <div className="build-item">
              <ul>
                <li className="avatars nightly">
                  {committerNodes}
                  <div>{andOthers}</div>
                </li>
                <li className={classesStatus}>
                  <a href={build.link}>
                    {build.number}
                  </a>
                </li>
                <li>
                <div>
                  <ul className="downstream-jobs-nightly">
                    {this.regressionStatus(build.setup, "Setup")}
                  </ul>
                </div>
                </li>
              </ul>
            </div>
          </li>
      );
    },

    getStatusClassSet: function(build, additional){
      var cx = React.addons.classSet;
      return cx({
        'nightly-setup': additional === 'nightly-setup',
        'status-nightly': additional === 'status-nightly',
        'stable': build.status === 'stable',
        'cancelled': build.status === 'cancelled',
        'unstable': build.status === 'unstable',
        'failed': build.status === 'failed',
        'pending': build.status === 'pending'
      });
    },

    regressionStatus: function(regression, name){
      var classesStatus = this.getStatusClassSet(regression, 'nightly-setup');
      return (
          <li className={classesStatus}>
            <a href={regression.link}>
              {name}
            </a>
          </li>
        );
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
      var buildNightly = this.buildItemsNightly(this.state.buildNightly);
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
        <div>
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
              {buildNightly}
              <Audits audits={audits} />
              <h1> Nevergreens </h1>
              <ul className="nevergreen-list">
                {nevergreenNodes}
              </ul>
            </aside>

          </article>
        </div>

      );
    }
  });
  return Dashboard;
});
