/** @jsx React.DOM */

define(['react', 'jquery', 'moment'], function(React, $, Moment) {
  var LoadStatusMixin = {
    getInitialState: function() {
      return {
        lastCompletedBuild: { culprits: [], changesetItems: [] },
        buildCI: [],
      	buildNightly: [],
        nevergreens: [],
      };
    },

    // load data from jenkins
    loadStatus: function() {
      $.ajax({
        url: '/buildCI',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
      
      $.ajax({
          url: '/buildNightly',
          dataType: 'json',
          success: function(data1) {
            this.setState(data1);
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });
    },

    componentWillMount: function() {
      this.loadStatus();
      setInterval(this.loadStatus, this.props.pollInterval);
    },
  };

  var Dashboard = React.createClass({
    mixins: [LoadStatusMixin],

    getDefaultProps: function() {
      return {
        pollInterval: 5000
      };
    },

    render: function() {
      
      function getCommitters(committer){
        var avatarUrlStyle = {
            background: 'url(/assets/images/avatars/' + committer.id + '.jpg)',
            backgroundSize: 'cover',
        };
        return (    
            <div className="avatar" 
                 style={avatarUrlStyle} 
                 key={committer.id} 
                 title={committer.id} >
            </div>
        );
      }
      
      function getStatusClassSet(build, name){
        var cx = React.addons.classSet;
        return cx({
          'status': name === 'status',
          'core': name === 'core',
          'workbench': name === 'workbench',
          'kdt': name === 'kdt',
          'stable': build.status === 'stable',
          'cancelled': build.status === 'cancelled',
          'unstable': build.status === 'unstable',
          'failed': build.status === 'failed',
          'pending': build.status === 'pending'
        });
      }
      
      function nodesBuild(build){
        var committerNodes = build.authors.map(getCommitters);
        var classesStatus = getStatusClassSet(build, "status");
        return (
            <div key={build.number}  className="build-item">
              <div className="build-item-header">
                <div className="build-number">
                  {build.number}
                </div>
                <div className={classesStatus}>
                  {build.status}
                </div>
              </div>  
              <h1> Commiters </h1>
              <div className="avatars">
                  {committerNodes}
              </div>
            </div>
        );
      };
      
      function nodesTest(build) {   
        var cx = React.addons.classSet;
        var classesTestResults = getStatusClassSet(build.core, 'core');        
        var classesWorkbenchResults = getStatusClassSet(build.workbench, 'workbench');
        var classesKDTResults = getStatusClassSet(build.kdt, 'kdt');
        
        return (
          <div key={build.number}  className="build-item">
          <div className="build-item-header">
            <div className={classesTestResults}>
              {build.core.status}
            </div>
            <div className={classesWorkbenchResults}>
              {build.workbench.status}
            </div>
            <div className={classesKDTResults}>
              {build.kdt.status}
            </div>
          </div>
          </div>
        );
      };
    	
      function getNevergreens(nevergreen) {
        var linkText = nevergreen.definitionName;
        if (linkText.length > 45){
          linkText = linkText.substring(0,42).concat('...');
        }
        return (    		
      		<li key={nevergreen.id} className="nevergreen">
      		  <a href={nevergreen.link}>
      		    {nevergreen.nrOfFailures} &times; {linkText}
      		  </a>
      		</li>
      	);
      };
   
      var buildCI = this.state.buildCI.map(nodesBuild);
      var buildTests = this.state.buildCI.map(nodesTest);
      var buildNightly = this.state.buildNightly.map(nodesBuild);
      var nevergreenNodes = this.state.nevergreens.map(getNevergreens);
      
      return (
        <div>
          <article className="build-section">
            <section>
            	<ul className="build-list">
                <h1> CI Build </h1> 
                <li>	
              	  {buildCI} 
              	</li>
              	<h1> Regressions </h1>
              	<li>
              	  {buildTests}
              	</li>
            	</ul>
            </section>
            
            <aside id="nevergreens" className="nevergreens">
              <h1> Nightly Build </h1>
              {buildNightly} 
              <h1> Nevergreens </h1>
              <ul className="nevergreen-list">
                {nevergreenNodes.slice(0,35)}
              </ul>
            </aside>
          </article>          
        </div>
      );
    }
  });

  return Dashboard;
});
