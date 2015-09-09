/** @jsx React.DOM */

define(['react'], function(React) {
  var Avatar = React.createClass({
    propTypes: {
      name: React.PropTypes.string.isRequired,
      badge: React.PropTypes.any,
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

      var badge = null;
      if(this.props.badge) {
        badge = <div className='avatar-badge'>{this.props.badge}</div>;
      }

      return (
          <div
               className={avatarClass}
               style={avatarUrlStyle}
               title={this.props.name} >
               {badge}
          </div>
      );
    },
  });
  return Avatar;
});
