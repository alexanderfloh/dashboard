/** @jsx React.DOM */

var Dashboard = React.createClass({
  render: function() {
    return (
        <div>
          <article>
          <BuildStatus
            buildName="CI Build Status"
            url="http://lnz-bobthebuilder/hudson/job/SilkTest%20CI" 
            pollInterval={5000}/>
          </article>
          <article>
          <BuildStatus
            buildName="Nightly Build Status"
            url="http://lnz-bobthebuilder/hudson/job/SilkTest" 
            pollInterval={5000}/>
          </article>
          <article>
          <Devices pollInterval={2000}/>
          </article>
        </div>
        );
  }
  
});

var BuildStatus = React.createClass({
  getInitialState: function() {
    return {culprits: [], changesetItems: []};
  },

  loadStatus: function() {
    $.ajax({
      url: '/fetchJson/'+ encodeURIComponent(this.props.url + "/api/json"),
      dataType: 'json',
      success: function(data1) {
        $.ajax({
            url: '/fetchJson/'+ encodeURIComponent(this.props.url + "/" + data1.lastCompletedBuild.number + "/api/json?tree=culprits[fullName],changeSet[items[*]]" ),
            dataType: 'json',
            success: function(data) {
              this.setState({ 
                culprits: data.culprits,
                lastCompletedBuild: this.state.lastCompletedBuild,
                lastSuccessfulBuild: this.state.lastSuccessfulBuild,
                lastStableBuild: this.state.lastStableBuild,
                changesetItems: data.changeSet.items,
                buildNumber: data1.lastCompletedBuild.number
              })
            }.bind(this),
            error: function(xhr, status, err) {
              console.error(this.props.url, status, err.toString());
            }.bind(this)
          });
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
  
  render: function() {
    var isStable = this.state.lastStableBuild === this.state.lastCompletedBuild;
    var isSuccessful = !isStable && this.state.lastSuccessfulBuild === this.state.lastCompletedBuild;
    var isFailed = !isStable && !isSuccessful;
    
    if (this.props.buildName.indexOf("Nightly") > -1) {
        return (
                <section>
                  <BuildStatusTrafficLight isStable={isStable} isSuccessful={isSuccessful} isFailed={isFailed} />
                  <BuildLabel buildName={this.props.buildName} />
                  <Culprits isFailed={isFailed} culprits={this.state.culprits} />
                  <BuildStatistics buildnumber={this.state.buildNumber} />
                </section>
              );
      } else {
          return (
                  <section>
                    <BuildStatusTrafficLight isStable={isStable} isSuccessful={isSuccessful} isFailed={isFailed} />
                    <BuildLabel buildName={this.props.buildName} />
                    <Culprits isFailed={isFailed} culprits={this.state.culprits} />
                    <RecentCommits commits={this.state.changesetItems} />
                  </section>
                );
      }
  }
});

var BuildStatusTrafficLight = React.createClass({
  render: function() {
    var cx = React.addons.classSet;
    var classes = cx({
      'build-status' : true,
      'stable': this.props.isStable,
      'successful': this.props.isSuccessful,
      'failed': this.props.isFailed
    });
    
    return (
      <div className={classes} id="status">
        {this.props.isStable ? 'stable.' : (this.props.isSuccessful ? 'unstable.' : 'failed.')}
      </div>
    );
  }
});

var BuildLabel = React.createClass({
  render: function() {
    return (
      <div className="label">
        {this.props.buildName}
      </div>
    );
  }
});

var Culprits = React.createClass({
  render: function() {
    var culpritNodes = this.props.culprits.map(function(item) {
      return <div>{item.fullName}</div>;
    });
    
    return(
      <div className="contributes" >
        {this.props.isFailed ? culpritNodes : ''}
      </div>
    );
  }
});

var BuildStatistics = React.createClass({
  render: function() {
    return (
      <div className="buildstats">
        <div className="buildnumber">(build # {this.props.buildnumber})</div>
      </div>
    );
  }
});

var RecentCommits = React.createClass({
  render: function() {
    var commitNodes = this.props.commits.map(function(item) {
      return <li className="msg">{item.user} -> {item.msg}</li>;
    });
    
    return (
      <div className="msgs">
        <div className="msgsHeading">Commits:</div>
        <ul>
          {commitNodes}
        </ul>
      </div>
    );
  }
})

var Devices = React.createClass({
	  getInitialState: function() {
	    return {};
	  },

	  loadStatus: function() {
	    $.ajax({
	      url: '/getDevices/',
	      dataType: 'json',
	      success: function(data) {
	          this.setState({ 
	            devices: data.devices
	          })
	      }.bind(this),
	      error: function(xhr, status, err) {
	        console.error(status, err.toString());
	      }.bind(this)
	    });
	  },

	  componentWillMount: function() {
	    this.loadStatus();
	    setInterval(this.loadStatus, this.props.pollInterval);
	  },
	  
	  render: function() {
		  console.log(this.state.devices);
		  var deviceStr = [];
		  var i = 0;
		  for (var dev in this.state.devices) {
			  deviceStr[i] = (
					  <div className="device">{dev.split(";")[0] + ": " + this.state.devices[dev]}</div>
					  );
			  ++i;
	     }


/*	      deviceStr = this.state.devices.map(function(item) {
	    	  console.log("ad");
	        return "s"//(<li className="device">{item}</li>);
	      });*/

	      return (
	          <section>
	            <div className="device">
	              {deviceStr}
	            </div>
	          </section>
	        );
	  	}
	});

React.renderComponent(
    <Dashboard />,
    document.getElementById('content')
  );
