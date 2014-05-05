package controllers

import play.api._
import play.api.mvc._
import play.api.libs.ws.WS
import scala.concurrent.ExecutionContext
import ExecutionContext.Implicits.global
import java.net.URI

object Application extends Controller {

  def index = Action {
    Ok(views.html.index("Your new application is ready."))
  }

  def fetchJson(url: String) = Action.async {
    val uri = URI.create(url)
    WS.url(uri.toString).get.map(response => Ok(response.json))
  }

}