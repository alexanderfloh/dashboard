requirejs.config({
  paths: {
    'jquery': '../lib/jquery/jquery',
    'react': '../lib/react/react-with-addons',
    'moment': '../lib/momentjs/moment',
    'dashboard': '../jsx/dashboard'
  }
});

define(function(require) {
  var jQuery = require('jquery'),
  React = require('react'),
  dashboard = require('dashboard');

  React.renderComponent(
    dashboard(),
    document.getElementById('content')
  );
});
