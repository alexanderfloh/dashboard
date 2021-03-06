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
import play.api.Play.current
import util.PhabricatorFetcher
import models.Location
import models.MobileDevice
import play.api.cache.Cached
import util.JenkinsFetcherSilkTest
import util.ScFetcher
import util.BvtParser
import models.BvtResult

object Application extends Controller {

  def index = Action {
    Ok(views.html.index())
  }

  def buildMain = Cached.everything(req => "build.ci", 60) {
    Action.async {
      JenkinsFetcherSilkTest.fetchCiBuilds("buildCI", 4).map(Ok(_))
    }
  }

  def buildAside = Cached.everything(req => "build.nightly", 60 * 20) {
    Action.async {
      JenkinsFetcherSilkTest.fetchNightlyBuild("buildNightly").map(Ok(_))
    }
  }

  def getAudits() = Cached.everything(req => "audits", 60 * 5) {
    Action.async {
      PhabricatorFetcher.fetchAudits.map(Ok(_))
    }
  }

  def getBvtResult1 = Cached.everything(req => "bvtresult", 60 * 5) {
    Action.async {
      implicit val bvtResultWrites = BvtResult.writes
      ScFetcher.fetchWin10BVTs().map {
        BvtParser.parse(_)
          .groupBy(_.name)
          .toList
          .map {
            case (key, values) => {
              val valuesSorted = values.sortBy(v => v.build)
              Json.obj("name" -> key, "values" -> Json.toJson(valuesSorted))
            }

          }
      }
        .map { results => Json.obj("bvtResults" -> results) }
        .map { Ok(_) }
    }
  }

  def getBvtResult = Cached.everything(req => "bvtresult", 60 * 5) {
    Action.async {

      val grouped = ScFetcher.fetchWin10BVTs()
        .map(BvtParser.parse)
        .map(BvtParser.classify)
        .map(BvtParser.group)

      val r = grouped.map(_.map {
        case (group, configs) => {
          val runs = configs.map {
            case (config, runs) => {
              implicit val bvtResultWrites = BvtResult.writes
              val runsSorted = runs.sortBy(v => v.build)
              Json.obj(
                "name" -> runsSorted.head.name,
                "icon" -> config.icon,
                "runs" -> Json.toJson(runsSorted))
            }
          }
          Json.obj("name" -> group.name, "configs" -> runs)
        }
      }).map { results => Json.obj("bvtResults" -> results) }
        .map { Ok(_) }
      r
      //Future(Ok(""))
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
    val allDevices = MobileDevice.all
    val allDevicesSortedByName = allDevices.sortWith((md1, md2) => (md1.name compareToIgnoreCase md2.name) < 0);
    Ok(Json.toJson(allDevicesSortedByName))
  }
}

