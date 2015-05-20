/** @jsx React.DOM */

define(['react', 'jquery', 'moment'], function(React, $, Moment) {
  var LoadStatusMixin = {
    getInitialState: function() {
      return {
        buildCI: [],
      	buildNightly: [],
        users:[],
        project:[],
        audits:[],
        lastBuild:[],
        employeesAustria:""
      };
    },

    // load data from jenkins, austria and phabricator
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
      
      $.ajax({
        url: '/getPhabUser',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
      
      $.ajax({
        url: '/getPhabProject',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
      
      $.ajax({
        url: '/getPhabAudits',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
      
      $.ajax({
        url: '/getUsers',
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
        pollInterval: 10000
      };
    },

    render: function() {
      // ----------------------- helper -----------------------//
      function getAuditsForUser(user, audits){
        var res = 0;
        if (!isUserInProject(user)) return res;
        for (var i = 0; i < audits.length; i++){
          if (user.phid == audits[i].auditorPHID &&
              audits[i].status != "accepted"){
            res++;
          }
        }
        return res;
      }
      var project = this.state.project;
      function isUserInProject(user){
        var key = Object.keys(project.data)
        for (var i = 0; i < project.data[key].members.length; i++)
          if (project.data[key].members[i] == user.phid)
            return true;
        return false;
      }
      function getNotAssignedAudits(audits){
        var res = 0;
        for(var i = 0; i<audits.length; i++){
            if (audits[i].status === "audit-required" &&
                audits[i].auditorPHID == Object.keys(project.data)){
              res++;
          }
        }
        return res;
      }
      
      function mergeUserAudits(users, audits){
        var resultArray = new Array();
        for (var i = 0; i < users.length; i++){
          var cnt = getAuditsForUser(users[i], audits);
          if (cnt > 0){
            var userAudit = {
                userName : users[i].realName,
                numberOfAudits : cnt
            };
            resultArray.push(userAudit);
          }
        }
        
        var userAudit = {
            userName : "No Auditor",
            numberOfAudits : getNotAssignedAudits(audits)
        };
        resultArray.push(userAudit);
        
        return resultArray;
      }
      
      function getDefaultPicture(){
        return '/assets/images/avatars/default.jpg';
      }
      
      function formatEmplName(name){
        return name.replace(" ", ".")
                   .replace(/ä/g,"ae")
                   .replace(/ö/g,"oe")
                   .replace(/ü/g,"ue")
                   .replace(/Ä/g,"Ae")
                   .replace(/Ö/g,"Oe")
                   .replace(/Ü/g,"Ue")
                   .replace(/ß/g,"ss") + '.jpg';
      }
      
      var empl = this.state.employeesAustria;
      
      function getPicture(name){
        name = formatEmplName(name);
        
        if (name == "No.Auditor.jpg"){
          return '/assets/images/avatars/silkTestLogo.png';
        }
        else if (empl.match(name.toLowerCase()) == null){
          return getDefaultPicture();
        }
        else{
            return 'http://austria/global/images/employees/' +  name;      
          }
        }
      
      var phabUsers = this.state.users;
      function getCommitters(committer){
        var name = committer.fullName;
        
        for (var i = 0; i < phabUsers.length; i++){
          if (phabUsers[i].userName.toLowerCase() == name.toLowerCase()){
            name = phabUsers[i].realName;
            break;
          }
        }
        var picture = getPicture(name);

        var avatarUrlStyle = {
            backgroundImage: 'url(' + picture + ')',
            backgroundSize: '100%',
        };
        return (    
            <div className="avatar" 
                 style={avatarUrlStyle} 
                 key={committer.fullName} 
                 title={committer.fullName} >
            </div>
        );
      }
      
      function getAvatarClassSet(name){
        var cx = React.addons.classSet;
        return cx({
          'avatar': name !== 'No Auditor',
          'silkTest': name === 'No Auditor'
        });
      }
      
      function getAuditorPic(auditor){
        var picture = getPicture(auditor.userName);
        var avatarClass = getAvatarClassSet(auditor.userName);
        var avatarUrlStyle = {
            background: 'url(' + picture + ')',
            backgroundSize: 'cover'
        };
        return (    
            <div className={avatarClass}
                 style={avatarUrlStyle}
                 key={auditor.userName}
                 title={auditor.userName} >
            </div>
        );
      }
      
      function getStatusClassSet(build, name){
        var cx = React.addons.classSet;
        return cx({
          'status': name === 'status',
          'regression': name === 'regression',
          'stable': build.status === 'stable',
          'cancelled': build.status === 'cancelled',
          'unstable': build.status === 'unstable',
          'failed': build.status === 'failed',
          'pending': build.status === 'pending'
        });
      }
      
   // ----------------------- render functions -----------------------//
      var currentBuild = this.state.lastBuild;
      function buildStatus(build){
        var classesStatus = getStatusClassSet(build, "status");
        
        if (currentBuild.building && currentBuild.buildNumber === build.number){
          return (
              <li className="status pending">
              <a href={build.link}>
                <BuildProgress lastBuild={currentBuild} /> 
              </a>
            </li>
               
          )
        }
        return (
            <li className={classesStatus}>
              <a href={build.link}>
                {build.DAILY_NUMBER}
              </a>
            </li>)
      }
      
      function regressionStatus(regression, name){
        var classesStatus = getStatusClassSet(regression, "regression");
        return (
            <li className={classesStatus}>
              <a href={regression.link}>
                {name}
              </a>
            </li>
          );
      }
      
      function buildItems(build){
        var committerNodes = build.culprits.map(getCommitters);
        var regressionName1 = "---";
        try{
          regressionName1 = build.regression1.name.toUpperCase();
        }catch(e){}
        
        
        var andOthers = ""; 
        if (committerNodes.length > 6){
          andOthers = "+ " + (committerNodes.length - 6) + " other(s)";
        }
        return (
            <li className="build-list-item"
              key={build.number}>
              <div className="build-item">
                <ul>
                  <li className="avatars">
                    {committerNodes.slice(0,6)}
                    <div>{andOthers}</div>
                  </li>
                  {buildStatus(build)}
                  <li>
                    <div>
                      <ul className="regression-list">
                        {regressionStatus(build.regression1, regressionName1)}
                      </ul>
                    </div>
                  </li>
                </ul>
              </div>
            </li>
        );
      };
      
      function buildItemsNightly(build){
        var regressionName1 = "---";
        var regressionName2 = "---";
        var regressionName3 = "---";
        var regressionName4 = "---";
        var regressionName5 = "---";
        try{
          regressionName1 = build.regression1.name.toUpperCase();
          regressionName2 = build.regression2.name.toUpperCase();
          regressionName3 = build.regression3.name.toUpperCase();
          regressionName4 = build.regression4.name.toUpperCase();
          regressionName5 = build.regression5.name.toUpperCase();
        }catch(e){}
        
        var classesRegressionResult = getStatusClassSet(build.regression1, "regression");
        var classesStatus = getStatusClassSet(build, "status");
        return (
            <li className="build-list-item"
              key={build.number}>
              <div className="build-item">
                <ul>
                  {buildStatus(build)}
                  <li>
                    <div>
                      <ul className="regression-list">
                        {regressionStatus(build.regression1, regressionName1)}
                        {regressionStatus(build.regression2, regressionName2)}
                        {regressionStatus(build.regression3, regressionName3)}
                        {regressionStatus(build.regression4, regressionName4)}
                        {regressionStatus(build.regression5, regressionName5)}
                      </ul>
                    </div>
                  </li>
                </ul>
              </div>
            </li>
        );
      };
    	
     
      function renderAudit(audit) {
        return (
          <li className="audit">
            <div className="audit-name"> 
              {getAuditorPic(audit)}
            </div>
            <div className="audit-cnt"> 
              {audit.numberOfAudits}
            </div>
          </li>
        );
      }

   // ----------------------- generate html -----------------------//
      var buildItems = this.state.buildCI.map(buildItems);
      var buildNightly = this.state.buildNightly.map(buildItemsNightly);
      var audits = mergeUserAudits(this.state.users, this.state.audits).sort(function(a, b){return b.numberOfAudits-a.numberOfAudits}).map(renderAudit);
      
   // ----------------------- html site structure -----------------------//
      return (
        <div>
          <article className="dashboard">
            <section className="build-section">
            	<ul className="ci-build-list">
                {buildItems}
            	</ul>
            </section>
            
            <section className="audit-section">
              <h1> Open Audits </h1>
              <ul className="audit-list">
                {audits.slice(0,12)}
              </ul>
            </section>
            <aside id="nightly-build" className="nightly-build">
              {buildNightly} 
              <iframe className="failureSummary" src="http://lnz-spbuilder/jenkins/job/Status_all_Core_Regressions/Core_Regressions_Status/output.html" scrolling="no" 
                seamless="seamless"/>
            </aside>
            
          </article> 
        </div>
        
      );
    }
  });
  
  var BuildProgress = React.createClass({
    render: function() {
      if(this.props.lastBuild.building) {
        var timeSpent = Date.now() - this.props.lastBuild.timestamp;
        var timeLeft = (this.props.lastBuild.timestamp + this.props.lastBuild.estimatedDuration) - Date.now();
        var progress = parseInt((timeSpent / this.props.lastBuild.estimatedDuration) * 100, 10);
        var formatTime = function(d) {
          if(timeLeft > 0) {
            return Moment(d).from(Moment(0), true) + ' remaining';
          } else {
            return 'any moment now...';
          }
        };
        var widthStyle = {
          width: Math.min(progress, 95) + '%'
        }
        return (
          <div className="buildProgress">
            <div className="progress-bar-background">
              <span className="bar" style={widthStyle}> </span>
            </div>
            <div className="label">
              <div className="buildNumber">
                {this.props.lastBuild.buildNumber}
              </div>
              <div className="timeLeft">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        );
      }
      else {
        return (<div className="buildProgress" />);
      }
    }
  });
  
  return Dashboard;
});
