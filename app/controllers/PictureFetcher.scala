package controllers

import play.api.mvc._
import scala.concurrent.Future
import play.api.libs.ws.WS
import play.api.Play.current
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play
import java.io.File
import com.typesafe.config.Config

object PictureFetcher extends Controller {
  def getPicture(name: String) = Action.async {
    val commonUrl = Play.current.configuration.getString("dashboard.users.forwardUrl").getOrElse(throw new RuntimeException("dashboard.users.forwardUrl not set"))
    Play.current.configuration.getObject("dashboard.users").map {
      userConfigsObj =>
      val userConfigs = userConfigsObj.toConfig()
      if(userConfigs.hasPath(name)) {
        redirectToCustomUrl(userConfigs, name)
      } else {
        redirectToCommonUrl(commonUrl, name)
      }
    }.getOrElse(Future(redirectToFallback()))
  }
  
  private def redirectToCustomUrl(userConfigs: Config, name: String): Future[Result] = {
    val targetUrl = userConfigs.getString(name)
    Future(Redirect(targetUrl))
  }
  
  private def redirectToCommonUrl(commonUrl: String, name: String) : Future[Result] = {
    val redirectUrl = s"$commonUrl$name.jpg" 
    WS.url(redirectUrl)
      .get
      .map { response => 
        if(response.status == 404) { 
          redirectToFallback()
        }
        else Redirect(redirectUrl)
      }
  }
  
  private def redirectToFallback() : Result = {
    Redirect("/assets/images/avatars/default.jpg")
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