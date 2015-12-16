package models

import scala.concurrent.Future
import play.api.Play
import util.PhabricatorFetcher
import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.api.libs.ws.WS
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play.current
import play.api.mvc.Results

object Phabricator {
  type PHID = String
  type UserPHID = String
  type Conduit = JsObject
  
  def query(subUrl: String, parameters: JsObject)(implicit conduit: Conduit): Future[JsValue] = {
    query(subUrl, ("params", makeParams(parameters)))
  }

  private def baseUrl = config.getString("dashboard.urlPhabricator")
    .getOrElse(throw new RuntimeException("dashboard.urlPhabricator not configured"))

  private def query(subUrl: String, parameters: (String, String)*): Future[JsValue] = {
    val parametersWithFormatting = parameters ++ Seq(("output", "json"))
    WS
      .url(baseUrl + subUrl)
      .withQueryString(parametersWithFormatting: _*)
      .post(Results.EmptyContent())
      .map { r => Json.parse(r.body) }
  }

  private def makeParams(params: JsObject)(implicit conduit: Conduit) = {
    Json.stringify(params ++ Json.obj("__conduit__" -> conduit))
  }

  private def phabUser = config.getString("dashboard.phabUser")
    .getOrElse(throw new RuntimeException("dashboard.phabUser not configured"))
  private def phabUserCert = config.getString("dashboard.phabUserCert")
    .getOrElse(throw new RuntimeException("dashboard.phabUserCert not configured"))

  def conduitConnect(baseUrl: String): Future[Conduit] = {

    val token = System.currentTimeMillis / 1000
    val md = java.security.MessageDigest.getInstance("SHA-1")
    val signature = md.digest((token.toString() + phabUserCert).getBytes("UTF-8"))
      .map("%02x".format(_)).mkString

    val connect_params = Json.obj(
      "client" -> "Dashboard",
      "clientVersion" -> "0",
      "clientDescription" -> "Get commits where audit is needed",
      "user" -> phabUser,
      "host" -> baseUrl,
      "authToken" -> token,
      "authSignature" -> signature)

    WS.url(baseUrl + "api/conduit.connect")
      .withQueryString(
        ("params", connect_params.toString()),
        ("output", "json"),
        ("__conduit__", "True"))
      .post(Results.EmptyContent())
      .map { response =>
        val json = Json.parse(response.body);
        val result = (json \ "result").asOpt[JsValue].flatMap { Option(_) }
        result.map { result =>
          Json.obj(
            "sessionKey" -> (result \\ "sessionKey").last,
            "connectionID" -> (result \\ "connectionID").last)
        }.getOrElse {
          val errorInfo = (json \ "error_info").asOpt[String].flatMap { Option(_) }
          errorInfo match {
            case Some(error) => throw new RuntimeException(error)
            case None        => throw new RuntimeException("unkown error occurred when trying to connect to phabricator")
          }
        }

      }

  }

  private def config = Play.current.configuration
}