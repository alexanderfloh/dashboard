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
              buildName="Latest nightly build"
              url="http://lnz-bobthebuilder/hudson/job/SilkTest" 
              pollInterval={5000} />
          </article>
          <article className="deviceArticle">
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
                lastBuild: data1.lastBuild.number,
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
        <BuildLabel buildName={this.props.buildName} />
        <BuildStatusTrafficLight 
          isStable={isStable} 
          isSuccessful={isSuccessful} 
          isFailed={isFailed} 
          buildType="ci"
        />
        <BuildProgress url={this.props.url} pollInterval={this.props.pollInterval} lastBuild={this.state.lastBuild} />
        <Culprits isFailed={isFailed} culprits={this.state.culprits} />
        <RecentCommits commits={this.state.changesetItems} />
      </section>
    );
  }
});

var BuildProgress = React.createClass({
  getInitialState: function() {
    return {};
  },
  
  chartData: function () {
    var timeSpent = Date.now() - this.state.timestamp;
    var timeLeft = (this.state.timestamp + this.state.estimatedDuration) - Date.now(); 
    return  [
        { 
          "label": "Time Spent",
          "value" : timeSpent 
        } , 
        { 
          "label": "Time Left",
          "value" : timeLeft
        }
      ];
  },
  
  componentWillUpdate: function(nextProps, nextState) {
    if(this.state.chart && this.state.timestamp) {
      var chartData = this.chartData();
      d3.select(".buildProgress svg").datum(chartData).call(this.state.chart);
    }
  },
  
  componentDidMount: function() {
    var self = this;
    //Donut chart example
      nv.addGraph(function() {
        var formatTime = d3.time.format("%X");
        var formatMinutes = function(d) { return moment(d).from(moment(0), true); };
        
        var chart = nv.models.pieChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .showLabels(true)     //Display pie labels
            .labelThreshold(.05)  //Configure the minimum slice size for labels to show up
            .labelType("value") //Configure what type of data to show in the label. Can be "key", "value" or "percent"
            .donut(true)          //Turn on Donut mode. Makes pie chart look tasty!
            .donutRatio(0.35)     //Configure how big you want the donut hole size to be.
            .showLegend(false)
            .tooltips(false)
            .valueFormat(formatMinutes)
            .labelFormat(formatMinutes)
            ;

          d3.select(".buildProgress svg")
              .datum(self.chartData())
              .transition().duration(350)
              .call(chart);
          
        self.setState({
          timestamp : self.state.timestamp,
          estimatedDuration: self.state.estimatedDuration,
          chart: chart
        });
        return chart;
      });
    },
  
  loadProgress: function() {
    $.ajax({
      url: '/fetchJson/'+ encodeURIComponent(this.props.url + "/" + this.props.lastBuild + "/api/json" ),
      dataType: 'json',
      success: function(data) {
        this.setState({ 
          duration: data.duration,
          estimatedDuration: data.estimatedDuration,
          timestamp: data.timestamp
        });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  
  componentWillMount: function() {
    this.loadProgress();
    setInterval(this.loadProgress, this.props.pollInterval);
  },
    
  render: function() {
    return (<span className="buildProgress"><svg/></span>);
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
        <BuildLabel buildName={this.props.buildName} />
        <BuildStatistics 
          isStable={isStable} 
          isSuccessful={isSuccessful} 
          isFailed={isFailed}
          buildnumber={this.state.buildNumber} />
        <BuildStatusTrafficLight 
          isStable={isStable} 
          isSuccessful={isSuccessful} 
          isFailed={isFailed} 
          buildType="nightly"
        />
        <Culprits isFailed={isFailed} culprits={this.state.culprits} />
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
      'failed': this.props.isFailed,
      'ci': this.props.buildType === 'ci',
      'nightly': this.props.buildType === 'nightly'
    });
    
    return (
      <div className={classes} id="status">
        {this.props.isStable ? 'stable' : (this.props.isSuccessful ? 'unstable' : 'failed')}
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
    var cx = React.addons.classSet;
    var classes = cx({
      'buildstats' : true,
      'stable': this.props.isStable,
      'successful': this.props.isSuccessful,
      'failed': this.props.isFailed,
    });
    return (
      <div className={classes}>
        <div className="buildnumber">{this.props.buildnumber}</div>
      </div>
    );
  }
});

var RecentCommits = React.createClass({
  render: function() {
    var commitNodes = this.props.commits.map(function(item) {
      return (
        <li key={item.commitId} className="commitMsg">
          {item.msg}
          <div className="commitTimeAndUser">
            {item.user}, {moment(item.date).fromNow()}
          </div> 
        </li>
      );
    });
    
    return (
      <ul className="commitMsgs">
        {commitNodes}
      </ul>
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
      var editDeviceLocation = function(deviceLocation) {
        var result = '';
        if (deviceLocation) {
          result = deviceLocation;
          if (result.indexOf("LNZ-") > -1) {
            result = result.substring("LNZ-".length, result.length);
          }
          result = result.toLowerCase();
          if(result !== '') {
            result += ' -';
          }
        }
          
        return result;
      }
      
      var deviceNodes = this.state.devices.map(function(device) {
        var deviceLocation = editDeviceLocation(device.location);
        return (
          <tr className="deviceLine" key={device.id}>
            <td className="deviceLocation">{deviceLocation}</td>
            <td className="deviceName">{device.name}</td>
          </tr>
        );
      });

      return (
        <section>
          <table className="device">
          {deviceNodes}
          </table>
        </section>
      );
    }
  });

React.renderComponent(
    <Dashboard />,
    document.getElementById('content')
  );
