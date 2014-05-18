package controllers

import java.net.URI

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import models.Location
import models.MobileDevice
import play.api.Logger
import play.api.Play
import play.api.data.Form
import play.api.data.Forms.text
import play.api.data.Forms.tuple
import play.api.libs.json.Json
import play.api.libs.ws.WS
import play.api.mvc.Action
import play.api.mvc.Controller
import util.MockResponseGenerator

object Application extends Controller {

  def index = Action {
    Ok(views.html.index("Your new application is ready."))
  }

  def fetchJson(url: String) = Action.async {
    if (Play.current.configuration.getBoolean("dashboard.mockResponse").getOrElse(false)) {
      Future(Ok(MockResponseGenerator(url)))
    } else {
      val uri = URI.create(url)
      WS.url(uri.toString).get.map(response => Ok(response.json))
    }
  }

  def setDevice() = Action { implicit request =>
    val userForm = Form(
      tuple(
        "device" -> text,
        "system" -> text,
        "id" -> text))
    val (deviceName, system, deviceId) = userForm.bindFromRequest.get;
    Logger.info(s"Device is: $deviceName $system $deviceId");
    MobileDevice.byDeviceId(deviceId) match {
      case Some(device) => {
        val location = Location.findOrCreate(system)
        MobileDevice.setLocation(device, location.id)
        Ok(deviceId)
      }
      case None => {
        Logger.info(s"unkown device '$deviceId'")
        NotFound(deviceId)
      }
    }
  }

  def getDevices() = Action {
    implicit val jsonWrites = MobileDevice.jsonWrites
    Ok(Json.toJson(MobileDevice.all))
  }

}