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
import play.api.libs.json.JsArray
import play.api.libs.json.JsValue
import play.api.libs.json.JsObject
import play.api.libs.concurrent.Akka
import play.api.Play.current
import akka.pattern.ask
import actors.GetResponseCi
import akka.util.Timeout
import scala.concurrent.duration._
import actors.GetResponseNightly
import util.CI
import util.Nightly

object Application extends Controller {

  def index = Action {
    Ok(views.html.index())
  }

  def fetchAllCi = Action.async {
    if (Play.current.configuration.getBoolean("dashboard.mockResponse").getOrElse(false)) {
      Future(Ok(MockResponseGenerator(CI)))
    } else {
      implicit val timeout = Timeout(5.seconds)
      val router = Akka.system.actorSelection("/user/router")
      router.ask(GetResponseCi).mapTo[String].map { response =>
        Ok(response)
      }
    }
  }

  def fetchAllNightly = Action.async {
    if (Play.current.configuration.getBoolean("dashboard.mockResponse").getOrElse(false)) {
      Future(Ok(MockResponseGenerator(Nightly)))
    } else {
      implicit val timeout = Timeout(5.seconds)
      val router = Akka.system.actorSelection("/user/router")
      router.ask(GetResponseNightly).mapTo[String].map { response =>
        Ok(response)
      }
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
        Ok(s"registered $deviceId")
      }
      case None => {
        Logger.info(s"unknown device '$deviceId'")
        Ok(s"unknown device '$deviceId'")
      }
    }
  }

  def getDevices() = Action {
    implicit val jsonWrites = MobileDevice.jsonWrites
    Ok(Json.toJson(MobileDevice.all))
  }

}