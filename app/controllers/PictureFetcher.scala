package controllers

import play.api.mvc._
import scala.concurrent.Future
import play.api.libs.ws.WS
import play.api.Play.current
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play
import java.io.File

object PictureFetcher extends Controller {
  def getPicture(name: String) = Action.async {
    val defaultUrl = Play.current.configuration.getString("dashboard.users.forwardUrl").getOrElse(throw new RuntimeException("dashboard.users.forwardUrl not set"))
    WS.url(s"$defaultUrl$name")
      .get
      .map { response => 
        if(response.status == 404) { 
          Play.current.configuration.getObject("dashboard.users").map {
            userConfigs =>
              
            val targetUrl = userConfigs.toConfig().getString(name)
            Redirect(targetUrl)
          }.getOrElse(Redirect("/assets/images/avatars/default.jpg"))
        }
        else Redirect(s"$defaultUrl$name")
    }
    
    
  }
  
  def getIcon(name: String) = Action {
    Play.current.configuration.getObject("dashboard.icons").map {
      iconConfig =>
        if(iconConfig.toConfig().hasPath(name)) {
          val fileName = iconConfig.toConfig().getString(name)
          val file = new File("public/images/icons", fileName)
          if(file.exists) Ok.sendFile(file)
          else NotFound(file.getCanonicalPath)
        }
        else NotFound(name)
    }.getOrElse(throw new RuntimeException("dashboard.icons not configured"))
  }
}