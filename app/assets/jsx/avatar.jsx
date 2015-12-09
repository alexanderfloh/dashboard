/** @jsx React.DOM */

define(['react'], function(React) {
  var Avatar = React.createClass({
    propTypes: {
      name: React.PropTypes.string.isRequired,
      badgeRight: React.PropTypes.any,
      badgeLeft: React.PropTypes.any,
    },

    urlSafeName: function(name){
      return this.props.name.replace(" ", ".")
                           .replace(/ä/g,"ae")
                           .replace(/ö/g,"oe")
                           .replace(/ü/g,"ue")
                           .replace(/Ä/g,"Ae")
                           .replace(/Ü/g,"Ue")
                           .replace(/Ö/g,"Oe")
                           .replace(/ß/g,"ss");
    },

    getAvatarClassSet: function(){
      var name = this.props.name;
      var cx = React.addons.classSet;
      return cx({
        'avatar': name !== 'No Auditor',
        'silkTest': name === 'No Auditor'
      });
    },

    render: function(auditor){
      var avatarClass = this.getAvatarClassSet();
      var picture = '/user/' + this.urlSafeName() + '.jpg';
      var avatarUrlStyle = {
          backgroundImage: 'url(' + picture + ')',
          backgroundSize: 'cover'
      };

      var badgeRight = null;
      if(this.props.badgeRight) {
        badgeRight = <div className='avatar-badge right'>{this.props.badgeRight}</div>;
      }

      var badgeLeft = null;
      if(this.props.badgeLeft) {
        badgeLeft = <div className='avatar-badge left'>{this.props.badgeLeft}</div>
      }

      return (
          <div
               className={avatarClass}
               style={avatarUrlStyle}
               title={this.props.name} >
               {badgeLeft}
               {badgeRight}
          </div>
      );
    },
  });
  return Avatar;
});
