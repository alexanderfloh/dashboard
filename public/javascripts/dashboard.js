/** @jsx React.DOM */

var Dashboard = React.createClass({
  render: function() {
    return (
        <div>
          <article>

          <BuildStatusCI
            buildName="CI Build Status"
            url="http://lnz-bobthebuilder/hudson/job/SilkTest%20CI" 
            pollInterval={5000} />
          <BuildStatusNightly
          buildName="Nightly Build Status"
          url="http://lnz-bobthebuilder/hudson/job/SilkTest" 
          pollInterval={5000} />

          </article>
          <article>
          <Devices pollInterval={2000}/>
          </article>
        </div>
        );
  }
  
});

var LoadStatusMixin = {
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
                lastCompletedBuild: data1.lastCompletedBuild.number,
                lastSuccessfulBuild: data1.lastSuccessfulBuild.number,
                lastStableBuild: data1.lastStableBuild.number,
                buildNumber: data1.lastCompletedBuild.number,
                culprits: data.culprits,
                changesetItems: data.changeSet.items
              });
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
  }
};

var BuildStatusCI = React.createClass({
mixins: [LoadStatusMixin],
  
  getInitialState: function() {
    return {culprits: [], changesetItems: []};
  },
  
  render: function() {
    var isStable = this.state.lastStableBuild === this.state.lastCompletedBuild;
    var isSuccessful = !isStable && this.state.lastSuccessfulBuild === this.state.lastCompletedBuild;
    var isFailed = !isStable && !isSuccessful;
    
    return (
      <section>
        <BuildStatusTrafficLight isStable={isStable} isSuccessful={isSuccessful} isFailed={isFailed} />
        <BuildLabel buildName={this.props.buildName} />
        <Culprits isFailed={isFailed} culprits={this.state.culprits} />
        <RecentCommits commits={this.state.changesetItems} />
      </section>
    );
  }
});

var BuildStatusNightly = React.createClass({
  mixins: [LoadStatusMixin],
  
  getInitialState: function() {
    return {culprits: []};
  },
  
  render: function() {
    var isStable = this.state.lastStableBuild === this.state.lastCompletedBuild;
    var isSuccessful = !isStable && this.state.lastSuccessfulBuild === this.state.lastCompletedBuild;
    var isFailed = !isStable && !isSuccessful;
    
    return (
      <section>
        <BuildStatusTrafficLight isStable={isStable} isSuccessful={isSuccessful} isFailed={isFailed} />
        <BuildLabel buildName={this.props.buildName} />
        <Culprits isFailed={isFailed} culprits={this.state.culprits} />
        <BuildStatistics buildnumber={this.state.buildNumber} />
      </section>
    );
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
        <div className="buildnumber">[build # {this.props.buildnumber}]</div>
      </div>
    );
  }
});

var RecentCommits = React.createClass({
  render: function() {
    var commitNodes = this.props.commits.map(function(item) {
      return <li className="commitMsg">{item.msg}<br/><span className="commitTimeAndUser">[{moment(item.date).fromNow()}, {item.user}]</span> </li>;
    });
    
    return (
      <div className="commitMsgs">
        <ul>
          {commitNodes}
        </ul>
      </div>
    );
  }
})

var Devices = React.createClass({
    getInitialState: function() {
      return { devices: [] };
    },

    loadStatus: function() {
      $.ajax({
        url: '/getDevices/',
        dataType: 'json',
        success: function(data) {
            this.setState({ 
              devices: data
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
      var deviceNodes = this.state.devices.map(function(device) {
    	  return <tr className="deviceLine" key={device.id}> <td className="deviceName">  {device.name} </td> <td>{device.location ? device.location : ''} </td> </tr>
      });

       return (
         <section>
           <div className="device">
           <table>
           {deviceNodes}
           </table>
           </div>
         </section>
       );
      }
  });

React.renderComponent(
    <Dashboard />,
    document.getElementById('content')
  );
