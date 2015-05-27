package controllers

import java.net.URI
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import play.api.Logger
import play.api.Play
import play.api.data.Form
import play.api.data.Forms.text
import play.api.data.Forms.tuple
import play.api.libs.json.Json
import play.api.libs.ws.WS
import play.api.mvc.Action
import play.api.mvc.Controller
import play.api.libs.json.JsArray
import play.api.libs.json.JsValue
import play.api.libs.json.JsObject
import play.api.libs.concurrent.Akka
import play.api.Play.current
import akka.pattern.ask
import akka.util.Timeout
import scala.concurrent.duration._
import util.JenkinsFetcherFactory
import util.PhabricatorFetcher
import scala.concurrent.Await
import models.Location
import models.MobileDevice
import util.UserFetcher

object Application extends Controller {

  def index = Action {
    Ok(views.html.index())
  }

  def fetcher = Play.current.configuration.getString("dashboard.fetcher")
    .getOrElse(throw new RuntimeException("dashboard.fetcher not configured"))

  def buildMain = Action.async {
    JenkinsFetcherFactory.getFetcher(fetcher).fetchMain("buildCI", 4).map(Ok(_))
  }

  def buildAside = Action.async {
    JenkinsFetcherFactory.getFetcher(fetcher).fetchAside("buildNightly", 1).map(Ok(_))
  }

  def getConfig = Action.async {
    Future(fetcher).map { Ok(_) }
  }

  def getPhabUser = Action.async {
    val response = PhabricatorFetcher.fetchPhabricatorUser();
    if (response == null)
      Future("").map { Ok(_) }
    else
      response.map { Ok(_) }
  }

  def getPhabProject = Action.async {
    val response = PhabricatorFetcher.fetchPhabricatorProject(fetcher);
    if (response == null)
      Future("").map { Ok(_) }
    else
      response.map { Ok(_) }
  }

  def getPhabAudits = Action.async {
    val response = PhabricatorFetcher.fetchOpenAudits();
    if (response == null)
      Future("").map { Ok(_) }
    else
      response.map { Ok(_) }
  }
  
  def getUsers() = Action.async {
    val response = UserFetcher.getUsers("http://austria/global/images/employees/");
    response.map { Ok(_) }
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
    val allDevices = MobileDevice.all
    val allDevicesSortedByName = allDevices.sortWith((md1, md2) => (md1.name compareToIgnoreCase md2.name) < 0);
    Ok(Json.toJson(allDevicesSortedByName))
  }
}

