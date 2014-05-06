package controllers

import play.api._
import play.api.mvc._
import play.api.libs.ws.WS
import scala.concurrent.ExecutionContext
import ExecutionContext.Implicits.global
import java.net.URI
import play.api.libs.json.Json
import play.api.libs.json._
import play.api.data._
import play.api.data.Forms._

object Application extends Controller {
  
  var devices = Map[String, String]("Apple iPod;82B776F8950C9F0738D32CB91F670E70DAF8C796" -> "none",
      "GT-I9300;7&10457552&0&0000" -> "none")

  def index = Action {
    Ok(views.html.index("Your new application is ready."))
  }

  def fetchJson(url: String) = Action.async {
    val uri = URI.create(url)
    WS.url(uri.toString).get.map(response => Ok(response.json))
  }
  def setDevice() = Action { implicit request =>
	val userForm = Form(
	    tuple(
	    "device" -> text,
	    "system" -> text,
	    "id" -> text
	    )
	)
    val (deviceName, system, id) = userForm.bindFromRequest.get;
    Logger.info("Device is: " + deviceName + " " + system + " " + id);
    if(devices.isDefinedAt(deviceName + ";" + id)) {
    	devices += (deviceName + ";" + id) -> system;
    }
    Ok(id)
  }

  def getDevices() = Action {
    val v = Json.toJson(devices)
    val ds = Json.obj("devices" -> v)
    Ok(Json.stringify(ds))
  }

}