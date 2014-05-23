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

  def fetchAll(baseUrl: String) = Action.async {
    def fetchLastCompleted(baseUrl: String, buildNumber: Int): Future[JsObject] = {
      val url = s"$baseUrl/$buildNumber/api/json?tree=culprits[fullName],changeSet[items[*]]"
      WS.url(url).get.map { responseDetails =>
        val json = Json.parse(responseDetails.body)
        Json.obj(
          "buildNumber" -> buildNumber,
          "culprits" -> (json \ "culprits"),
          "changesetItems" -> (json \ "changeSet" \ "items"))
      }
    }

    def fetchLastBuild(baseUrl: String, buildNumber: Int): Future[JsObject] = {
      val url = s"$baseUrl/$buildNumber/api/json"
      WS.url(url).get.map { response =>
        val json = Json.parse(response.body)
        Json.obj(
          "buildNumber" -> buildNumber,
          "estimatedDuration" -> (json \ "estimatedDuration"),
          "timestamp" -> (json \ "timestamp"),
          "building" -> (json \ "building"))
      }
    }

    WS.url(baseUrl + "/api/json").get.flatMap { response =>
      val json = Json.parse(response.body)
      val lastCompletedBuild = (json \ "lastCompletedBuild" \ "number").as[Int]
      val lastBuild = (json \ "lastBuild" \ "number").as[Int]
      val lastSuccessfulBuild = (json \ "lastSuccessfulBuild" \ "number")
      val lastStableBuild = (json \ "lastStableBuild" \ "number")

      for {
        lastCompletedDetails <- fetchLastCompleted(baseUrl, lastCompletedBuild)
        lastBuildDetails <- fetchLastBuild(baseUrl, lastBuild)
      } yield {
        Ok(Json.obj(
          "lastCompletedBuild" -> lastCompletedDetails,
          "lastSuccessfulBuild" -> lastSuccessfulBuild,
          "lastStableBuild" -> lastStableBuild,
          "lastBuild" -> lastBuildDetails))
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