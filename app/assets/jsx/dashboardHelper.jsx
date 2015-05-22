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


function isUserInProject(user, project){
  var key = Object.keys(project.data)
  for (var i = 0; i < project.data[key].members.length; i++)
    if (project.data[key].members[i] == user.phid)
      return true;
  return false;
}

function getAuditsForUser(user, audits, project){
  var res = 0;
  if (!isUserInProject(user, project)) return res;
  for (var i = 0; i < audits.length; i++){
    if (user.phid == audits[i].auditorPHID &&
        audits[i].status != "accepted"){
      res++;
    }
  }
  return res;
}

function getNotAssignedAudits(audits, project){
  var res = 0;
  for(var i = 0; i<audits.length; i++){
      if (audits[i].status === "audit-required" &&
          audits[i].auditorPHID == Object.keys(project.data)){
        res++;
    }
  }
  return res;
}

function mergeUserAudits(users, audits, project){
  var resultArray = new Array();
  for (var i = 0; i < users.length; i++){
    var cnt = getAuditsForUser(users[i], audits, project);
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
      numberOfAudits : getNotAssignedAudits(audits, project)
  };
  resultArray.push(userAudit);
  
  return resultArray;
}

function getDefaultPicture(){
  return '/assets/images/avatars/default.jpg';
}
