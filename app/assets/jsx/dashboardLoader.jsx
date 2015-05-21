function getStatusMixin(){
  return {
      getInitialState: initState,
      loadStatus: loadStatusFunc,
      componentWillMount: compWillMount,
  };
}

  function initState(){
    return {
      buildCI: [],
      buildNightly: [],
      users:[],
      project:[],
      audits:[],
      lastBuild:[],
      nevergreens:[],
      employeesAustria:""
    };
  }
  
  function loadStatusFunc(){
    $.ajax({
      url: '/buildMain',
      dataType: 'json',
      success: function(data1) {
        this.setState(data1);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
    
    $.ajax({
        url: '/buildAside',
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
  }
  
  function compWillMount() {
    this.loadStatus();
    setInterval(this.loadStatus, this.props.pollInterval);
  }