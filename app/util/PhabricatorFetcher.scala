package util

import scala.concurrent.Future
import play.api.Play
import play.api.libs.ws.WS
import play.api.libs.ws.WSRequestHolder
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import java.util.Date
import play.Logger
import models.NevergreenResult
import scala.util.parsing.json.JSONArray
import akka.util.HashCode
import java.security.MessageDigest
import java.lang.String
import scala.concurrent.duration.Duration
import scala.concurrent.Await
import java.util.concurrent.TimeoutException
object PhabricatorFetcher {

  def conduitConnect(baseUrl: String): JsObject = {
    val phabUser = Play.current.configuration.getString("dashboard.phabUser")
      .getOrElse(throw new RuntimeException("dashboard.phabUser not configured"))
    val phabUserCert = Play.current.configuration.getString("dashboard.phabUserCert")
      .getOrElse(throw new RuntimeException("dashboard.phabUserCert not configured"))

    val token = System.currentTimeMillis / 1000
    val md = java.security.MessageDigest.getInstance("SHA-1")
    val signature = md.digest((token.toString() + phabUserCert).getBytes("UTF-8")).map("%02x".format(_)).mkString

    val connect_params = Json.obj(
      "client" -> "Dashboard",
      "clientVersion" -> "0",
      "clientDescription" -> "Get commits where audit is needed",
      "user" -> phabUser,
      "host" -> baseUrl,
      "authToken" -> token,
      "authSignature" -> signature)

    val data = Json.obj(
      "params" -> connect_params,
      "output" -> "json",
      "__conduit__" -> true)

    try {
      Await.result(WS.url(baseUrl + "api/conduit.connect")
        .withQueryString(("params", connect_params.toString()), ("output", "json"), ("__conduit__", "True"))
        .post("")
        .map { respon =>
          val json = Json.parse(respon.body);
          Json.obj(
            "sessionKey" -> json.\\("sessionKey").last,
            "connectionID" -> json.\\("connectionID").last)
        }, Duration(1000, "millis"))
    } catch {
      case e: IllegalArgumentException => println("Faild: Get phabricator session (IllegalArgumentException)"); null;
      case e: InterruptedException     => println("Faild: Get phabricator session (InterruptedException)"); null;
      case e: TimeoutException         => println("Faild: Get phabricator session (TimeoutException)"); null;
    }

  }

  def fetchPhabricatorUser(): Future[String] = {
    val baseUrl = Play.current.configuration.getString("dashboard.urlPhabricator")
      .getOrElse(throw new RuntimeException("dashboard.urlPhabricator not configured"))
    val conduit = conduitConnect(baseUrl)
    if (conduit == null) {
      null
    } else {
      val params = Json.obj(
        "__conduit__" -> conduit)

      WS.url(baseUrl + "api/user.query")
        .withQueryString(("params", params.toString()), ("output", "json"))
        .post("")
        .map { req =>
          val json = Json.parse(req.body)
          val list = (json \ "result").as[List[JsObject]]
          Json.prettyPrint(Json.obj(
            "users" -> list))
        }
    }
  }

  def fetchPhabricatorProject(fetcher: String): Future[String] = {
    val baseUrl = Play.current.configuration.getString("dashboard.urlPhabricator")
      .getOrElse(throw new RuntimeException("dashboard.urlPhabricator not configured"))
    var projectId = ""
    fetcher match {
      case "performer" => projectId = Play.current.configuration.getString("dashboard.performer.phabProject")
        .getOrElse(throw new RuntimeException("dashboard.performer.phabProject not configured"))
      case "silktest" => projectId = Play.current.configuration.getString("dashboard.silktest.phabProject")
        .getOrElse(throw new RuntimeException("dashboard.silktest.phabProject not configured"))
    }

    val conduit = conduitConnect(baseUrl)
    if (conduit == null) {
      null
    } else {
      val params = Json.obj(
        "__conduit__" -> conduit,
        "phids" -> Json.arr(projectId))

      WS.url(baseUrl + "api/project.query")
        .withQueryString(("params", params.toString()), ("output", "json"))
        .post("")
        .map { req =>
          val json = Json.parse(req.body)
          val list = (json \ "result").as[JsObject]
          Json.prettyPrint(Json.obj(
            "project" -> list))
        }
    }
  }

  def fetchOpenAudits(): Future[String] = {
    val baseUrl = Play.current.configuration.getString("dashboard.urlPhabricator")
      .getOrElse(throw new RuntimeException("dashboard.urlPhabricator not configured"))
    val conduit = conduitConnect(baseUrl)
    if (conduit == null) {
      null
    } else {
      val params = Json.obj(
        "__conduit__" -> conduit,
        "status" -> "audit-status-open")

      WS.url(baseUrl + "api/audit.query")
        .withQueryString(("params", params.toString()), ("output", "json"))
        .post("")
        .map { req =>
          val json = Json.parse(req.body)
          Json.prettyPrint(Json.obj(
            "audits" -> json.\("result")))
        }
    }
  }
}