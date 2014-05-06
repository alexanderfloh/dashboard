/** @jsx React.DOM */

var Dashboard = React.createClass({
  render: function() {
    return (
        <div>
          <article>
          <BuildStatus
            buildName="CI Build Status"
            url="http://lnz-bobthebuilder/hudson/job/SilkTest%20CI" 
            pollInterval={2000}/>
          </article>
          <article>
          <BuildStatus
            buildName="Nightly Build Status"
            url="http://lnz-bobthebuilder/hudson/job/SilkTest" 
            pollInterval={2000}/>
          </article>
        </div>
        );
  }
  
});

var BuildStatus = React.createClass({
  getInitialState: function() {
    return {};
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
    var cx = React.addons.classSet;
    var classes = cx({
      'build-status' : true,
      'stable': isStable,
      'successful': isSuccessful,
      'failed': isFailed
    });
    var authorNodes = [];
    if(isFailed && this.state.culprits) {
      var culprits = this.state.culprits;
      authorNodes = culprits.map(function(item) {
        return(
          <div>{item.fullName}</div>
        );
      });
    }

    var msgNodes = [];
    var changesetItems = this.state.changesetItems;
    if (changesetItems) {
      msgNodes = changesetItems.map(function(item) {
    	  console.log(JSON.stringify(item));
        return(
          <li className="msg">{item.user} -> {item.msg}</li>
        );
      });
    }
    
    var buildnumber = this.state.buildNumber;
    
    if (this.props.buildName.indexOf("Nightly") > -1) {
        return (
                <section>
                  <div className={classes} id="status">
                    {isStable ? 'stable.' : (isSuccessful ? 'unstable.' : 'failed.')}
                  </div>
                  <div className="label">
                    {this.props.buildName}
                  </div>
                  <div className="contributes" >
                    {authorNodes}
                  </div>
                    <div className="buildstats">
                      <div className="buildnumber">(build # {buildnumber})</div>
                    </div>
                </section>
              );
      } else {
          return (
                  <section>
                    <div className={classes} id="status">
                      {isStable ? 'stable.' : (isSuccessful ? 'unstable.' : 'failed.')}
                    </div>
                    <div className="label">
                      {this.props.buildName}
                    </div>
                    <div className="contributes" >
                      {authorNodes}
                    </div>
                      <div className="msgs">
                        <div className="msgsHeading">Commits:</div>
                        <ul>
                          {msgNodes}
                        </ul>
                      </div>
                  </section>
                );
      }
  }
});

React.renderComponent(
    <Dashboard />,
    document.getElementById('content')
  );