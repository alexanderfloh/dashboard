package util

import scala.concurrent.Future
import play.api.Play
import play.api.libs.ws.WS
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import akka.util.HashCode
import java.security.MessageDigest
import java.lang.String
import scala.concurrent.duration.Duration
import scala.concurrent.Await
import java.util.concurrent.TimeoutException
import play.Logger

object PhabricatorFetcher {

  val config = Play.current.configuration

  def conduitConnect(baseUrl: String): Future[JsObject] = {
    val phabUser = config.getString("dashboard.phabUser")
      .getOrElse(throw new RuntimeException("dashboard.phabUser not configured"))
    val phabUserCert = config.getString("dashboard.phabUserCert")
      .getOrElse(throw new RuntimeException("dashboard.phabUserCert not configured"))

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

    val data = Json.obj(
      "params" -> connect_params,
      "output" -> "json",
      "__conduit__" -> true)

    WS.url(baseUrl + "api/conduit.connect")
      .withQueryString(
        ("params", connect_params.toString()),
        ("output", "json"),
        ("__conduit__", "True"))
      .post("")
      .map { response =>
        val json = Json.parse(response.body);
        Json.obj(
          "sessionKey" -> (json \\ "sessionKey").last,
          "connectionID" -> (json \\ "connectionID").last)
      }

  }

  def fetchPhabricatorUser(): Future[String] = {
    val baseUrl = config.getString("dashboard.urlPhabricator")
      .getOrElse(throw new RuntimeException("dashboard.urlPhabricator not configured"))

    val conduit = conduitConnect(baseUrl)
    conduit.flatMap { conduit =>
      val params = Json.obj(
        "__conduit__" -> conduit)

      WS.url(baseUrl + "api/user.query")
        .withQueryString(("params", params.toString()), ("output", "json"))
        .post("")
        .map { req =>
          val json = Json.parse(req.body)
          val list = (json \ "result").as[List[JsObject]]
          Json.prettyPrint(Json.obj("users" -> list))
        }
    }
  }

  def fetchPhabricatorProject(fetcher: String): Future[String] = {
    val baseUrl = config.getString("dashboard.urlPhabricator")
      .getOrElse(throw new RuntimeException("dashboard.urlPhabricator not configured"))

    val projectId = fetcher match {
      case "performer" => config.getString("dashboard.performer.phabProject")
        .getOrElse(throw new RuntimeException("dashboard.performer.phabProject not configured"))
      case "silktest" => config.getString("dashboard.silktest.phabProject")
        .getOrElse(throw new RuntimeException("dashboard.silktest.phabProject not configured"))
    }

    val conduit = conduitConnect(baseUrl)
    conduit.flatMap { conduit =>
      val params = Json.obj(
        "__conduit__" -> conduit,
        "phids" -> Json.arr(projectId))

      val response = WS.url(baseUrl + "api/project.query")
        .withQueryString(("params", params.toString()), ("output", "json"))
        .post("")

      response.map { response =>
        val json = Json.parse(response.body)
        val list = (json \ "result").as[JsObject]
        Json.prettyPrint(Json.obj("project" -> list))
      }
    }
  }

  def baseUrl = config.getString("dashboard.urlPhabricator")
    .getOrElse(throw new RuntimeException("dashboard.urlPhabricator not configured"))

  def fetchOpenAudits(): Future[String] = {

    val conduit = conduitConnect(baseUrl)
    conduit.flatMap { conduit =>
      val params = Json.obj(
        "__conduit__" -> conduit,
        "status" -> "audit-status-open")

      WS.url(baseUrl + "api/audit.query")
        .withQueryString(("params", params.toString()), ("output", "json"))
        .post("")
        .map { req =>
          val json = Json.parse(req.body)

          Json.prettyPrint(Json.obj("audits" -> json \ "result"))
        }
    }
  }

  def fetchAudits = {
    val allOpenAudits = fetchOpenAuditsJson
    allOpenAudits.flatMap { allOpenAudits =>
      val audits = (allOpenAudits \ "result").as[Seq[JsValue]]
      val auditsWithCommitIds = audits.map(audit => (audit, (audit \ "commitPHID").as[String]))
      val commitIds = auditsWithCommitIds.map { case (audit, commitId) => commitId }

      val conduit = conduitConnect(baseUrl)
      val commits = conduit.flatMap { conduit =>
        val params = Json.obj(
          "__conduit__" -> conduit,
          "names" -> commitIds)

        WS.url(baseUrl + "api/phid.lookup")
          .withQueryString(("params", params.toString()), ("output", "json"))
          .post("")
          .map { req => Json.parse(req.body) }
      }

      val result = commits.flatMap { commits =>
        val filteredAudits = auditsWithCommitIds.filter {
          case (audit, commitId) =>

            (commits \ "result" \ commitId \ "name").as[String].startsWith("rST")
        }.map { case (audit, commitId) => audit }

        val auditsWithAuditorIds = filteredAudits.map { audit => (audit, (audit \ "auditorPHID").as[String]) }
        val idsWithCount = auditsWithAuditorIds.groupBy { case (audit, auditorId) => auditorId }
          .map { case (auditorId, audits) => (auditorId, audits.length) }

        val auditorIds = idsWithCount.map { case (auditorId, count) => auditorId }

        val conduit = conduitConnect(baseUrl)
        val auditors = conduit.flatMap { conduit =>
          val params = Json.obj(
            "__conduit__" -> conduit,
            "phids" -> auditorIds)

          WS.url(baseUrl + "api/user.query")
            .withQueryString(("params", params.toString()), ("output", "json"))
            .post("")
            .map { req =>
              val auditorsJson = Json.parse(req.body)
              val auditors = (auditorsJson \ "result").as[Seq[JsValue]]
              auditors.map { auditor =>
                val id = (auditor \ "phid").as[String]
                val count = idsWithCount.getOrElse(id, 0)
                auditor.as[JsObject] + ("count", Json.toJson(count))
              }
            }
            
        }
        auditors
      }

      result.map { filteredAudits => Json.obj("audits" -> filteredAudits) }
    }
  }

  def fetchOpenAuditsJson: Future[JsValue] = {
    val baseUrl = config.getString("dashboard.urlPhabricator")
      .getOrElse(throw new RuntimeException("dashboard.urlPhabricator not configured"))

    val conduit = conduitConnect(baseUrl)
    conduit.flatMap { conduit =>
      val params = Json.obj(
        "__conduit__" -> conduit,
        "status" -> "audit-status-open")

      WS.url(baseUrl + "api/audit.query")
        .withQueryString(("params", params.toString()), ("output", "json"))
        .post("")
        .map { req =>
          Json.parse(req.body)
        }
    }
  }
}
