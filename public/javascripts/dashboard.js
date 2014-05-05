/** @jsx React.DOM */

var Dashboard = React.createClass({
  render: function() {
    return (
        <div>
          <article>
          <BuildStatus
            buildName="CI Build Status"
            url="http://lnz-bobthebuilder/hudson/job/SilkTest%20CI/api/json" 
            pollInterval={2000}/>
          </article>
          <article>
          <BuildStatus
            buildName="Nightly Build Status"
            url="http://lnz-bobthebuilder/hudson/job/SilkTest/api/json" 
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
      url: '/fetchJson/'+ encodeURIComponent(this.props.url),
      dataType: 'json',
      success: function(data) {
        this.setState({ 
          lastCompletedBuild: data.lastCompletedBuild.number,
          lastSuccessfulBuild: data.lastSuccessfulBuild.number,
          lastStableBuild: data.lastStableBuild.number
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
    var cx = React.addons.classSet;
    var classes = cx({
      'build-status' : true,
      'stable': isStable,
      'successful': isSuccessful,
      'failed': !isStable && !isSuccessful
    });
    
    return (
      <section>
        <div className={classes} id="status">
          {isStable ? 'stable.' : (isSuccessful ? 'unstable.' : 'failed.')}
        </div>
        <div className="label">
          {this.props.buildName}
        </div>
      </section>
    );
  }
});

React.renderComponent(
    <Dashboard />,
    document.getElementById('content')
  );