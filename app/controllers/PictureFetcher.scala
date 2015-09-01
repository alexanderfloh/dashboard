package controllers

import play.api.mvc._
import scala.concurrent.Future
import play.api.libs.ws.WS
import play.api.Play.current
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play

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
}