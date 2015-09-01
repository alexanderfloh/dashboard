/** @jsx React.DOM */

define(['react', 'jquery', 'moment'], function(React, $, Moment) {
  var Audits = React.createClass({
    propTypes: {
      employeesAustria: React.PropTypes.string.isRequired,
      audits: React.PropTypes.arrayOf(
        React.PropTypes.shape({
          phid: React.PropTypes.string.isRequired,
          count: React.PropTypes.number.isRequired,
          realName: React.PropTypes.string.isRequired
      }))
    },

    formatEmplName: function(name){
      return name.replace(" ", ".")
                 .replace(/ä/g,"ae")
                 .replace(/ö/g,"oe")
                 .replace(/ü/g,"ue")
                 .replace(/Ä/g,"Ae")
                 .replace(/Ü/g,"Ue")
                 .replace(/Ö/g,"Oe")
                 .replace(/ß/g,"ss") + '.jpg';
    },

    getDefaultPicture: function(){
      return '/assets/images/avatars/default.jpg';
    },

    getPicture: function(name, empl){
      name = this.formatEmplName(name);
      if (name == "No.Auditor.jpg"){
        return '/assets/images/avatars/silkTestLogo.png';
      }
      else if (empl.match(name.toLowerCase()) == null){
        return this.getDefaultPicture();
      }
      else{
        return 'http://austria/global/images/employees/' +  name;
      }
    },

    getAvatarClassSet: function(name){
      var cx = React.addons.classSet;
      return cx({
        'avatar': name !== 'No Auditor',
        'silkTest': name === 'No Auditor'
      });
    },

    getAuditorPic: function(auditor){
      var empl = this.props.employeesAustria.toLowerCase();
      var picture = '/user/' + this.formatEmplName(auditor.realName);
      var avatarClass = this.getAvatarClassSet(auditor.realName);
      var avatarUrlStyle = {
          backgroundImage: 'url(' + picture + ')',
          backgroundSize: 'cover'
      };

      return (
          <div className={avatarClass}
               style={avatarUrlStyle}
               key={auditor.realName}
               title={auditor.realName} >
          </div>
      );
    },

    render: function() {
      var that = this;
      var auditNodes = this.props.audits.slice(0, 12).map(function(audit) {
        return (
          <li className="audit" key={audit.phid}>
            <div className="audit-name">
              {that.getAuditorPic(audit)}
            </div>
            <div className="audit-cnt">
              {audit.count}
            </div>
          </li>
        )}
      );

      return (
        <section className="audit-section">
          <h1> Open Audits </h1>
          <ul className="audit-list">
            {auditNodes}
          </ul>
        </section>
      );
    }
  });

  return Audits;
});
