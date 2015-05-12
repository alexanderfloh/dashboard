package util

import scala.concurrent.Future
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
object PhabricatorFetcher {

  def conduitConnect(baseUrl: String, user: String, cert: String): JsObject = {
    val token = System.currentTimeMillis / 1000
    val md = java.security.MessageDigest.getInstance("SHA-1")
    val signature = md.digest((token.toString() + cert).getBytes("UTF-8")).map("%02x".format(_)).mkString

    val connect_params = Json.obj(
      "client" -> "Dashboard",
      "clientVersion" -> "0",
      "clientDescription" -> "Get commits where audit is needed",
      "user" -> user,
      "host" -> baseUrl,
      "authToken" -> token,
      "authSignature" -> signature)

    val data = Json.obj(
      "params" -> connect_params,
      "output" -> "json",
      "__conduit__" -> true)

    val response = WS.url(baseUrl + "api/conduit.connect")
      .withQueryString(("params", connect_params.toString()), ("output", "json"), ("__conduit__", "True")).post("")

    val conduit = response.map { respon =>
      val json = Json.parse(respon.body);
      Json.obj(
        "sessionKey" -> json.\\("sessionKey").last,
        "connectionID" -> json.\\("connectionID").last)
    }
    // we have to wait for the session
    Await.result(conduit, Duration(3000, "millis"))
  }

  def fetchPhabricatorUser(baseUrl: String, user: String, cert: String): Future[String] = {
    val params = Json.obj(
      "__conduit__" -> conduitConnect(baseUrl, user, cert))

    val request = WS.url(baseUrl + "api/user.query")
      .withQueryString(("params", params.toString()), ("output", "json")).post("")

    request.map { req =>
      val json = Json.parse(req.body)
      val list = (json\"result").as[List[JsObject]]
            
      Json.prettyPrint(Json.obj(
        "users" -> list))
    }
  }

  def fetchOpenAudits(baseUrl: String, user: String, cert: String): Future[String] = {
    val params = Json.obj(
      "__conduit__" -> conduitConnect(baseUrl, user, cert),
      "status" -> "audit-status-open")
    val request = WS.url(baseUrl + "api/audit.query")
      .withQueryString(("params", params.toString()), ("output", "json")).post("")
    request.map { req =>
      val json = Json.parse(req.body)
      Json.prettyPrint(Json.obj(
        "audits" -> json.\("result")))
    }
  }
}