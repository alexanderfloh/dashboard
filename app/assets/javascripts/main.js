requirejs.config({
  paths : {
    'jquery' : '../lib/jquery/jquery',
    'react' : '../lib/react/react-with-addons',
    'moment' : '../lib/momentjs/moment',
    'dashboardSilkTest' : '../jsx/dashboardSilkTest',
    'dashboardPerformer' : '../jsx/dashboardPerformer',
  }
});

define(function(require) {
  var config = "";
  $.ajax({
    url : '/getConfig',
    dataType : 'text',
    async: false,
  }).done(function(result){
    config = result;
  });

  var jQuery = require('jquery');
  var React = require('react');
  var dashboard;
  if (config == "silktest")
    dashboard = require('dashboardSilkTest');
  else if (config == "performer")
    dashboard = require('dashboardPerformer');
  
  React.renderComponent(dashboard(), document.getElementById('content'));
});
